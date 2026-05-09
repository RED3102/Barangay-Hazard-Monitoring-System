import { LayoutDashboard, Radio, AlertTriangle, CheckSquare, ClipboardList, Users, BarChart2 } from "lucide-react";
import { SubdivisionMapPanel } from "./SubdivisionMapPanel";

export function Sidebar({ activeMenu, setActiveMenu, onLogout }) {
  const menuItems = [
    { id: "dashboard",          label: "Dashboard",          icon: LayoutDashboard },
    { id: "sensor-monitoring",  label: "Sensor Monitoring",  icon: Radio },
    { id: "hazard-alerts",      label: "Hazard Alerts",      icon: AlertTriangle },
    { id: "alert-verification", label: "Alert Verification", icon: CheckSquare },
    { id: "activity-logs",      label: "Activity Logs",      icon: ClipboardList },
    { id: "reports-analytics",  label: "Reports & Analytics",icon: BarChart2 },
    { id: "residents",          label: "Residents",          icon: Users },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex flex-col shrink-0 transition-colors duration-300">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <div className="bg-blue-600 p-2 rounded-xl text-white">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h1 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Barangay Salitran III</h1>
          <h2 className="text-[10px] text-gray-500 dark:text-gray-400">Hazard Monitoring System</h2>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Subdivisions Map */}
      <SubdivisionMapPanel />
    </div>
  );
}