import { useState, useEffect, useRef } from "react";
import ImageViewer from "./ImageViewer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

// TODO: rework this entire component using fetch to download the image
// - fetch gives downoad progress (response.body is a ReadableStream)
// - we write stream into Blob, and wrap it into a File
// - send it down to ImageViewer as a blob URL
// - test how it saves (if it saves as it should)
// - then unload, and see how things change if we have the blob in a new tab or similar
// - aborting fetch on component unload

type LoadableImageProps = {
  src: string;
  preview: string;
};
function LoadableImage(props: LoadableImageProps) {
  const { src, preview } = props;

  let [loading, setLoading] = useState<boolean>(true);
  let [error, setError] = useState<boolean>(false);

  // when the src changes, trigger loading screen
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  // we want to have memoized handlers for the events
  function handleImageLoad() {
    setLoading(false);
  }
  function handleImageError() {
    setLoading(false);
    setError(true);
  }

  const imageElementRef = useRef<HTMLImageElement>();
  useEffect(() => {
    let imageElement = document.createElement("img");
    imageElement.onload = handleImageLoad;
    imageElement.onerror = handleImageError;
    imageElement.src = src;
    imageElementRef.current = imageElement;
    return () => {
      imageElement.onload = null;
      imageElement.onerror = null;
    };
  }, [src]);

  const imageElement = imageElementRef.current;

  return (
    <>
      {!loading && !error && imageElement != null && (
        <ImageViewer
          height={imageElement.naturalHeight}
          width={imageElement.naturalWidth}
          src={src}
        />
      )}
      {(loading || error) && (
        <div className="relative w-full h-full flex items-center justify-center">
          <img className="object-contain w-full h-full" src={preview} />
          <div className="bg-black/20 flex absolute w-full h-full top-0 left-0 justify-center items-center">
            <div className="p-5 border border-black bg-white">
              {error ? (
                `Error loading image`
              ) : (
                <FontAwesomeIcon icon={faArrowsRotate} spin />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LoadableImage;
