import React from "react";
import { createRoot } from "react-dom/client";
import { OSProvider } from "./state/OSContext.jsx";
import App from "./App.jsx";
import "./styles.css";
import "./supcer.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <OSProvider>
      <App />
    </OSProvider>
  </React.StrictMode>,
);
