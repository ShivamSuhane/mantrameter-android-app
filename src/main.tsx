import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { Capacitor } from "@capacitor/core";

async function setupNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#4f46e5" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn("StatusBar setup failed:", e);
  }

  // ── Google Auth Initialize ────────────────────────────────────────────────
  try {
    const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
    await GoogleAuth.initialize({
      clientId: '33866769980-cq7umijdlko8qj6anfqlcui95tvcekth.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  } catch (e) {
    console.warn("GoogleAuth initialize failed:", e);
  }

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    await LocalNotifications.createChannel({
      id: "mantra_reminders",
      name: "Mantra Reminders",
      description: "Your daily mantra practice reminders",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
      lights: true,
      lightColor: "#4f46e5",
    });
    // Set notification icon background color via Android system
    // This ensures white ic_notification is visible on colored background

    await LocalNotifications.createChannel({
      id: "mantra_milestones",
      name: "Milestones & Achievements",
      description: "Mala completion milestones and streaks",
      importance: 4,
      visibility: 1,
      sound: "default",
      vibration: true,
    });

  } catch (e) {
    console.warn("Notification channel setup failed:", e);
  }

  // ── Issue 3: Notification permission — app first open par maango ──────────
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const permResult = await LocalNotifications.checkPermissions();
    if (permResult.display === 'prompt' || permResult.display === 'prompt-with-rationale') {
      // Thoda wait karo taaki app load ho jaaye, phir permission maango
      setTimeout(async () => {
        try {
          await LocalNotifications.requestPermissions();
        } catch (e) {
          console.warn("Notification permission request failed:", e);
        }
      }, 2000);
    }
  } catch (e) {
    console.warn("Notification permission check failed:", e);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    (window as any).__pwaInstallPrompt = e;
    window.dispatchEvent(new CustomEvent("pwaInstallPromptReady"));
  });
}

if (!Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("[SW] Registered:", reg.scope))
      .catch((err) => console.error("[SW] Failed:", err));
  });
}

setupNativeApp().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
