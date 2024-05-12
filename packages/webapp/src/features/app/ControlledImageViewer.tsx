import { useEffect, useRef } from "react";
import ImageViewer, { ViewerControls } from "./ImageViewer";
import { setViewerControls } from "./app";
import { useAppDispatch } from "@/store.hooks";
import { newViewerScale } from "./app.slice";

export default function ControlledImageViewer(
  props: React.ComponentProps<typeof ImageViewer>,
) {
  let dispatch = useAppDispatch();
  let viewerControls = useRef<ViewerControls>(null);
  useEffect(() => {
    // TODO: this is ugly. do we have a nicer way
    //       of tracking image viewer controls?
    setViewerControls(viewerControls);
  }, [viewerControls]);

  function handleScale(scale: number) {
    dispatch(newViewerScale(scale));
  }

  return <ImageViewer ref={viewerControls} onScale={handleScale} {...props} />;
}
