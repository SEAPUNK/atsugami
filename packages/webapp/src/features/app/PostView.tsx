import { useAppSelector } from "@/store.hooks";
import React, { useEffect, useRef, useState } from "react";
import { selectCurrentPost } from "./app.slice";
import { Post } from "@atsugami/common/types";
import LoadableImage from "./LoadableImage";
import BrowseControls from "./BrowseControls";
import PostInfoPanel from "./PostInfoPanel";
import ZoomControls from "./ZoomControls";
import { cn } from "@/utils/ui";
import { MouseMovementCounter } from "@/utils/atsugami";
import { useDebouncedHide } from "@/utils/hooks/useDebouncedHide";

function VideoPost({ post }: { post: Post }) {
  // TODO: remembering video audio controls (keep it at the same volume every time if changes)
  // TODO: force unloading of video on switch (abort request to video)
  // TODO: loading state for video? kind of like how we have LoadableImage, maybe
  //       we also have LoadableVideo?
  return (
    <div className="flex h-full w-full items-center justify-center">
      <video
        className="max-w-full max-h-full"
        key={post.id}
        src={post.file_url}
        autoPlay
        controls
        loop
        muted
      />
    </div>
  );
}

function ImagePost({ post }: { post: Post }) {
  return (
    <LoadableImage
      key={post.id}
      src={post.file_url}
      preview={post.preview_url}
      sizeHint={{ height: post.height, width: post.width }}
    />
  );
}

function PostViewer({ children }: { children: React.ReactNode }) {
  // TODO: fix stickiness of the debounced hide, figure out what's causing it
  // and if i can make it better
  let showInfoPanel = useAppSelector((state) => state.app.showInfoPanel);
  let [hasMouseActivity, setHasMouseActivity] = useState(false);
  // in case of controls overlap, we count instead of true/false
  let [hoveredControlCount, setHoveredControlCount] = useState(0);
  let [revealControls, showControls, hideControls] = useDebouncedHide(
    true,
    750,
  );

  useEffect(() => {
    let shouldReveal = hoveredControlCount > 0 || hasMouseActivity;
    if (shouldReveal) {
      showControls();
      // reset hasMouseActivity because we used it to show the controls
      if (hasMouseActivity) setHasMouseActivity(false);
    } else hideControls();
  }, [
    hasMouseActivity,
    hoveredControlCount,
    revealControls,
    showControls,
    hideControls,
  ]);

  let movementCounter = useRef(new MouseMovementCounter());
  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    // don't reveal if we're dragging (mouse buttons are pressed down)
    if (e.buttons !== 0) return;

    // only reveal controls after we've moved the mouse more than a certain amount
    let counter = movementCounter.current;
    let movementThreshold = 75;
    counter.add(e.movementX, e.movementY);
    if (counter.totalDelta > movementThreshold) {
      counter.reset();
      setHasMouseActivity(true);
    }
  }

  function handleMouseOver() {
    setHoveredControlCount((count) => count + 1);
  }

  function handleMouseOut() {
    setHoveredControlCount((count) => count - 1);
  }

  return (
    <div
      className="relative overflow-hidden w-full h-full"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute top-0 left-0 w-full h-full">{children}</div>
      <div
        className={cn(
          "pointer-events-none transition-all absolute bottom-4 left-4 right-4 w-auto flex items-center justify-center",
          revealControls
            ? "opacity-100 translate-y-0"
            : "opacity-15 translate-y-[calc(100%+16px)]",
        )}
      >
        <BrowseControls
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none transition-all absolute bottom-24 h-auto left-4 top-4",
          showInfoPanel ? "translate-x-0" : "translate-x-[calc(-100%-16px)]",
        )}
      >
        <PostInfoPanel />
      </div>
      <div
        className={cn(
          "pointer-events-none transition-all absolute right-4 top-4",
          revealControls
            ? "opacity-100 translate-y-0"
            : "opacity-15 translate-y-[calc(-100%-16px)]",
        )}
      >
        {/* TODO: hide these when it's a video */}
        <ZoomControls
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        />
      </div>
      {/* <div
        className={cn(
          "pointer-events-none transition-opacity absolute left-4 bottom-4",
        )}
      >
        <div className="bg-white rounded-md shadow-md">
          hasMouseMovement: {String(hasMouseActivity)}
          <br />
          hoveredControlCount: {String(hoveredControlCount)}
          <br />
          revealControls: {String(revealControls)}
        </div>
      </div> */}
    </div>
  );
}

export default function PostView() {
  let selectedPost = useAppSelector(selectCurrentPost);
  useEffect(() => {
    selectedPost && console.log(selectedPost);
  }, [selectedPost]);

  if (selectedPost == null) return null;

  // TODO: proper handling of videos
  let isVideo = [".webm", ".mp4"].includes(selectedPost.extension);

  if (isVideo) {
    return (
      <PostViewer>
        <VideoPost post={selectedPost} />
      </PostViewer>
    );
  } else {
    return (
      <PostViewer>
        <ImagePost post={selectedPost} />
      </PostViewer>
    );
  }
}
