import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import store from "./store";
import { ThemeProvider } from "./theme-provider";
import { initApp } from "@/features/app/app";
import "@fontsource/geist-sans";
import "@fontsource/geist-mono";
import "./index.css";

initApp();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Provider store={store}>
        <App />
      </Provider>
    </ThemeProvider>
  </React.StrictMode>,
);
