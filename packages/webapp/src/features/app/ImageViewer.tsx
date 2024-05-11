import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { clamp } from "@/utils/atsugami";

// TODO: go over this and clean it up a bit

// by what percent of the scaled pixels do we want to resize the image
const SCALE_INTERVAL_PERCENT = 10 / 100;
const PRIMARY_BUTTON = 0b0001; // mouse button
const MAX_ZOOM = 10000 / 100; // 1000%
const DOUBLE_CLICK_TIMEOUT = 350; // ms

// for events that we want to explicitly disable
function disabledEvent(evt: React.SyntheticEvent) {
  evt.preventDefault();
}

// calculate the next scale percentage that will get us there.
function calculateScaleTo(
  imageDims: Dimensions,
  currentScale: number,
  scaleUp: boolean,
  pausePointScales: Array<number>,
): number {
  // pick a dimension for scaling
  //
  // we pick the largest dimension, but when scaling that dimension by a
  // percentage (vs a pixel amount), it doesn't really matter which dimension we pick
  const selectedDimension = Math.max(imageDims.x, imageDims.y);

  // determine next scale
  const dimensionActualPixels = selectedDimension * currentScale;
  const actualPixelResize =
    (scaleUp ? 1 : -1) * SCALE_INTERVAL_PERCENT * dimensionActualPixels;
  const desiredDimensionPixels = dimensionActualPixels + actualPixelResize;
  let desiredScale = desiredDimensionPixels / selectedDimension;

  // stop at a scale pause point (if we hit one)
  pausePointScales = pausePointScales.filter((scale) => {
    // discard irrelevant scales
    return scaleUp ? scale <= currentScale : scale >= currentScale;
  });

  // pick the pause point scale we want to not go past
  const pausePointScale = scaleUp
    ? pausePointScales[0]
    : pausePointScales[pausePointScales.length - 1];
  if (pausePointScale != null) {
    if (scaleUp) {
      desiredScale = Math.min(desiredScale, pausePointScale);
    } else {
      desiredScale = Math.max(desiredScale, pausePointScale);
    }
  }

  return clamp(desiredScale, 1 / 100, MAX_ZOOM);
}

// calculate the next transition within viewport bounds
function translateWithinBounds(
  scaledImageDims: Dimensions,
  viewportDims: Dimensions,
  desiredTransition: Dimensions,
): Dimensions {
  return {
    x: clamp(
      desiredTransition.x,
      scaledImageDims.x * -1 + 1,
      viewportDims.x - 1,
    ),
    y: clamp(
      desiredTransition.y,
      scaledImageDims.y * -1 + 1,
      viewportDims.y - 1,
    ),
  };
}

// calculate the point on the rectangle perimeter closest to the cursor if the
// cursor is outside of the rectangle. otherwise, returns the cursor position
function calculatePointClosestToRectangle(
  rectPosition: Dimensions,
  rectDimensions: Dimensions,
  cursor: Dimensions,
): Dimensions {
  const { x: rx, y: ry } = rectPosition;
  const { x: rw, y: rh } = rectDimensions;
  const { x: cx, y: cy } = cursor;

  const pointInsideRectangle = (x: number, y: number): boolean => {
    const t = 1; // px tolerance for floating point coords
    // prettier-ignore
    if (
      x + t >= rx      &&
      x - t <= rx + rw &&
      y + t >= ry      &&
      y - t <= ry + rh
    ) {
      return true;
    }
    return false;
  };

  // if cursor is already inside rectangle, just return cursor position
  if (pointInsideRectangle(cx, cy)) {
    return cursor;
  }

  // rectangle center
  const rcx = Math.round(rx + rw / 2);
  const rcy = Math.round(ry + rh / 2);
  const rc = { x: rcx, y: rcy };

  // line function from cursor to rectangle center
  const m = (rcy - cy) / (rcx - cx);
  const c = cy + -1 * (m * cx);
  const lineY = (x: number) => {
    return m * x + c;
  };
  const lineX = (y: number) => {
    return (y - c) / m;
  };

  // figure out which side of the rectangle gives us a point that is within the
  // bounds of the rectangle (and is between the cursor and center)
  let candidatePoints = [];

  if (cy < rcy && cy < ry) {
    candidatePoints.push({
      x: lineX(ry),
      y: ry,
    });
  }

  if (cy > rcy && cy > ry + rh) {
    candidatePoints.push({
      x: lineX(ry + rh),
      y: ry + rh,
    });
  }

  if (cx < rcx && cx < rx) {
    candidatePoints.push({
      x: rx,
      y: lineY(rx),
    });
  }

  if (cx > rcx && cx > rx + rw) {
    candidatePoints.push({
      x: rx + rw,
      y: lineY(rx + rw),
    });
  }

  const boundsError = (message: string) => {
    console.error(
      [
        message,
        `Rectangle center: (rcx ${rcx}, rcy ${rcy})`,
        `Rectangle coords: (rx ${rx}, ry ${ry})`,
        `Rectangle dimensions: (rw ${rw}, rh ${rh})`,
        `Cursor: (cx ${cx}, cy ${cy})`,
      ].join(" "),
    );
  };

  if (candidatePoints.length === 0) {
    boundsError(`No rectangle edge candidate points!`);
    return rc;
  }

  candidatePoints = candidatePoints.filter((point) => {
    return pointInsideRectangle(point.x, point.y);
  });

  if (candidatePoints.length < 1) {
    boundsError(`None of the candidate points within rectangle bounds!`);
    return rc;
  }

  return candidatePoints[0];
}

// calculate the image's dimensions after scaling
function calculateScaledImageDimensions(
  imageDims: Dimensions,
  imageScale: number,
): Dimensions {
  return {
    x: Math.round(imageDims.x * imageScale),
    y: Math.round(imageDims.y * imageScale),
  };
}

// calculate the scale needed to fit the image inside of the parent viewport
function calculateImageFitScale(
  imageDims: Dimensions,
  parentDims: Dimensions,
): number {
  // calculate initial image scale
  const fillScaleX = parentDims.x / imageDims.x;
  const fillScaleY = parentDims.y / imageDims.y;
  const fillScale = Math.min(fillScaleX, fillScaleY);
  return Math.min(1, fillScale);
}

// calculate the translate needed to center the image inside the parent viewport
function calculateImageCenterTranslate(
  imageDims: Dimensions,
  parentDims: Dimensions,
  imageScale: number,
): Dimensions {
  return {
    x: (parentDims.x - imageDims.x * imageScale) / 2,
    y: (parentDims.y - imageDims.y * imageScale) / 2,
  };
}

// calculate the translate for the image so the zooming is percieved to be happening to
// where the cursor is (or the image boundary point closest to where the cursor is)
function calculateOriginZoomTranslate(
  viewportElement: HTMLElement,
  mousePosition: Dimensions,
  translateDims: Dimensions,
  oldScaledImageDims: Dimensions,
  newScaledImageDims: Dimensions,
) {
  // get mouse position within parent
  const parentRect = viewportElement.getBoundingClientRect();
  const mouseRelativeX = mousePosition.x - Math.round(parentRect.left);
  const mouseRelativeY = mousePosition.y - Math.round(parentRect.top);

  const zoomOrigin = calculatePointClosestToRectangle(
    translateDims,
    oldScaledImageDims,
    { x: mouseRelativeX, y: mouseRelativeY },
  );

  // determine how much we would resize (in pixels)
  const scaleResizeX = newScaledImageDims.x - oldScaledImageDims.x;
  const scaleResizeY = newScaledImageDims.y - oldScaledImageDims.y;

  // determine where the point is on the rectangle (percentage)
  const originOffsetX = (zoomOrigin.x - translateDims.x) / oldScaledImageDims.x;
  const originOffsetY = (zoomOrigin.y - translateDims.y) / oldScaledImageDims.y;

  return {
    x: -1 * scaleResizeX * originOffsetX,
    y: -1 * scaleResizeY * originOffsetY,
  };
}

type Dimensions = {
  x: number;
  y: number;
};

type Props = {
  // TODO: pass element instead of src
  // element: HTMLElement;
  src: string;

  // we want to enforce the dimensions of the child
  // so our transforms don't randomly break
  height: number;
  width: number;
};
function ImageViewer(props: Props) {
  const { src, height, width } = props;
  const imageDims = useMemo<Dimensions>(() => {
    return { x: width, y: height };
  }, [width, height]);

  // image translations (dragging the image)
  const [translateDims, setTranslateDims] = useState<Dimensions>({
    x: 0,
    y: 0,
  });

  // image scale (zooming)
  const [imageScale, setImageScale] = useState<number>(
    // don't show the image until we've calculated the initial scale
    0,
  );
  const scaledImageDims = useMemo<Dimensions>(() => {
    return calculateScaledImageDimensions(imageDims, imageScale);
  }, [imageDims, imageScale]);

  // element refs
  const [parentElement, setParentElement] = useState<HTMLElement>();
  const parentCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node == null) return;
    setParentElement(node);
  }, []);

  const [parentDims, setParentDims] = useState<Dimensions | null>(null);

  // parent dimensions
  const updateParentDims = useCallback(() => {
    if (parentElement == null) {
      setParentDims(null);
      return;
    }
    const parentWidth = parentElement.offsetWidth;
    const parentHeight = parentElement.offsetHeight;
    if (
      parentDims != null &&
      parentDims.x === parentWidth &&
      parentDims.y === parentHeight
    ) {
      return;
    }
    setParentDims({
      x: parentWidth,
      y: parentHeight,
    });
  }, [parentElement, parentDims]);

  // trigger parent dims update on new refs
  useEffect(() => {
    updateParentDims();
  }, [updateParentDims, parentElement]);

  // also trigger parent dims update on parent dims resizes
  useEffect(() => {
    if (parentElement == null) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === parentElement) {
          updateParentDims();
        }
      }
    });

    resizeObserver.observe(parentElement);
    return () => {
      resizeObserver.unobserve(parentElement);
    };
  }, [updateParentDims, parentElement]);

  // calculate initial scale and translate
  useEffect(() => {
    if (parentDims == null) return;

    const initialScale = calculateImageFitScale(imageDims, parentDims);
    setImageScale(initialScale);

    const centerTranslate = calculateImageCenterTranslate(
      imageDims,
      parentDims,
      initialScale,
    );
    setTranslateDims(centerTranslate);
  }, [imageDims, parentDims]);

  // double click tracker
  const firstClickTime = useRef<number>(0);

  // zoom percent overlay ui
  const [showZoom, setShowZoom] = useState(false);
  const showZoomTimer = useRef<any>(); // TODO: fix typing for setTimeout/clearTimeout
  function triggerShowZoom() {
    if (showZoomTimer.current) {
      clearTimeout(showZoomTimer.current);
    }
    showZoomTimer.current = setTimeout(() => {
      setShowZoom(false);
    }, 500);
    setShowZoom(true);
  }

  // translation handler (image move)
  function handleMouseMove(evt: React.MouseEvent) {
    // don't do anything if the image isn't visible
    if (imageScale === 0) return;
    // don't do anything if our deps don't have values
    if (parentDims == null) return;

    // We only care about the mouse movement when we're clicking the primary mouse button
    if ((evt.buttons & PRIMARY_BUTTON) !== PRIMARY_BUTTON) return;

    // drag events reset the double click timer
    firstClickTime.current = 0;

    const movementX = evt.movementX;
    const movementY = evt.movementY;
    setTranslateDims((previousDims) => {
      return translateWithinBounds(scaledImageDims, parentDims, {
        x: previousDims.x + movementX,
        y: previousDims.y + movementY,
      });
    });
  }

  // scaling handler (image zoom)
  function handleScroll(evt: React.WheelEvent) {
    // don't do anything if the image isn't visible
    if (imageScale === 0) return;
    // don't do anything if our deps don't exist
    if (parentElement == null || parentDims == null) return;

    const { deltaY, clientX, clientY } = evt;
    if (deltaY === 0) return;
    const mousePosition = { x: clientX, y: clientY };

    // scale image
    const newScale = calculateScaleTo(imageDims, imageScale, deltaY < 0, []);
    const newScaledImageDims = calculateScaledImageDimensions(
      imageDims,
      newScale,
    );
    setImageScale(newScale);

    const zoomOriginTranslate = calculateOriginZoomTranslate(
      parentElement,
      mousePosition,
      translateDims,
      scaledImageDims,
      newScaledImageDims,
    );

    // apply the translate
    setTranslateDims((previousDims) => {
      return translateWithinBounds(newScaledImageDims, parentDims, {
        x: previousDims.x + zoomOriginTranslate.x,
        y: previousDims.y + zoomOriginTranslate.y,
      });
    });

    triggerShowZoom();
  }

  // double click handler (image reset, scaling toggles)
  function handleMouseDown(evt: React.MouseEvent) {
    // don't do anything if our deps dont have values
    if (parentDims == null || parentElement == null) return;

    // ignore everything but first click
    if ((evt.buttons & PRIMARY_BUTTON) !== PRIMARY_BUTTON) return;
    const { clientX, clientY } = evt;
    const mousePosition = { x: clientX, y: clientY };

    const now = Date.now();
    if (now - firstClickTime.current > DOUBLE_CLICK_TIMEOUT) {
      // didn't double click fast enough
      firstClickTime.current = now;
      return;
    }

    // reset firstClickTime so the user has to double click again
    firstClickTime.current = 0;

    const fitScale = calculateImageFitScale(imageDims, parentDims);
    let nextImageScale: number;
    // if the image scale is at fit scale AND the image is currently centered
    // go ahead and change the scale to 100%
    //
    // NOTE: if the fit scale is already 100%, this doesn't really matter,
    // as it'll only ever center the image
    const currentCenterTranslate = calculateImageCenterTranslate(
      imageDims,
      parentDims,
      imageScale,
    );
    if (
      imageScale === fitScale &&
      currentCenterTranslate.x === translateDims.x &&
      currentCenterTranslate.y === translateDims.y
    ) {
      nextImageScale = 1; // 100%

      // cursor origin translate
      const newScaledImageDims = calculateScaledImageDimensions(
        imageDims,
        nextImageScale,
      );

      const zoomOriginTranslate = calculateOriginZoomTranslate(
        parentElement,
        mousePosition,
        translateDims,
        scaledImageDims,
        newScaledImageDims,
      );

      setTranslateDims((previousDims) => {
        return translateWithinBounds(newScaledImageDims, parentDims, {
          x: previousDims.x + zoomOriginTranslate.x,
          y: previousDims.y + zoomOriginTranslate.y,
        });
      });
    } else {
      nextImageScale = fitScale;

      // center translate
      const centerTranslate = calculateImageCenterTranslate(
        imageDims,
        parentDims,
        nextImageScale,
      );
      setTranslateDims(centerTranslate);
    }

    setImageScale(nextImageScale);
    triggerShowZoom();
  }

  const zoomPercent = Math.floor(imageScale * 100);

  return (
    <div
      className="w-full h-full cursor-pointer select-none overflow-hidden"
      ref={parentCallbackRef}
      onMouseMove={handleMouseMove}
      onWheel={handleScroll}
      onMouseDown={handleMouseDown}
    >
      <img
        className="select-none origin-top-left shadow-md max-w-none max-h-none"
        style={{
          height: `${height}px`,
          width: `${width}px`,
          transform: `
            translateX(${translateDims.x}px)
            translateY(${translateDims.y}px)
            scale(${imageScale})
          `,
        }}
        src={src}
        // triggers image drag in firefox
        onDragStart={disabledEvent}
      />
      <div className="pointer-events-none flex items-center justify-center absolute top-0 left-0 w-full h-full">
        <div
          className="bg-stone-800/80 text-white py-1 px-3 rounded-md shadow-xl"
          style={{ opacity: showZoom ? 1 : 0 }}
        >
          {zoomPercent}%
        </div>
      </div>
    </div>
  );
}

export default ImageViewer;
