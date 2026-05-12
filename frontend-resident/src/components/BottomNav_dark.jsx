import { Home, Bell, PlusCircle, Phone, User, Sun, Moon } from "lucide-react";

export function BottomNav({ currentPath, onNavigate, isDark, setIsDark }) {
  const tabs = [
    { id: "home",     icon: Home,       label: "Home"     },
    { id: "alerts",   icon: Bell,       label: "Alerts"   },
    { id: "report",   icon: PlusCircle, label: "Report"   },
    { id: "contacts", icon: Phone,      label: "Contacts" },
    { id: "profile",  icon: User,       label: "Profile"  },
  ];

  return (
    <div className="absolute bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-around items-center h-16 px-1 z-50 transition-colors duration-300">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <div className={`p-1 rounded-full transition-all ${isActive ? "bg-blue-50 dark:bg-blue-950" : ""}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Dark mode toggle as small button in bottom nav */}
      <button
        onClick={() => setIsDark(v => !v)}
        className="flex flex-col items-center justify-center w-10 h-full gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Toggle dark mode"
      >
        <div className="p-1 rounded-full">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </div>
        <span className="text-[9px] font-medium">{isDark ? "Light" : "Dark"}</span>
      </button>
    </div>
  );
}