import React, { useState } from "react";
import { X, Plus, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EnvVar {
  key: string;
  value: string;
}

interface EnvSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnvSettingsModal: React.FC<EnvSettingsModalProps> = ({ isOpen, onClose }) => {
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: "API_KEY", value: "AlzaSyAR382WuVzkZjLQD..." },
    { key: "GOOGLE_API_KEY", value: "AlzaSyAR382WuVzkZjLQD..." },
    { key: "GEMINI_API_KEY", value: "AlzaSyAR382WuVzkZjLQD..." },
    { key: "VITE_GOOGLE_API_KEY", value: "AlzaSyAR382WuVzkZjLQD..." },
    { key: "VITE_GEMINI_API_KEY", value: "AlzaSyAR382WuVzkZjLQD..." },
  ]);

  const addRow = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateVar = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...envVars];
    updated[index][field] = newValue;
    setEnvVars(updated);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 pb-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Set environment variables</h2>
            <p className="text-sm text-gray-500">Environment variables will be applied during the build process.</p>
          </div>

          {/* Table Header */}
          <div className="px-8 mt-6">
            <div className="grid grid-cols-[1fr,1.5fr,40px] gap-4 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Key</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Value</span>
              <span></span>
            </div>
          </div>

          {/* Table Body - Scrollable */}
          <div className="px-8 max-h-[300px] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-3 pb-4">
              {envVars.map((env, index) => (
                <div key={index} className="grid grid-cols-[1fr,1.5fr,40px] gap-4 items-center">
                  <input
                    type="text"
                    value={env.key}
                    onChange={(e) => updateVar(index, "key", e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    placeholder="KEY"
                  />
                  <input
                    type="text"
                    value={env.value}
                    onChange={(e) => updateVar(index, "value", e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    placeholder="VALUE"
                  />
                  <button 
                    onClick={() => removeRow(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-4 flex gap-3">
            <button 
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add more
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all">
              <FileText className="h-4 w-4" />
              Import .env
            </button>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 flex justify-end items-center gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              Finish
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
