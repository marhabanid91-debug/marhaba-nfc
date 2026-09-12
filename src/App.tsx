import { AppProvider, useApp } from "./context/AppContext";
import AuthScreen from "./components/AuthScreen";
import HomeScreen from "./components/HomeScreen";
import EmergencyScreen from "./components/EmergencyScreen";
import BusinessScreen from "./components/BusinessScreen";
import EventsScreen from "./components/EventsScreen";
import AccessoryScreen from "./components/AccessoryScreen";
import SettingsScreen from "./components/SettingsScreen";
import ReaderView from "./components/ReaderView";
import OfflineSettingsScreen from "./components/OfflineSettingsScreen";
import PrivacyPolicyScreen from "./components/PrivacyPolicyScreen";
import BottomNav from "./components/BottomNav";
import PasswordInputDemo from "./components/PasswordInputDemo";
import CardScanScreen from "./components/CardScanScreen";
import marhabaLogo from "./imports/2177178-removebg-preview__1_.png";

const appScreens = ["home", "emergency", "business", "events", "accessory", "settings"];

function LoadingScreen() {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--background)", gap: 20,
    }}>
      <img src={marhabaLogo} alt="مرحبا NFC" style={{ width: 80, height: "auto", opacity: 0.9 }} />
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid rgba(201,168,76,0.2)",
        borderTopColor: "#c9a84c",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppShell() {
  const { screen, dbLoading } = useApp();
  const showNav = appScreens.includes(screen);

  if (dbLoading && screen === "home") {
    return <div className="app-shell"><LoadingScreen /></div>;
  }

  return (
    <div className="app-shell">
      {screen === "auth" && <AuthScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "emergency" && <EmergencyScreen />}
      {screen === "business" && <BusinessScreen />}
      {screen === "events" && <EventsScreen />}
      {screen === "accessory" && <AccessoryScreen />}
      {screen === "settings" && <SettingsScreen />}
      {screen === "offline-settings" && <OfflineSettingsScreen />}
      {screen === "privacy-policy" && <PrivacyPolicyScreen />}
      {screen === "reader-emergency" && <ReaderView mode="emergency" />}
      {screen === "reader-business" && <ReaderView mode="business" />}
      {screen === "reader-events" && <ReaderView mode="events" />}
      {screen === "password-demo" && <PasswordInputDemo />}
      {screen === "card-scan" && <CardScanScreen />}
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

