import { useState } from "react";
import { ArrowLeft, Save, User, MapPin, Phone, Info, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT = {
  name:        "",
  phone:       "",
  address:     "",
  description: "",
};

function loadProfile() {
  try {
    const saved = localStorage.getItem("resident_profile");
    return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function Settings({ onNavigateBack }) {
  const [formData, setFormData] = useState(loadProfile);
  const [saved,    setSaved]    = useState(false);

  const handleChange = (e) => {
    setSaved(false);
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("resident_profile", JSON.stringify(formData));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onNavigateBack();
    }, 1200);
  };

  const fields = [
    { name: "name",        label: "Full Name",    icon: User,    type: "text",     placeholder: "Your full name"        },
    { name: "phone",       label: "Phone Number", icon: Phone,   type: "tel",      placeholder: "+63 9XX XXX XXXX"      },
    { name: "address",     label: "Address",      icon: MapPin,  type: "text",     placeholder: "Block, Lot, Zone..."   },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-10 pb-4 shadow-sm flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={onNavigateBack}
          className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">

            {fields.map(({ name, label, icon: Icon, type, placeholder }) => (
              <div key={name}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
                  {label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            ))}

            {/* Bio — textarea */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
                Bio / Description
              </label>
              <div className="relative">
                <div className="absolute top-4 left-0 pl-4 flex pointer-events-none">
                  <Info size={18} className="text-gray-400" />
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="A little about yourself..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium resize-none"
                />
              </div>
            </div>

          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className={`w-full font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg transition-colors
              ${saved
                ? "bg-emerald-600 shadow-emerald-600/30"
                : "bg-blue-600 shadow-blue-600/30 active:bg-blue-700"
              } text-white`}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  Saved!
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Save size={20} />
                  Save Changes
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </div>
    </div>
  );
}