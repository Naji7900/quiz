import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Laptop, 
  QrCode, 
  X, 
  CheckCircle2, 
  Share2, 
  Check, 
  ShieldCheck, 
  Zap,
  FileSpreadsheet,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sound } from '../services/soundService';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { SparePartItem } from '../data/initialData';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts?: SparePartItem[];
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, parts = [] }) => {
  const { isInstallable, isInstalled, isWindows, isAndroid, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'mobile_qr' | 'pc' | 'data'>('mobile_qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setCurrentUrl(url);
      QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: {
          dark: '#030712',
          light: '#ffffff'
        }
      })
      .then(setQrDataUrl)
      .catch(err => console.warn('QR code generation error', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handle1ClickInstall = async () => {
    sound.playTick();
    const success = await install();
    if (success) {
      sound.playVictory();
      onClose();
    }
  };

  const handleCopyLink = () => {
    sound.playTick();
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadCsv = () => {
    sound.playTick();
    if (parts && parts.length > 0) {
      GoogleSheetsService.exportToCSV(parts);
    } else {
      GoogleSheetsService.download11ColumnTemplate();
    }
  };

  const handleDownloadMultiTab = () => {
    sound.playTick();
    if (parts && parts.length > 0) {
      GoogleSheetsService.exportToMultiTabWorkbook(parts);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1120] border-2 border-cyan-500/50 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60 shrink-0">
              <Download className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>DOWNLOAD &amp; INSTALL</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                  PC &amp; MOBILE QR
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Install on Laptop PC or scan the QR Code on your Mobile Phone (iPhone &amp; Android)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Mobile QR, PC Download, Data Download) */}
        <div className="p-3 bg-[#070b14] border-b border-slate-800 grid grid-cols-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { sound.playTick(); setActiveTab('mobile_qr'); }}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'mobile_qr'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-cyan-300" />
            <span>Mobile QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => { sound.playTick(); setActiveTab('pc'); }}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'pc'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-indigo-300" />
            <span>PC &amp; Laptop</span>
          </button>

          <button
            type="button"
            onClick={() => { sound.playTick(); setActiveTab('data'); }}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'data'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Download Data</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: MOBILE QR CODE */}
          {activeTab === 'mobile_qr' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1">
                <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center justify-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>Scan to Open &amp; Download on Mobile Phone</span>
                </span>
                <p className="text-xs text-slate-300">
                  Point your <strong>iPhone Camera</strong> or <strong>Android QR Scanner</strong> at the QR code below:
                </p>
              </div>

              {/* QR Code Container with Glowing Frame */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-3 bg-white rounded-3xl shadow-2xl border-4 border-cyan-500/80 shadow-cyan-950/70 relative group">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Mobile Download QR Code" 
                      className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl block" 
                    />
                  ) : (
                    <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-500 text-xs">
                      Generating QR Code...
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile App Link'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile Quick Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>Android (Chrome / Samsung)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    1. Scan QR code to open.<br />
                    2. Tap the three dots (⋮) in Chrome.<br />
                    3. Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>Apple iPhone (iOS Safari)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    1. Scan QR with iPhone Camera.<br />
                    2. Tap the <strong>Share</strong> button (box with arrow).<br />
                    3. Tap <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PC & LAPTOP DOWNLOAD */}
          {activeTab === 'pc' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Direct 1-Click Install Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border-2 border-cyan-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="font-bold text-sm text-cyan-200 flex items-center justify-center sm:justify-start gap-1.5">
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    <span>PC Desktop Application Download</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Run DO OR DIE PRO as a standalone desktop software on Windows, Mac, or Linux!
                  </p>
                </div>
                {isInstallable && !isInstalled ? (
                  <button
                    type="button"
                    onClick={handle1ClickInstall}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-950/50 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install on PC Now</span>
                  </button>
                ) : isInstalled ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Installed on PC</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handle1ClickInstall}
                    className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download App</span>
                  </button>
                )}
              </div>

              {/* PC Step-by-Step */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>How to Install on Laptop / PC (Google Chrome or Microsoft Edge):</span>
                </div>
                <ol className="space-y-1.5 pl-4 list-decimal text-slate-300">
                  <li>Look at the right side of the browser's <strong>URL address bar</strong>.</li>
                  <li>Click the computer monitor install icon with the downward arrow (<strong>"Install DO OR DIE PRO"</strong>).</li>
                  <li>Click <strong>Install</strong>. The app will launch in its own native window without browser tabs!</li>
                  <li>An icon is added directly to your Windows Taskbar, Start Menu, or Mac Dock.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Offline Support: Once downloaded, you can open and view your catalog even without an internet connection.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: DATA & CATALOG DOWNLOADS */}
          {activeTab === 'data' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Download Catalog Data &amp; Google Sheet Templates</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Export all 11 columns, multi-tab workbooks, or blank templates for Google Sheets:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    <span>All-In-One 11 Columns CSV</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Downloads exact 11 columns (ID, Name, Cat, Price D, Yuan, USD+, Sales $, Company, Shipment, Origin, Date).
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV ({parts.length} Parts)</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Multi-Tab Excel Workbook (.xls)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Creates dedicated tabs for every category, Photos, and Compatible LCDs for direct Excel / Google Sheets import.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadMultiTab}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Multi-Tab Excel</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Blank 11-Column CSV Template:</span>
                <button
                  type="button"
                  onClick={() => GoogleSheetsService.download11ColumnTemplate()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition-colors"
                >
                  Download Template
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[280px] sm:max-w-md">
            {currentUrl}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
