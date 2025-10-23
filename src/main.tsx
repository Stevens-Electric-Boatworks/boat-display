import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { RosProvider } from "./components/ros-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <RosProvider>
    <App />
  </RosProvider>
);
