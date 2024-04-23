import { configureStore } from "@reduxjs/toolkit";
// import appReducer from "@/features/app/app.slice";
import { listenerMiddleware } from "@/listenerMiddleware";

const store = configureStore({
  reducer: {
    // app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(listenerMiddleware.middleware),
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
