import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  root.innerHTML = "";
  createRoot(root).render(<App />);
}
