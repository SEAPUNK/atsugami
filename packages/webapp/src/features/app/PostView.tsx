import { useAppSelector } from "@/store.hooks";
import React, { useEffect } from "react";
import { selectCurrentPost } from "./app.slice";
import { Post } from "@atsugami/common/types";
import LoadableImage from "./LoadableImage";
import BrowseControls from "./BrowseControls";
import PostInfoPanel from "./PostInfoPanel";

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
    />
  );
}

function PostViewer({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 w-full h-full">{children}</div>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 w-auto flex items-center justify-center">
        <BrowseControls />
      </div>
      <div className="pointer-events-none absolute right-10 top-10 max-h-[calc(100% - 80px)]">
        <PostInfoPanel />
      </div>
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
