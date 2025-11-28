import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { RosProvider } from "./components/ros-provider.tsx";
import { BrowserRouter, Route, Routes } from "react-router";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <RosProvider>
      <Routes>
        <Route index element={<App />} />
      </Routes>
      <App />
    </RosProvider>
  </BrowserRouter>
);
