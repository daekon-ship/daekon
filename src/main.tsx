import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/fx.css";
import { App } from "./App";
import { initSoundscape } from "./lib/ambientAudio";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

// egyetlen, folyamatos háttér-atmoszféra — már a loader alatt beúszhat
initSoundscape();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
