import { createRoot } from "react-dom/client";
import { NavigationProvider } from "./context/NavigationContext.tsx";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <NavigationProvider>
    <App />
  </NavigationProvider>,
);
