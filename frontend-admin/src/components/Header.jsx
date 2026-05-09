import { User, LogOut, Sun, Moon } from "lucide-react";

export function Header({ user, onLogout, isDark, setIsDark }) {
  return (
    <header className="h-[72px] bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-8 flex items-center justify-between shrink-0 transition-colors duration-300">
      <div>
        <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
          Barangay Salitran III Hazard Monitoring System
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Real-time disaster monitoring and alert management
        </p>
      </div>

      <div className="flex items-center gap-3 pl-6">
        <button
          onClick={() => setIsDark(v => !v)}
          className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
            {user?.name || "Barangay Official"}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">Administrator</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <User size={18} />
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}