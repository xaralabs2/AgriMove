import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./auth/authContext";
import { registerServiceWorker, requestNotificationPermission } from "./utils/pwa";

// Register service worker for PWA functionality
registerServiceWorker();

// Request notification permission for mobile app features
requestNotificationPermission();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
