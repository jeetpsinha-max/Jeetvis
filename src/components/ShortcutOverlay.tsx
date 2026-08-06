import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Keyboard, Terminal, Sparkles, Command, HelpCircle } from "lucide-react";

export default function ShortcutOverlay() {
  const [isShiftHeld, setIsShiftHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        // Prevent activation if user is typing inside code IDE or input fields to avoid distraction
        const active = document.activeElement;
        const isInputField = active && (
          active.tagName === "INPUT" || 
          active.tagName === "TEXTAREA" || 
          active.hasAttribute("contenteditable") ||
          active.className.includes("cm-") || // CodeMirror classes
          active.className.includes("monaco-")
        );
        if (!isInputField) {
          setIsShiftHeld(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftHeld(false);
      }
    };

    const handleBlur = () => {
      setIsShiftHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none select-none font-mono">
      <AnimatePresence mode="wait">
        {!isShiftHeld ? (
          /* Subtle Indicator Pill */
          <motion.div
            key="pill-prompt"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 0.55, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            whileHover={{ opacity: 0.9 }}
            className="flex items-center gap-2 bg-black/80 border border-white/5 py-1.5 px-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-cyan-400 font-bold border border-white/5 shadow-[0_0_6px_rgba(34,211,238,0.2)]">
              SHIFT
            </span>
            <span className="text-[7px] text-slate-400 uppercase tracking-widest font-medium">
              HOLD TO SHOW SHORTCUTS
            </span>
          </motion.div>
        ) : (
          /* Fully Detailed Holographic Cheat Sheet Card */
          <motion.div
            key="cheat-sheet-card"
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="w-80 bg-[#060606]/95 border border-cyan-400/20 rounded-lg p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(34,211,238,0.05)] backdrop-blur-xl pointer-events-auto"
          >
            {/* Top Indicator Accent */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500/10 via-cyan-400 to-cyan-500/10" />

            {/* Header */}
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Keyboard className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                  JEETVIS // Shortkeys
                </span>
              </div>
              <span className="text-[7px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20 uppercase animate-pulse">
                ACTIVE FEED
              </span>
            </div>

            {/* Shortcut Grid Rows */}
            <div className="flex flex-col gap-2.5">
              {/* Voice Deck Toggle */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-300 font-medium">Toggle Command Deck</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400 font-bold">
                      {isMac ? "⌘" : "Ctrl"}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold px-0.5">+</span>
                    <span className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                      Space
                    </span>
                  </div>
                </div>
                <span className="text-[7px] text-slate-500 leading-normal">
                  Slides dock open/closed & focuses the text/voice prompt line instantly.
                </span>
              </div>

              {/* Voice Wake Word */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-300 font-medium">Voice Wake Word</span>
                  <span className="text-[8px] bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded text-cyan-400 font-bold tracking-wide">
                    "Hello Jeet"
                  </span>
                </div>
                <span className="text-[7px] text-slate-500 leading-normal">
                  Activate JEETVIS completely hands-free via voice command from standby.
                </span>
              </div>

              {/* Command Palette */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-300 font-medium">Command Palette</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400 font-bold">
                      {isMac ? "⌘" : "Ctrl"}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold px-0.5">+</span>
                    <span className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                      K
                    </span>
                  </div>
                </div>
                <span className="text-[7px] text-slate-500 leading-normal">
                  Search workspace logs, file explorer, tasks, and execute slash actions.
                </span>
              </div>

              {/* General Control Helpers */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Palette Navigation
                </span>
                <div className="flex items-center justify-between text-[8px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-white/5 border border-white/10 px-1 rounded font-bold text-[7px]">↑↓</span>
                    <span className="text-[7px] text-slate-500">Navigate List</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-white/5 border border-white/10 px-1 rounded font-bold text-[7px]">↵</span>
                    <span className="text-[7px] text-slate-500">Execute</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-white/5 border border-white/10 px-1 rounded font-bold text-[7px]">ESC</span>
                    <span className="text-[7px] text-slate-500">Dismiss</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer release telemetry */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[7px] text-slate-600">
              <span>RELEASE FINGERTIP TO CLOSE</span>
              <span>v1.2.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
