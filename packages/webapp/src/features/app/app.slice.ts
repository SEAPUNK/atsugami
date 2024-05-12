import { RootState } from "@/store";
import { Post } from "@atsugami/common/types";
import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

export type PageResults = {
  nextPage: string | null;
  posts: Array<Post>;
};

export interface AppState {
  // what tags we're searching for
  searchTags: string;
  // max result count
  searchLimit: number;
  // pagination token, empty if we've reached the end
  searchNextPage: string | null;
  // whether we're loading next page or new result
  searchLoading: boolean;

  // list of posts that search returned with
  browsePosts: Array<Post>;
  // which of them we're currently on
  browseCursor: number;

  // self-explanatory
  showInfoPanel: boolean;

  // READ ONLY: passed down image scale from the image viewer
  // TODO: this is VERY ugly. can we do this better?
  viewerScale: number;
}

const initialState: AppState = {
  searchTags: "",
  // not configurable (for now)
  searchLimit: 100,
  searchNextPage: null,
  browsePosts: [],
  browseCursor: 0,
  searchLoading: false,
  showInfoPanel: false,
  viewerScale: 0,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // triggers a new search
    newSearch(state, action: PayloadAction<string>) {
      state.searchTags = action.payload;
      state.searchNextPage = null;
      state.searchLoading = true;
    },
    // triggers next page load
    loadNextPage(state) {
      state.searchLoading = true;
    },
    // results of a new search
    setPageResults(state, action: PayloadAction<PageResults>) {
      state.browseCursor = 0;
      state.browsePosts = action.payload.posts;
      state.searchNextPage = action.payload.nextPage;
      // newSearch aborts existing next page loads, so we want to reset the state
      state.searchLoading = false;
    },
    // results of the next page in the same search
    appendPageResults(state, action: PayloadAction<PageResults>) {
      state.browsePosts = [...state.browsePosts, ...action.payload.posts];
      state.searchNextPage = action.payload.nextPage;
      state.searchLoading = false;
    },
    stopLoading(state) {
      state.searchLoading = false;
    },
    selectPost(state, action: PayloadAction<number>) {
      state.browseCursor = Math.min(
        action.payload,
        state.browsePosts.length - 1,
      );
    },
    nextImage(state) {
      let nextCursor = state.browseCursor + 1;
      if (nextCursor >= state.browsePosts.length) nextCursor = 0;
      state.browseCursor = nextCursor;
    },
    previousImage(state) {
      let nextCursor = state.browseCursor - 1;
      if (nextCursor < 0) nextCursor = state.browsePosts.length - 1;
      state.browseCursor = nextCursor;
    },
    // TODO: rename: Image -> Post
    firstImage(state) {
      state.browseCursor = 0;
    },
    lastImage(state) {
      state.browseCursor = state.browsePosts.length - 1;
    },
    toggleInfoPanel(state) {
      state.showInfoPanel = !state.showInfoPanel;
    },
    viewerZoomIn() {},
    viewerZoomOut() {},
    viewerRecenterToggleZoom() {},
    newViewerScale(state, action: PayloadAction<number>) {
      state.viewerScale = action.payload;
    },
  },
});

export const selectCurrentPost = createSelector(
  (state: RootState) => state.app.browsePosts,
  (state: RootState) => state.app.browseCursor,
  (posts, cursor) => posts.at(cursor),
);

export const {
  newSearch,
  loadNextPage,
  setPageResults,
  appendPageResults,
  stopLoading,
  selectPost,
  nextImage,
  previousImage,
  firstImage,
  lastImage,
  toggleInfoPanel,
  viewerZoomIn,
  viewerZoomOut,
  viewerRecenterToggleZoom,
  newViewerScale,
} = appSlice.actions;
export default appSlice.reducer;
