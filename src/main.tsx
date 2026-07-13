import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// ?gallery=cards renders every card in the game for layout testing.
const CardGallery = lazy(() => import("./components/CardGallery"));
const gallery = new URLSearchParams(window.location.search).get("gallery") === "cards";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{gallery ? <CardGallery /> : <App />}</StrictMode>,
);
