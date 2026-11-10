import React, { useState } from 'react';
import { Code2, Copy, Check, X, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { sound } from '../services/soundService';

interface AppsScriptCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId?: string;
}

export const AppsScriptCodeModal: React.FC<AppsScriptCodeModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId = '1zNmNffLiaPrgWVzwLgn52pEV2HsagMVtGeQEthIpmow'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = GoogleSheetsService.getAppsScriptCode(spreadsheetId);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    sound.playVictory();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b111e] border-2 border-indigo-500/50 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Google Apps Script Code</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                  NAJI HASSAN (11 Columns)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Nuqul ka qaad koodhkan oo geli Google Sheet-kaaga (Extensions &gt; Apps Script)
              </p>
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

        {/* Step-by-Step Instructions */}
        <div className="p-4 bg-[#070b14] border-b border-slate-800 text-xs text-slate-300 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>4 Tallaabo oo Fudud (How to Install):</span>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-300">
            <li className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-white block mb-0.5">1. Extensions</strong>
              Geli Google Sheets, guji <span className="text-cyan-300">Extensions &gt; Apps Script</span>.
            </li>
            <li className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-white block mb-0.5">2. Paste Code</strong>
              Tirtir wixii ku jiray oo paste ku dheh koodhkan, kadib guji <span className="text-cyan-300">Save (Disk icon)</span>.
            </li>
            <li className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-white block mb-0.5">3. Deploy as Web App</strong>
              Guji <span className="text-cyan-300">Deploy &gt; Manage deployments &gt; Edit (ama New deployment)</span>, dooro <span className="text-cyan-300">Web app</span>.
            </li>
            <li className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-emerald-400 block mb-0.5">4. Anyone Access</strong>
              Dooro <span className="text-emerald-400 font-bold">Who has access: Anyone</span>, guji Deploy, oo soo qaado link-ga ku dhamaada <span className="font-mono text-cyan-300">/exec</span>!
            </li>
          </ol>
        </div>

        {/* Code Block with Select All */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Linked Spreadsheet ID: <strong className="text-cyan-400">{spreadsheetId}</strong>
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
            </button>
          </div>

          <pre className="p-4 bg-[#050811] rounded-2xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto select-all leading-relaxed max-h-[380px]">
            {scriptCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Supports exact 11 columns matching sheet "ALL PRODUCT".
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
