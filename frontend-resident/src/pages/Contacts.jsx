import { PhoneCall, Shield, Ambulance, Flame } from "lucide-react";

export function Contacts() {
  const contacts = [
    { name: "Police Sub-station", number: "117", icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Fire Department", number: "911", icon: Flame, color: "text-red-600", bg: "bg-red-50" },
    { name: "Medical Responder", number: "143", icon: Ambulance, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Barangay Hall", number: "8888-1234", icon: PhoneCall, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-6">
      <div className="bg-gray-900 text-white px-6 pt-10 pb-8 rounded-b-[2.5rem] relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <h1 className="text-2xl font-bold mb-2">Contacts</h1>
        <p className="text-gray-400 text-sm">Direct lines to emergency services.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6 bg-gray-50 -mt-4 rounded-t-3xl relative">
        <div className="grid grid-cols-1 gap-4">
           {contacts.map((contact, i) => {
             const Icon = contact.icon;
             return (
               <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className={`${contact.bg} ${contact.color} p-3 rounded-[1rem]`}>
                        <Icon size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 leading-tight">{contact.name}</h3>
                        <p className="text-gray-500 font-medium text-sm mt-0.5">{contact.number}</p>
                     </div>
                  </div>
                  <button className={`${contact.color} bg-gray-50 p-3 rounded-full hover:bg-gray-100 transition-colors`}>
                     <PhoneCall size={20} />
                  </button>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
}
