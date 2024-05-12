import { useAppSelector } from "@/store.hooks";
import { selectCurrentPost } from "./app.slice";
import { Button } from "@/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeLowVision,
  faImage,
  faTags,
  faThumbsDown,
  faThumbsUp,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { PostRating } from "@atsugami/common/types";
import { assertUnreachable } from "@/utils/atsugami";
import findNearestAspectRatio from "@/utils/nearestAspectRatio";

function Score({ score }: { score: number }) {
  let icon = score >= 0 ? faThumbsUp : faThumbsDown;
  let color = score >= 0 ? "text-stone-950" : "text-red-500";
  return (
    <div className="flex items-center justify-start gap-1">
      <FontAwesomeIcon fixedWidth icon={icon} />
      <span>
        Score: <span className={color}>{score}</span>
      </span>
    </div>
  );
}

function Dimensions({ width, height }: { width: number; height: number }) {
  // TODO: clean this god forsaken mess up
  let textAspectRatio = (Math.round((width / height) * 100) / 100).toFixed(2);
  let { nearestRatio, offBy } = findNearestAspectRatio({ width, height });
  let ratioContent = null;
  let nearestIsExact = offBy === 0;

  let titleBuilder = [`ratio: `];
  +textAspectRatio !== width / height && titleBuilder.push("~");
  titleBuilder.push(textAspectRatio);
  if (nearestRatio) {
    let textNearestRatio = (
      Math.round((nearestRatio.w / nearestRatio.h) * 100) / 100
    ).toFixed(2);
    titleBuilder.push(`, `);
    !nearestIsExact && titleBuilder.push(`near `);
    titleBuilder.push(`${nearestRatio.w}:${nearestRatio.h}`);
    !nearestIsExact && titleBuilder.push(` (${textNearestRatio})`);
    ratioContent = (
      <span>
        ({!nearestIsExact && "~"}
        {nearestRatio.w}:{nearestRatio.h})
      </span>
    );
  }
  if (nearestRatio) {
    titleBuilder.push(`: ${nearestRatio.desc}`);
  }

  return (
    <div className="flex items-center justify-start gap-1">
      <FontAwesomeIcon fixedWidth icon={faImage} />
      <span title={titleBuilder.join("")}>
        {width} x {height} {ratioContent}
      </span>
    </div>
  );
}

function Rating({ rating }: { rating: PostRating }) {
  let icon = faEye;
  let color = "text-green-500";
  switch (rating) {
    case "general":
    case "safe":
      icon = faEye;
      color = "text-green-500";
      break;
    case "questionable":
    case "sensitive":
      icon = faEyeLowVision;
      color = "text-orange-500";
      break;
    case "explicit":
      icon = faEyeLowVision;
      color = "text-red-500";
      break;
    default:
      assertUnreachable(rating);
  }

  return (
    <div className="flex items-center justify-start gap-1">
      <FontAwesomeIcon fixedWidth icon={icon} />
      <span>
        Rating: <span className={color}>{rating}</span>
      </span>
    </div>
  );
}

export type PostInfoPanelProps = {
  onMouseOver?: (e: React.MouseEvent<HTMLElement>) => unknown;
  onMouseOut?: (e: React.MouseEvent<HTMLElement>) => unknown;
};
export default function PostInfoPanel({
  onMouseOver,
  onMouseOut,
}: PostInfoPanelProps) {
  let selectedPost = useAppSelector(selectCurrentPost);

  if (selectedPost == null) return null;

  return (
    <div
      className="overflow-x-hidden pointer-events-auto bg-white h-min max-h-full w-[230px] shadow-md rounded-md p-4"
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      <div className="py-4 flex flex-col gap-2 align-center items-start">
        <Button size="sm" asChild variant="outline">
          <a
            className="gap-1 justify-start flex-shrink-0 flex-grow-0"
            href={selectedPost.post_url}
            rel="noreferrer"
            target="_blank"
          >
            <FontAwesomeIcon fixedWidth icon={faUpRightFromSquare} /> Open post
            in booru
          </a>
        </Button>
        <Button size="sm" asChild variant="outline">
          <a
            className="gap-1 justify-start flex-shrink-0 flex-grow-0"
            href={selectedPost.unproxied_file_url}
            rel="noreferrer"
            target="_blank"
          >
            <FontAwesomeIcon fixedWidth icon={faUpRightFromSquare} /> Open file
            in booru
          </a>
        </Button>
        <div className="px-3 text-sm w-full">
          <Score score={selectedPost.score} />
          <Rating rating={selectedPost.rating} />
          <Dimensions width={selectedPost.width} height={selectedPost.height} />
          {/* TODO: file size? */}
          {/* TODO: source */}
          <div className="my-2 w-full border-stone-200 border-t" />
        </div>
        <div className="px-3 gap-1 flex items-center">
          <FontAwesomeIcon fixedWidth icon={faTags} />
          <span>Tags</span>
        </div>
        <ul className="px-3 list-disc text-sm gap-1 w-full">
          {selectedPost.tags.map((tag) => (
            <li className="truncate leading-relaxed" title={tag} key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
