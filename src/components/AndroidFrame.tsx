import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryMedium,
  Signal,
  Smartphone,
  Maximize2,
  Minimize2,
  FolderCode,
  Volume2,
  VolumeX,
  Code2,
  Download
} from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeColorHex?: string;
  isFramed: boolean;
  onToggleFrame: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onOpenProjectModal: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeColorHex,
  isFramed,
  onToggleFrame,
  isSoundEnabled,
  onToggleSound,
  onOpenProjectModal,
}) => {
  const [timeString, setTimeString] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const accentColor = activeColorHex || '#2563EB';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 select-none transition-colors duration-500">
      {/* Top Desktop Controls Bar (visible on tablet/desktop) */}
      <header className="hidden sm:flex w-full max-w-4xl items-center justify-between px-4 py-2.5 mb-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-xs shadow-xl">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full animate-pulse shadow-md"
            style={{ backgroundColor: accentColor }}
          />
          <div>
            <span className="font-bold tracking-tight text-sm text-white flex items-center gap-2">
              CarVision AI
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-medium border border-blue-500/30">
                Android Studio Edition
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Button to view / download Android Studio Project */}
          <button
            onClick={onOpenProjectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium shadow-md shadow-blue-600/30 transition-all"
            title="Inspect Kotlin Source Code and Download Project"
          >
            <FolderCode className="w-3.5 h-3.5" />
            <span>Android Studio Project (.ZIP)</span>
          </button>

          <button
            onClick={onToggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Sound Effects"
          >
            {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isSoundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          <button
            onClick={onToggleFrame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            {isFramed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Mockup</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 flex justify-center ${
          isFramed
            ? 'max-w-[420px] my-auto'
            : 'max-w-2xl min-h-screen sm:min-h-0 sm:my-2'
        }`}
      >
        {/* Device Outer Frame (Simulated Android Pixel / Galaxy Device) */}
        <div
          className={`w-full bg-slate-900 overflow-hidden transition-all duration-300 flex flex-col ${
            isFramed
              ? 'rounded-[46px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(37,99,235,0.15)] border-[10px] border-slate-800/90 relative h-[860px]'
              : 'rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-800 shadow-2xl min-h-screen sm:min-h-[850px]'
          }`}
        >
          {/* Android Status Bar with Camera Punch-Hole */}
          <div className="w-full h-11 px-6 pt-2 flex items-center justify-between text-xs font-semibold text-slate-300 select-none bg-slate-950/70 z-30 shrink-0">
            <span>{timeString}</span>

            {/* Front Camera Punch-hole */}
            <div className="w-4 h-4 rounded-full bg-black border border-slate-800/80 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-950/70" />
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">98%</span>
                <BatteryMedium className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Screen Content Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
            {children}
          </div>

          {/* Android Gesture Bar */}
          <div className="w-full py-2.5 flex justify-center items-center bg-slate-950 shrink-0">
            <div className="w-32 h-1 rounded-full bg-slate-600/70" />
          </div>
        </div>
      </div>
    </div>
  );
};
