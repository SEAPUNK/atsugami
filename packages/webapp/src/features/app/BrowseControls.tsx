import * as React from "react";
import { useAppDispatch, useAppSelector } from "@/store.hooks";
import { Button } from "@/ui/button";
import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
  faFloppyDisk,
  faInfo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  firstImage,
  lastImage,
  nextImage,
  previousImage,
  selectPost,
  toggleInfoPanel,
} from "./app.slice";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/ui/tooltip";
import Mousetrap from "mousetrap";
import { Input } from "@/ui/input";
import { blurAllInputs, clamp } from "@/utils/atsugami";

export default function BrowseControls() {
  let dispatch = useAppDispatch();
  let browseCursor = useAppSelector((state) => state.app.browseCursor);
  let postsCount = useAppSelector((state) => state.app.browsePosts.length);

  let [inputCursor, setInputCursor] = React.useState<string>(
    String(browseCursor + 1),
  );

  React.useEffect(() => {
    setInputCursor(String(browseCursor + 1));
  }, [browseCursor]);

  function handleCursorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputCursor(e.target.value);
  }

  function handleCursorSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    blurAllInputs();
    let cursorNum = +inputCursor;
    if (Number.isNaN(cursorNum)) {
      cursorNum = browseCursor + 1;
    } else {
      cursorNum = clamp(cursorNum, 0 + 1, postsCount);
    }
    setInputCursor(String(cursorNum));
    dispatch(selectPost(cursorNum - 1));
  }

  return (
    <TooltipProvider>
      <div className="bg-stone-100 p-2 shadow-md rounded-md pointer-events-auto flex items-center justify-center gap-4">
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(toggleInfoPanel())}
            >
              <FontAwesomeIcon fixedWidth icon={faInfo} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center justify-center gap-2">
              <kbd>i</kbd>
              <span>Show info panel</span>
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(firstImage())}
              >
                <FontAwesomeIcon fixedWidth icon={faAnglesLeft} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center gap-2">
                <kbd>↑</kbd>
                <span>First post</span>
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(previousImage())}
              >
                <FontAwesomeIcon fixedWidth icon={faAngleLeft} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center gap-2">
                <kbd>←</kbd>
                <span>Previous post</span>
              </p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2 px-1">
            <form onSubmit={handleCursorSubmit}>
              <Input
                // very specific size offset that just happens to work
                size={String(postsCount).length - 1}
                type="text"
                value={inputCursor}
                onChange={handleCursorChange}
                className="h-9 text-center"
              />
            </form>
            <span className="text-stone-500">of</span>
            <span className="pr-1">{postsCount}</span>
          </div>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(nextImage())}
              >
                <FontAwesomeIcon fixedWidth icon={faAngleRight} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center gap-2">
                <kbd>→</kbd>
                <span>Next post</span>
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(lastImage())}
              >
                <FontAwesomeIcon fixedWidth icon={faAnglesRight} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center gap-2">
                <kbd>↓</kbd>
                <span>Last post</span>
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="sm"
              onClick={() => Mousetrap.trigger("s")}
            >
              <FontAwesomeIcon fixedWidth icon={faFloppyDisk} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center justify-center gap-2">
              <kbd>s</kbd>
              <span>Download file</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
