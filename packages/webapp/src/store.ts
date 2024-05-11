import { configureStore } from "@reduxjs/toolkit";
import appSlice from "@/features/app/app.slice";
import { atsugamiApi } from "@/utils/api";
import { listenerMiddleware } from "@/listenerMiddleware";
import { setupListeners } from "@reduxjs/toolkit/query";

const store = configureStore({
  reducer: {
    app: appSlice,
    [atsugamiApi.reducerPath]: atsugamiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(atsugamiApi.middleware),
});

setupListeners(store.dispatch);

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
