import { useState, useEffect } from "react";
import { MobileFrame }   from "./components/MobileFrame";
import { BottomNav }     from "./components/BottomNav_dark";
import { DataProvider }  from "./context/DataContext";
import { AlertBanner }   from "./components/AlertBanner";
import { useDarkMode }   from "./hooks/useDarkMode";
import { Home }          from "./pages/Home_dark";
import { Alerts }        from "./pages/Alerts";
import { Report }        from "./pages/Report";
import { Contacts }      from "./pages/Contacts";
import { SignIn }        from "./pages/SignIn_dark";
import { Register }      from "./pages/Register";
import { Profile }       from "./pages/Profile";
import { Settings }      from "./pages/Settings";
import { useData }       from "./context/DataContext";

function parseJwt(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  return payload ? payload.exp * 1000 > Date.now() : false;
}

// Inner component that has access to DataContext
function AppInner({ currentPage, setCurrentPage, isAuthenticated, handleLogin, handleLogout, currentUser, isDark, setIsDark }) {
  const { alerts } = useData();

  const renderPage = () => {
    if (!isAuthenticated) {
      if (currentPage === "register") {
        return <Register onNavigateToSignIn={() => setCurrentPage("signin")} />;
      }
      return <SignIn onLogin={handleLogin} onNavigateToRegister={() => setCurrentPage("register")} />;
    }
    switch (currentPage) {
      case "home":     return <Home />;
      case "alerts":   return <Alerts />;
      case "report":   return <Report />;
      case "contacts": return <Contacts />;
      case "profile":  return <Profile user={currentUser} onNavigateToSettings={() => setCurrentPage("settings")} onLogout={handleLogout} />;
      case "settings": return <Settings onNavigateBack={() => setCurrentPage("profile")} />;
      default:         return <Home />;
    }
  };

  const showBottomNav = isAuthenticated && currentPage !== "settings";

  return (
    <MobileFrame>
      {isAuthenticated && <AlertBanner alerts={alerts} />}
      <div className="h-full w-full overflow-y-auto bg-gray-50 dark:bg-gray-950 relative transition-colors duration-300">
        {renderPage()}
      </div>
      {showBottomNav && (
        <BottomNav
          currentPath={currentPage}
          onNavigate={setCurrentPage}
          isDark={isDark}
          setIsDark={setIsDark}
        />
      )}
    </MobileFrame>
  );
}

export default function App() {
  const [currentPage,     setCurrentPage]     = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser,     setCurrentUser]     = useState(null);
  const [isDark,          setIsDark]          = useDarkMode();

  useEffect(() => {
    const token = localStorage.getItem("resident_token");
    const saved = localStorage.getItem("resident_profile");
    if (isTokenValid(token) && saved) {
      try {
        setCurrentUser(JSON.parse(saved));
        setIsAuthenticated(true);
      } catch {
        handleLogout();
      }
    }
  }, []);

  const handleLogin = (user, token) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("resident_token");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage("home");
  };

  return (
    <DataProvider>
      <AppInner
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isAuthenticated={isAuthenticated}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        currentUser={currentUser}
        isDark={isDark}
        setIsDark={setIsDark}
      />
    </DataProvider>
  );
}