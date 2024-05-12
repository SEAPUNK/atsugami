import { startAppListening } from "@/listenerMiddleware";
import store from "@/store";
import { atsugamiApi } from "@/utils/api";
import { blurAllInputs, toTagList } from "@/utils/atsugami";
import { isAnyOf } from "@reduxjs/toolkit";
import Mousetrap from "mousetrap";
import { basename } from "path-browserify";
import { toast } from "sonner";
import {
  appendPageResults,
  firstImage,
  lastImage,
  loadNextPage,
  newSearch,
  nextImage,
  previousImage,
  selectCurrentPost,
  setPageResults,
  stopLoading,
  toggleInfoPanel,
  viewerRecenterToggleZoom,
  viewerZoomIn,
  viewerZoomOut,
} from "./app.slice";
import { ViewerControls } from "./ImageViewer";

let viewerControlsRef: React.RefObject<ViewerControls | null> | null = null;

export function setViewerControls(ref: React.RefObject<ViewerControls | null>) {
  viewerControlsRef = ref;
}

function bindKeyboardShortcuts() {
  Mousetrap.bind("left", () => {
    store.dispatch(previousImage());
  });

  Mousetrap.bind("right", () => {
    store.dispatch(nextImage());
  });

  Mousetrap.bind("down", () => {
    store.dispatch(lastImage());
  });

  Mousetrap.bind("up", () => {
    store.dispatch(firstImage());
  });

  Mousetrap.bind("s", () => {
    let currentPost = selectCurrentPost(store.getState());
    if (currentPost?.save_url) {
      let filename = basename(
        new URL(currentPost.unproxied_file_url).pathname,
      ).replace(/"/g, "");
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download
      // nicer way of triggering a download, this lets us have multiple pending downloads at one time
      let anchor = document.createElement("a");
      anchor.href = currentPost.save_url;
      anchor.download = filename;
      anchor.click();
      toast(`Downloading ${filename}...`);
    }
  });

  Mousetrap.bind("i", () => {
    store.dispatch(toggleInfoPanel());
  });
}

export async function initApp() {
  bindKeyboardShortcuts();

  startAppListening({
    matcher: isAnyOf(viewerZoomIn, viewerZoomOut, viewerRecenterToggleZoom),
    effect: (action) => {
      let viewerControls = viewerControlsRef?.current;
      if (viewerControls == null) return;
      if (viewerZoomIn.match(action)) viewerControls.zoomIn();
      else if (viewerZoomOut.match(action)) viewerControls.zoomOut();
      else if (viewerRecenterToggleZoom.match(action))
        viewerControls.recenterToggleZoom();
    },
  });

  startAppListening({
    matcher: isAnyOf(newSearch, loadNextPage),
    effect: async (action, listenerApi) => {
      let state = listenerApi.getState();
      let originalState = listenerApi.getOriginalState();
      let nextPage = state.app.searchNextPage;

      if (newSearch.match(action)) {
        // if it's a new search, cancel everything else
        listenerApi.cancelActiveListeners();

        let request;
        try {
          // TODO: how do we pass the abort signal to this?
          request = listenerApi.dispatch(
            atsugamiApi.endpoints.postsList.initiate({
              limit: state.app.searchLimit,
              tags: toTagList(action.payload),
            }),
          );
          let response = await request;

          if (response.isSuccess) {
            // clean up cache
            request.unsubscribe();

            if (!response.data.posts.length) {
              toast("No posts found.");
              listenerApi.dispatch(stopLoading());
              return;
            }

            // if we have successful results, blur all inputs to enable keyboard
            // navigation without any extra steps
            blurAllInputs();

            listenerApi.dispatch(
              setPageResults({
                nextPage: response.data.nextKey,
                posts: response.data.posts,
              }),
            );
            return;
          } else {
            toast.error(`Search failed. See console for more details.`);
            return;
          }
        } finally {
          // clean up cache
          request?.unsubscribe();
        }
      } else if (loadNextPage.match(action)) {
        if (originalState.app.searchLoading) return;

        // there are no more pages to load (or we've started a new search)
        if (nextPage == null) return;

        let request;
        try {
          // TODO: how do we pass the abort signal to this?
          request = listenerApi.dispatch(
            atsugamiApi.endpoints.postsList.initiate({
              limit: state.app.searchLimit,
              tags: toTagList(state.app.searchTags),
              after: nextPage,
            }),
          );
          let response = await request;
          if (response.isSuccess) {
            listenerApi.dispatch(
              appendPageResults({
                nextPage: response.data.nextKey,
                posts: response.data.posts,
              }),
            );
            return;
          } else {
            toast.error(
              `Failed to load next page. See console for more details.`,
            );
            // reset browseLoadingNextPage
            listenerApi.dispatch(stopLoading());
            return;
          }
        } finally {
          // clean up cache
          request?.unsubscribe();
        }
      }
    },
  });

  store.dispatch(newSearch(""));
}
