import React, { useEffect, useState } from "react";
import { useJeetvis } from "./context/JeetvisContext";
import ConcealedDock from "./components/ConcealedDock";
import CommandPalette from "./components/CommandPalette";
import ShortcutOverlay from "./components/ShortcutOverlay";
import DashboardGrid from "./components/DashboardGrid";
import { Activity, ShieldCheck, Wifi, Cpu, Database, Search, Code, Terminal, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const {
    terminalLogs,
    isMuted,
    setIsMuted,
    isVoiceEnabled,
    setIsVoiceEnabled,
    selectedVoice,
    setSelectedVoice,
    voiceOptions,
    isOffline,
    isSimpleMode,
    setIsSimpleMode,
    activePhotoUrl,
    setActivePhotoUrl
  } = useJeetvis();

  const [mobileActiveView, setMobileActiveView] = useState<"directives" | "core" | "sandbox" | "telemetry">("core");

  // Simulated live telemetry stats
  const [cpu, setCpu] = useState(38.4);
  const [ram, setRam] = useState(65.1);
  const [temp, setTemp] = useState(36.0);
  const [ping, setPing] = useState(14);

  useEffect(() => {
    const statsInterval = setInterval(() => {
      setCpu((prev) => parseFloat(Math.min(95, Math.max(10, prev + (Math.random() - 0.5) * 6)).toFixed(1)));
      setRam((prev) => parseFloat(Math.min(90, Math.max(50, prev + (Math.random() - 0.5) * 1)).toFixed(1)));
      setTemp((prev) => parseFloat(Math.min(55, Math.max(30, prev + (Math.random() - 0.5) * 0.4)).toFixed(1)));
      setPing((prev) => Math.floor(Math.min(45, Math.max(8, prev + Math.floor((Math.random() - 0.5) * 4)))));
    }, 2000);

    return () => clearInterval(statsInterval);
  }, []);

  return (
    <div id="jeetvis-command-matrix" className="min-h-screen bg-[#000000] text-slate-100 flex flex-col font-sans relative antialiased overflow-hidden select-none">
      
      {/* Absolute Cinematic Underlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-400/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Top Margin Minimalist HUD */}
      <header className="px-8 py-6 flex items-center justify-between relative z-10 w-full max-w-7xl mx-auto border-b border-white/5 bg-[#000000]/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className={`h-2 w-2 rounded-full ${isSimpleMode ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"}`} />
          </div>
          <div className="text-left">
            <h1 className="font-mono text-xs font-bold tracking-widest text-white uppercase">
              {isSimpleMode ? "JEETVIS // YOUR COMPANION" : "JEETVIS // CORE SYSTEMS"}
            </h1>
            <p className="text-[7px] text-slate-500 font-mono tracking-[0.3em] uppercase mt-0.5">
              {isSimpleMode ? "EASY & SMART TASK DASHBOARD" : "AUTONOMOUS COMMAND DECK"}
            </p>
          </div>
        </div>

        {/* Dynamic Telemetry Strip */}
        {isSimpleMode ? (
          <div className="hidden md:flex items-center gap-2 font-mono text-[8px] text-emerald-400 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Smart Assistant active and ready to make your day easy</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-8 font-mono text-[8px] text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors duration-200">
              <Cpu className="h-3 w-3 text-cyan-400/70" />
              CPU LOAD: <span className="text-white font-medium">{cpu}%</span>
            </span>
            <span>|</span>
            <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors duration-200">
              <Database className="h-3 w-3 text-cyan-400/70" />
              RAM ALLOC: <span className="text-white font-medium">{ram}%</span>
            </span>
            <span>|</span>
            <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors duration-200">
              <Activity className="h-3 w-3 text-cyan-400/70" />
              CORE TEMP: <span className="text-white font-medium">{temp}°C</span>
            </span>
            <span>|</span>
            <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors duration-200">
              <Wifi className={`h-3 w-3 ${isOffline ? "text-rose-500" : "text-cyan-400/70"}`} />
              GRID LATENCY: <span className={`${isOffline ? "text-rose-400" : "text-white"} font-medium`}>{isOffline ? "SEVERED" : `${ping}ms`}</span>
            </span>
          </div>
        )}

        {/* Security / System Cleanliness */}
        <div className="flex items-center gap-5 font-mono text-[8px] tracking-widest">
          {/* Easy Switch Toggle */}
          <button 
            onClick={() => setIsSimpleMode(!isSimpleMode)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 rounded-full transition-all duration-300 cursor-pointer text-slate-300 hover:text-white"
            title="Toggle between a simpler interface and a high-tech developer deck"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isSimpleMode ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse"}`} />
            <span className="font-mono text-[8px] uppercase tracking-wider font-bold">
              {isSimpleMode ? "Simple Mode" : "Tactical Mode"}
            </span>
          </button>
          
          <span className="text-slate-800">|</span>

          <button 
            id="header-search-trigger"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors duration-200 cursor-pointer outline-none"
          >
            <Search className="h-3.5 w-3.5" />
            <span>COMMANDS</span>
            <span className="text-[7px] bg-white/5 px-1 rounded text-slate-500 font-bold border border-white/5">Ctrl+K</span>
          </button>
          <span className="text-slate-800">|</span>
          <div className={`flex items-center gap-1.5 ${isSimpleMode ? "text-emerald-400" : "text-cyan-400"}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isSimpleMode ? "SECURE CONNECTION" : "FIREWALL SECURE"}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 overflow-hidden pb-16 sm:pb-0">
        
        {/* Dynamic Responsive Dashboard Grid */}
        <DashboardGrid mobileActiveView={mobileActiveView} />
        
        {/* Sliding Panel Dock Controls (Now for workspace/memory only) */}
        <ConcealedDock />

      </main>

      {/* Mobile Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50 px-6 flex items-center justify-between">
        <button 
          onClick={() => setMobileActiveView("directives")}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${mobileActiveView === "directives" ? "text-cyan-400" : "text-slate-500"}`}
        >
          <Activity className="h-5 w-5" />
          <span className="font-mono text-[8px] uppercase tracking-tighter">Directives</span>
        </button>
        <button 
          onClick={() => setMobileActiveView("sandbox")}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${mobileActiveView === "sandbox" ? "text-cyan-400" : "text-slate-500"}`}
        >
          <Code className="h-5 w-5" />
          <span className="font-mono text-[8px] uppercase tracking-tighter">Sandbox</span>
        </button>
        <button 
          onClick={() => setMobileActiveView("core")}
          className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${mobileActiveView === "core" ? "text-cyan-400" : "text-slate-500"}`}
        >
          <div className={`absolute -top-10 w-14 h-14 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)] ${mobileActiveView === "core" ? "border-cyan-500/50" : ""}`}>
             <div className={`w-8 h-8 rounded-full border border-cyan-400/30 flex items-center justify-center ${mobileActiveView === "core" ? "animate-pulse" : ""}`}>
                <div className="w-4 h-4 rounded-full bg-cyan-400/20" />
             </div>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-tighter mt-4">Core</span>
        </button>
        <button 
          onClick={() => setMobileActiveView("telemetry")}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${mobileActiveView === "telemetry" ? "text-cyan-400" : "text-slate-500"}`}
        >
          <Terminal className="h-5 w-5" />
          <span className="font-mono text-[8px] uppercase tracking-tighter">Telemetry</span>
        </button>
        <button 
          onClick={() => setMobileActiveView("core")}
          className="flex flex-col items-center gap-1 text-slate-500"
        >
          <Clock className="h-5 w-5" />
          <span className="font-mono text-[8px] uppercase tracking-tighter">Timer</span>
        </button>
      </nav>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Global Shortcut Overlay (Shift hold) */}
      <ShortcutOverlay />

      {/* Margins Footer Diagnostics status deck */}
      <footer className="px-8 py-5 border-t border-white/5 bg-[#000000]/10 text-[7px] text-slate-500 font-mono tracking-[0.3em] uppercase w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span>SECURE PROTOCOL ESTABLISHED</span>
          <span className="hidden sm:inline">|</span>
          <span>AES-256 INTELLIGENCE CODES</span>
          <span className="hidden sm:inline">|</span>
          <span>ANTIGRAVITY ROUTER GATE</span>
        </div>
        
        {/* Audio voice toggle control */}
        <div className="flex items-center gap-4">
          {voiceOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-600">VOICE SYNTH:</span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-slate-400 hover:text-cyan-400 outline-none border-none py-0.5 cursor-pointer text-[7px]"
              >
                {voiceOptions.map((v, idx) => (
                  <option key={idx} value={v.name} className="bg-[#050505] text-slate-400">
                    {v.name.replace("Google", "").replace("Microsoft", "").trim()}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="hover:text-cyan-400 transition-colors cursor-pointer text-slate-400"
          >
            SYSTEM VOICE: {isMuted ? "MUTED" : "ACTIVE"}
          </button>
        </div>
      </footer>

      {/* Full Screen Photo Overlay */}
      <AnimatePresence>
        {activePhotoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
            onClick={() => setActivePhotoUrl(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <button
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/10 text-white rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); setActivePhotoUrl(null); }}
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={activePhotoUrl} 
                alt="AI Displayed Image" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
