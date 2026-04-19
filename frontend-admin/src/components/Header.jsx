import { Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-[88px] bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">
          Barangay Hazard Monitoring System
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time disaster monitoring and alert management
        </p>
      </div>
        <div className="flex items-center gap-4 pl-6">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 leading-none">Barangay Official</p>
            <p className="text-[13px] text-gray-500 mt-1.5">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <User size={20} />
          </div>
        </div>
    </header>
  );
}
