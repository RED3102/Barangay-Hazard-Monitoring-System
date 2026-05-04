import { LayoutDashboard, Radio, AlertTriangle, CheckSquare, ClipboardList, Users } from "lucide-react";
import { SubdivisionMapPanel } from "./SubdivisionMapPanel";
import { BarChart2 } from "lucide-react";

export function Sidebar({ activeMenu, setActiveMenu }) {
  const menuItems = [
    { id: "dashboard",          label: "Dashboard",          icon: LayoutDashboard },
    { id: "sensor-monitoring",  label: "Sensor Monitoring",  icon: Radio },
    { id: "hazard-alerts",      label: "Hazard Alerts",      icon: AlertTriangle },
    { id: "alert-verification", label: "Alert Verification", icon: CheckSquare },
    { id: "activity-logs",      label: "Activity Logs",      icon: ClipboardList },
    { id: "reports-analytics", label: "Reports & Analytics", icon: BarChart2 },
    { id: "residents",          label: "Residents",          icon: Users } 
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
        <div className="bg-blue-600 p-2 rounded-xl text-white">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 leading-tight">Barangay</h1>
          <h2 className="text-xs text-gray-500">Monitoring System</h2>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1.5 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
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
