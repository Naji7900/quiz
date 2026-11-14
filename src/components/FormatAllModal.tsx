import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { sound } from '../services/soundService';

interface FormatAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCount: number;
  onConfirmFormat: () => void;
}

export const FormatAllModal: React.FC<FormatAllModalProps> = ({
  isOpen,
  onClose,
  productCount,
  onConfirmFormat
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'FORMAT';

  const handleExecuteFormat = () => {
    if (!isConfirmed) return;
    sound.playTick();
    onConfirmFormat();
    setConfirmationInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b111e] border-2 border-red-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">1. FORMAT ALL APP DATA</h3>
              <p className="text-xs text-red-400 font-medium">Safe Clear Safeguard (0 Products)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Text */}
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-850/60 space-y-2">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Format All Application Data</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This will clear all <strong className="text-white font-mono">{productCount}</strong> products currently stored in the app so you can upload fresh data cleanly.
          </p>
        </div>

        {/* Safety Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Type <span className="font-mono text-red-400 font-bold">FORMAT</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="Type FORMAT here..."
            className="w-full bg-[#070c18] border-2 border-slate-700 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold tracking-widest outline-none text-center"
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteFormat}
            disabled={!isConfirmed}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
              isConfirmed
                ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/60 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm & Format All</span>
          </button>
        </div>

      </div>
    </div>
  );
};
