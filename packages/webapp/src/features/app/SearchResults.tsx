import { useAppDispatch, useAppSelector } from "@/store.hooks";
import { loadNextPage, selectPost } from "./app.slice";
import { Button } from "@/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/utils/ui";
import { useEffect, useRef } from "react";

const PREVIEW_SIZE = 120;
const previewStyle = {
  width: `${PREVIEW_SIZE}px`,
  height: `${PREVIEW_SIZE}px`,
};
// how many pixels do you want to be away from the bottom to trigger
// next page load
const LOAD_NEXT_SCROLL_THRESHOLD = PREVIEW_SIZE * 2;

type PostPreviewProps = {
  idx: number;
};
function PostPreview({ idx }: PostPreviewProps) {
  const postsCount = useAppSelector((state) => state.app.browsePosts.length);
  const post = useAppSelector((state) => state.app.browsePosts.at(idx));
  const isSelected = useAppSelector((state) => state.app.browseCursor === idx);
  const dispatch = useAppDispatch();
  function handleClick() {
    dispatch(selectPost(idx));
  }

  const previewRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    let current = previewRef.current;
    if (current == null) return;
    if (isSelected) {
      // if it's one of the first few posts, or one of the last few posts,
      // i want it to scroll as far as it can, so padding and any extra elements
      // (like the load next page button) are visible
      if (idx < 4) {
        current.scrollIntoView({
          block: "end",
        });
      } else if (postsCount - idx < 4) {
        current.scrollIntoView({
          block: "start",
        });
      } else {
        current.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [idx, postsCount, isSelected]);

  if (post == null) return null;

  return (
    <img
      ref={previewRef}
      className={cn(
        "object-contain object-center border-2 border-slate-200 bg-white",
        isSelected && "border-orange-400 bg-orange-400",
      )}
      onClick={handleClick}
      style={previewStyle}
      src={post.preview_url}
      alt={`${post.id} ${post.tags.join(" ")}`}
    />
  );
}

function LoadNextPageButton() {
  const searchNextPage = useAppSelector((store) => store.app.searchNextPage);
  const searchLoading = useAppSelector((store) => store.app.searchLoading);
  const dispatch = useAppDispatch();

  let content: React.ReactNode = <>load next page</>;
  if (searchLoading) {
    content = (
      <>
        <FontAwesomeIcon icon={faArrowsRotate} spin /> loading next page
      </>
    );
  } else if (searchNextPage == null) {
    content = <>end of posts</>;
  }

  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      disabled={searchNextPage == null || searchLoading}
      onClick={() => dispatch(loadNextPage())}
    >
      {content}
    </Button>
  );
}

export default function SearchResults() {
  const browsePosts = useAppSelector((store) => store.app.browsePosts);
  const searchNextPage = useAppSelector((store) => store.app.searchNextPage);
  const searchLoading = useAppSelector((store) => store.app.searchLoading);
  const dispatch = useAppDispatch();

  function handleScroll(evt: React.UIEvent<HTMLElement>) {
    if (browsePosts.length === 0 || searchNextPage == null) return;

    const el = evt.currentTarget;
    const scrollHeight = el.scrollHeight;
    const height = el.offsetHeight;
    const scroll = el.scrollTop;

    if (scrollHeight - (scroll + height) <= LOAD_NEXT_SCROLL_THRESHOLD) {
      if (!searchLoading) dispatch(loadNextPage());
    }
  }

  return (
    <div
      className="flex-grow flex-shrink w-full h-full overflow-y-auto py-2"
      onScroll={handleScroll}
    >
      <div className="flex flex-row flex-wrap gap-4 items-center justify-center">
        {browsePosts.map((post, idx) => (
          <PostPreview key={post.id} idx={idx} />
        ))}
        {browsePosts.length % 2 !== 0 && <div style={previewStyle} />}
      </div>
      <div className="w-full p-2 flex items-center justify-center">
        <LoadNextPageButton />
      </div>
    </div>
  );
}
