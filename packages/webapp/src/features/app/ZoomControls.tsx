import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/ui/tooltip";
import { Button } from "@/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch, useAppSelector } from "@/store.hooks";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import {
  viewerRecenterToggleZoom,
  viewerZoomIn,
  viewerZoomOut,
} from "./app.slice";

export type ZoomControlsProps = {
  onMouseOver?: (e: React.MouseEvent<HTMLElement>) => unknown;
  onMouseOut?: (e: React.MouseEvent<HTMLElement>) => unknown;
};
export default function ZoomControls({
  onMouseOver,
  onMouseOut,
}: ZoomControlsProps) {
  let dispatch = useAppDispatch();
  let viewerScale = useAppSelector((state) => state.app.viewerScale);
  return (
    <TooltipProvider>
      <div
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        className="bg-stone-100 p-2 shadow-md rounded-md pointer-events-auto flex items-center justify-center gap-4"
      >
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(viewerZoomOut())}
              >
                <FontAwesomeIcon fixedWidth icon={faMinus} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center gap-2">
                <kbd>MWHEELDOWN</kbd>
                <span>Zoom out</span>
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="min-w-20"
                size="sm"
                onClick={() => dispatch(viewerRecenterToggleZoom())}
              >
                {Math.floor(viewerScale * 100)}%
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center gap-2">
                <kbd>DBLCLICK</kbd>
                <span>Recenter and Toggle Sizes</span>
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(viewerZoomIn())}
              >
                <FontAwesomeIcon fixedWidth icon={faPlus} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center gap-2">
                <kbd>MWHEELUP</kbd>
                <span>Zoom in</span>
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
