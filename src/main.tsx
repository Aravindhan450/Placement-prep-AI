import "./lib/supabaseTest"
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/theme.css";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext"
import { DashboardProvider } from "./contexts/DashboardContext";

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <DashboardProvider>
      <App />
    </DashboardProvider>
  </AuthProvider>
);
