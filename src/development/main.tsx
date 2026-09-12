import React from "react";
import { createRoot } from "react-dom/client";
import { DevelopmentApp } from "./DevelopmentApp";
import "./development.css";

const root = document.getElementById("root")!;
const page = root.dataset.page;
createRoot(root).render(
  <React.StrictMode>
    <DevelopmentApp
      page={page === "roadmap" || page === "changes" ? page : "overview"}
    />
  </React.StrictMode>,
);
