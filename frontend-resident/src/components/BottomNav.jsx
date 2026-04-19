import { Home, Bell, PlusCircle, Phone, User } from "lucide-react";

export function BottomNav({ currentPath, onNavigate }) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "alerts", icon: Bell, label: "Alerts" },
    { id: "report", icon: PlusCircle, label: "Report" },
    { id: "contacts", icon: Phone, label: "Contacts" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center h-16 px-2 z-50">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className={`p-1 rounded-full transition-all ${isActive ? "bg-blue-50" : ""}`}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
