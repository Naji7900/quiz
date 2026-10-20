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
  Zap 
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sound } from '../services/soundService';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isWindows, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'windows' | 'qr'>(() => {
    return isWindows ? 'windows' : 'android';
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      QRCode.toDataURL(url, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(setQrDataUrl)
      .catch(err => console.warn('QR code generation error', err));
    }
  }, []);

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
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Install on Android & Windows PC
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                Setup guide to run Reer Hassan Suite standalone like a native app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Direct Install Button */}
        {isInstallable && !isInstalled && (
          <div className="p-4 bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <span className="font-bold text-sm text-cyan-200 block">
                Direct One-Click Install Ready!
              </span>
              <span className="text-xs text-slate-300 font-normal">
                Click the button to immediately install this app onto your device.
              </span>
            </div>
            <button
              type="button"
              onClick={handle1ClickInstall}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition-all shrink-0 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Install Now</span>
            </button>
          </div>
        )}

        {isInstalled && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Standalone App Mode Active: This app is installed and running on your system!</span>
          </div>
        )}

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { sound.playTick(); setActiveTab('android'); }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'android'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android Phone</span>
          </button>

          <button
            type="button"
            onClick={() => { sound.playTick(); setActiveTab('windows'); }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'windows'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4 text-cyan-400" />
            <span>Windows PC</span>
          </button>

          <button
            type="button"
            onClick={() => { sound.playTick(); setActiveTab('qr'); }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'qr'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Scan QR</span>
          </button>
        </div>

        {/* TAB 1: ANDROID GUIDE */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-mono">
                  1
                </span>
                <span>Android Instructions (Google Chrome / Samsung Internet):</span>
              </h4>

              <div className="space-y-2 text-xs text-slate-300 pl-8">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">01.</span>
                  <span>Open the app in Chrome or Samsung Internet on your phone.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">02.</span>
                  <span>
                    Tap the <strong className="text-white">three dots menu (⋮)</strong> in the top-right or bottom toolbar.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">03.</span>
                  <span>
                    Select <strong className="text-emerald-400">"Install app"</strong> or <strong className="text-emerald-400">"Add to Home screen"</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">04.</span>
                  <span>
                    Tap <strong className="text-white">Install</strong>. An app icon will appear directly on your home screen and app drawer!
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Key benefit: Works completely offline, opens instantly in full screen with no browser address bar!
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: WINDOWS PC GUIDE */}
        {activeTab === 'windows' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-mono">
                  1
                </span>
                <span>Windows PC Instructions (Google Chrome / Microsoft Edge):</span>
              </h4>

              <div className="space-y-2 text-xs text-slate-300 pl-8">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">01.</span>
                  <span>Open this website in Google Chrome or Microsoft Edge on your PC.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">02.</span>
                  <span>
                    Look at the right side of the <strong className="text-white">URL Address Bar</strong> for the computer install icon with a downward arrow.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">03.</span>
                  <span>
                    Click <strong className="text-white">"Install"</strong> to install Reer Hassan Suite.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-cyan-400 font-mono">04.</span>
                  <span>
                    The app will be added directly to your <strong className="text-white">Windows Start Menu, Desktop, and Taskbar</strong>!
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Runs as a dedicated desktop software window with high performance and zero browser clutter.
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: SCAN QR CODE */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center animate-in fade-in">
            <p className="text-xs text-slate-400">
              Point your Android phone camera at the QR code below to immediately open the app on your mobile device:
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl mx-auto border-4 border-slate-800">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan to open on Mobile" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy App Link'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
