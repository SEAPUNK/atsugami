import { $ } from "bun";
import path from "node:path";
import chalk from "chalk";

let repoRoot = (await $`git rev-parse --show-toplevel`.text()).trim();
console.warn(`Repo root: ${chalk.bold(repoRoot)}`);

// change path to repo root, we're doing everything from there
// this allows us to not have to deal with git being funky with its commands
process.chdir(repoRoot);

let tempDir = path.resolve(repoRoot, ".temp");
console.warn(`Cleaning temp dir ${chalk.bold(tempDir)}`);
await $`rm -rf ${tempDir}`;
await $`mkdir -p ${tempDir}`;

// because we won't be including untracked files into the build context
// (for security and sanity reasons), warn the user that they won't be added
let untrackedFiles = (
  await $`git ls-files --exclude-standard --others`.text()
).trim();
if (untrackedFiles !== "") {
  console.warn(
    [
      chalk.bold.yellow("WARNING!"),
      "There are untracked files that",
      chalk.bold("will not"),
      "be included in the docker image!",
    ].join(" "),
  );
  console.warn("If you want them to be included, stage them in git.");
  console.warn("Untracked files:");
  console.warn(chalk.cyan(untrackedFiles));
}

// all other tracked files will be added to the archive, however
let archivePath = path.resolve(tempDir, "atsugami.tar.gz");
console.warn(chalk.magenta("Creating archive..."));
await $`git ls-files | tar Tzcfv - ${archivePath}`;

// HACK: i need to use groundcontrol, but apparently it's
// no longer published on github... so i need to build it locally
// https://github.com/malyn/groundcontrol/issues/1
{
  console.warn(chalk.magenta("Building groundcontrol image..."));
  let { exitCode } =
    await $`docker build https://github.com/malyn/groundcontrol.git -t groundcontrol`.nothrow();
  exitCode && process.exit(exitCode);
}

function splitMultilineEnv(envvar: string) {
  return envvar
    .trim()
    .split("\n")
    .map((str) => str.trim());
}

// github CI: apply labels to images
let imageLabelsArgs = { raw: "" };
if (process.env.CI_IMAGE_LABELS) {
  imageLabelsArgs = {
    raw: splitMultilineEnv(process.env.CI_IMAGE_LABELS).reduce(
      (arg, label) => `${arg} --label ${$.escape(label)}`,
      "",
    ),
  };
}

// finally, get docker to build it
{
  console.warn(chalk.magenta("Building docker image..."));
  let { exitCode } =
    await $`docker build -t atsugami ${imageLabelsArgs} --build-arg GROUNDCONTROL_TAG=groundcontrol - < ${archivePath}`.nothrow();
  exitCode && process.exit(exitCode);
}

// github CI: tag images, push them, and set image digest as the output
if (process.env.CI_IMAGE_TAGS) {
  let tags = splitMultilineEnv(process.env.CI_IMAGE_TAGS);
  for (let tag of tags) {
    console.warn(chalk.magenta(`Tagging and pushing ${chalk.cyan(tag)}`));
    await $`docker tag atsugami ${tag}`;
    await $`docker push ${tag}`;
  }
  console.warn(chalk.magenta(`Determining image digest...`));
  let imageDigest = (
    await $`docker inspect --format='{{.Id}}' atsugami`.text()
  ).trim();
  await $`echo ${`digest=${imageDigest}`} >> "$GITHUB_OUTPUT"`;
}
