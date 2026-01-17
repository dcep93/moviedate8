import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Moviedate from "./moviedate/index.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Moviedate />
  </StrictMode>,
);
