import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { Toaster } from "./components/ui/sonner";
import { createRoutesFromFiles } from "./libs/react-router";
import { TanstackProvider } from "./libs/tanstack-query";
import "./index.css";

const pageFiles = import.meta.glob("./app/**/*(page|layout).tsx");
const errorFiles = import.meta.glob("./app/**/*error.tsx");
const notFoundFiles = import.meta.glob("./app/**/*404.tsx");
const loadingFiles = import.meta.glob("./app/**/*loading.tsx");

const routes = createRoutesFromFiles(pageFiles, errorFiles, notFoundFiles, loadingFiles);
const router = createBrowserRouter([routes]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TanstackProvider>
      <RouterProvider router={router} />
      <Toaster duration={2000} position="top-right" richColors />
    </TanstackProvider>
  </StrictMode>
);
