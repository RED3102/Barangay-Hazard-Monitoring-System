import { User, Phone, MapPin, Settings as SettingsIcon, LogOut, ChevronRight, Shield } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_USER = {
  name:        "Resident",
  role:        "Resident",
  phone:       "—",
  address:     "—",
  description: "",
  verified:    false,
};

export function Profile({ onNavigateToSettings, onLogout }) {
  const [user, setUser] = useState(DEFAULT_USER);

  // Load saved profile from localStorage whenever this page is shown
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resident_profile");
      if (saved) setUser({ ...DEFAULT_USER, ...JSON.parse(saved) });
    } catch {
      // ignore parse errors
    }
  }, []);

  // Initials for avatar
  const initials = user.name
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="pb-24 bg-gray-50 flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-blue-600 px-6 pt-10 pb-16 shadow-sm relative overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center pt-4">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-blue-400 mb-4">
            {initials
              ? <span className="text-2xl font-bold text-blue-600">{initials}</span>
              : <User size={48} className="text-gray-300" />
            }
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {user.name}
            {user.verified && <Shield size={18} className="text-emerald-400 fill-emerald-400/20" />}
          </h1>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mt-2">
            {user.role}
          </span>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-20 space-y-4">
        {/* About */}
        {user.description ? (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">{user.description}</p>
          </div>
        ) : null}

        {/* Details */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Details</h3>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Phone Number</p>
              <p className="text-sm font-bold text-gray-900">{user.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Home Address</p>
              <p className="text-sm font-bold text-gray-900">{user.address}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex flex-col">
          <button
            onClick={onNavigateToSettings}
            className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-xl text-gray-700">
                <SettingsIcon size={20} />
              </div>
              <span className="font-semibold text-gray-900">Profile Settings</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <div className="h-[1px] bg-gray-100 mx-4" />

          <button
            onClick={onLogout}
            className="flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-50 group-hover:bg-red-100 p-2 rounded-xl text-red-600 transition-colors">
                <LogOut size={20} />
              </div>
              <span className="font-semibold text-red-600">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}