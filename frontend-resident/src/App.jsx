import { useState, useEffect } from "react";
import { MobileFrame }  from "./components/MobileFrame";
import { BottomNav }    from "./components/BottomNav";
import { DataProvider } from "./context/DataContext";
import { Home }         from "./pages/Home";
import { Alerts }       from "./pages/Alerts";
import { Report }       from "./pages/Report";
import { Contacts }     from "./pages/Contacts";
import { SignIn }       from "./pages/SignIn";
import { Register }     from "./pages/Register";
import { Profile }      from "./pages/Profile";
import { Settings }     from "./pages/Settings";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload) return false;
  // exp is in seconds
  return payload.exp * 1000 > Date.now();
}

export default function App() {
  const [currentPage,     setCurrentPage]     = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser,     setCurrentUser]     = useState(null);

  // Restore session from localStorage on mount
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

  const renderPage = () => {
    if (!isAuthenticated) {
      if (currentPage === "register") {
        return (
          <Register
            onNavigateToSignIn={() => setCurrentPage("signin")}
          />
        );
      }
      return (
        <SignIn
          onLogin={handleLogin}
          onNavigateToRegister={() => setCurrentPage("register")}
        />
      );
    }

    switch (currentPage) {
      case "home":     return <Home />;
      case "alerts":   return <Alerts />;
      case "report":   return <Report />;
      case "contacts": return <Contacts />;
      case "profile":
        return (
          <Profile
            user={currentUser}
            onNavigateToSettings={() => setCurrentPage("settings")}
            onLogout={handleLogout}
          />
        );
      case "settings":
        return <Settings onNavigateBack={() => setCurrentPage("profile")} />;
      default:
        return <Home />;
    }
  };

  const showBottomNav = isAuthenticated && currentPage !== "settings";

  return (
    <DataProvider>
      <MobileFrame>
        <div className="h-full w-full overflow-y-auto bg-gray-50 relative">
          {renderPage()}
        </div>
        {showBottomNav && (
          <BottomNav currentPath={currentPage} onNavigate={setCurrentPage} />
        )}
      </MobileFrame>
    </DataProvider>
  );
}