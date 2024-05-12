// HACK: opt out of bun's env injection at build time
// https://github.com/oven-sh/bun/issues/3835
import process from "process";

export const PROXY_SECRET = process.env.PROXY_SECRET!;
if (PROXY_SECRET == null || PROXY_SECRET.length !== 64) {
  throw new Error(
    "Invalid PROXY_SECRET envvar! Generate one with `openssl rand -hex 32`",
  );
}
