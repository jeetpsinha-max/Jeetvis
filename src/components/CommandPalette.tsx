import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Terminal, CheckCircle2, FileCode, Mail, Clock, ShieldAlert, 
  Sparkles, Sliders, Play, Volume2, VolumeX, Eye, AlertCircle, X, ChevronRight, CornerDownLeft, MessageSquare, Mic
} from "lucide-react";
import { useJeetvis } from "../context/JeetvisContext";
import { Task, Email, WorkspaceFile } from "../types";

export default function CommandPalette() {
  const {
    tasks,
    emails,
    files,
    terminalLogs,
    dialogLogs,
    activeFileName,
    setActiveFileName,
    runCompiler,
    runSpamScanner,
    clearTerminal,
    isMuted,
    setIsMuted,
    pomodoroActive,
    setPomodoroActive,
    setPomodoroPreset,
    setPomodoroPaused,
    setActivePanel,
    setActiveTab,
    addTerminalLog
  } = useJeetvis();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setSearchQuery(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addTerminalLog("[ERROR] Speech Recognition API is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSearchQuery("");
      recognitionRef.current.start();
      inputRef.current?.focus();
    }
  };

  // Global key listener for Ctrl+K / Cmd+K and general palette navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette open/close
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (!isOpen) return;

      // Handle closing
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, [isOpen]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      // Timeout to guarantee animation/render is complete
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Define All Static System Commands
  const systemCommands = useMemo(() => [
    {
      id: "cmd-focus-25",
      type: "command" as const,
      category: "CHRONO FOCUS",
      title: "Chrono Focus: Start 25 Min Session",
      description: "Trigger a standard 25-minute Pomodoro workspace sprint",
      shortcut: "/focus 25",
      icon: Clock,
      action: () => {
        setPomodoroPreset(25);
        setPomodoroActive(true);
        setPomodoroPaused(false);
        setActivePanel("timer");
        addTerminalLog("[COMMAND-PALETTE] Executed: Chrono Focus Phase 25m engaged, Sir.");
      }
    },
    {
      id: "cmd-focus-45",
      type: "command" as const,
      category: "CHRONO FOCUS",
      title: "Chrono Focus: Start 45 Min Session",
      description: "Trigger a long-form 45-minute tactical focus countdown",
      shortcut: "/focus 45",
      icon: Clock,
      action: () => {
        setPomodoroPreset(45);
        setPomodoroActive(true);
        setPomodoroPaused(false);
        setActivePanel("timer");
        addTerminalLog("[COMMAND-PALETTE] Executed: Chrono Focus Phase 45m engaged, Sir.");
      }
    },
    {
      id: "cmd-focus-60",
      type: "command" as const,
      category: "CHRONO FOCUS",
      title: "Chrono Focus: Start 60 Min Session",
      description: "Initiate maximum-depth 60-minute containment sprint",
      shortcut: "/focus 60",
      icon: Clock,
      action: () => {
        setPomodoroPreset(60);
        setPomodoroActive(true);
        setPomodoroPaused(false);
        setActivePanel("timer");
        addTerminalLog("[COMMAND-PALETTE] Executed: Chrono Focus Phase 60m engaged, Sir.");
      }
    },
    {
      id: "cmd-toggle-focus",
      type: "command" as const,
      category: "CHRONO FOCUS",
      title: "Chrono Focus: Pause / Resume Cycle",
      description: "Suspend or resume active countdown frequencies",
      shortcut: "/pause",
      icon: Play,
      action: () => {
        setPomodoroPaused((p) => !p);
        addTerminalLog("[COMMAND-PALETTE] Executed: Chrono timer loop modulated.");
      }
    },
    {
      id: "cmd-reset-focus",
      type: "command" as const,
      category: "CHRONO FOCUS",
      title: "Chrono Focus: Reset Focus Timer",
      description: "Reset countdown sequence parameters back to default state",
      shortcut: "/reset",
      icon: Clock,
      action: () => {
        setPomodoroActive(false);
        setPomodoroPaused(false);
        setPomodoroPreset(25);
        addTerminalLog("[COMMAND-PALETTE] Executed: Chrono focus clock reset, Sir.");
      }
    },
    {
      id: "cmd-spam",
      type: "command" as const,
      category: "TACTICAL COMMUNICATIONS",
      title: "Comms: Run Malware Scrubber",
      description: "Scan biometric email incoming feeds for spam signatures",
      shortcut: "/spam",
      icon: ShieldAlert,
      action: () => {
        runSpamScanner();
        setActivePanel("tasks_emails");
        setActiveTab("emails");
        addTerminalLog("[COMMAND-PALETTE] Executed: Scanning comm streams...");
      }
    },
    {
      id: "cmd-compile",
      type: "command" as const,
      category: "CORE SANDBOX",
      title: "Sandbox: Execute Code Compilation",
      description: "Compile and execute active workspace script buffer",
      shortcut: "/compile",
      icon: Play,
      action: () => {
        runCompiler();
        setActivePanel("ide");
        addTerminalLog(`[COMMAND-PALETTE] Executed: Sandbox launch for: ${activeFileName}.`);
      }
    },
    {
      id: "cmd-clear",
      type: "command" as const,
      category: "CONSOLE UTILITIES",
      title: "Console: Clear Diagnostics Terminal",
      description: "Flush current telemetry logging buffers cleanly",
      shortcut: "/clear",
      icon: Terminal,
      action: () => {
        clearTerminal();
      }
    },
    {
      id: "cmd-mute",
      type: "command" as const,
      category: "AUDIO SYSTEM",
      title: "Audio: Toggle Speech Voice Synthesis",
      description: "Toggle voice announcer muting (currently: " + (isMuted ? "MUTED" : "ACTIVE") + ")",
      shortcut: "/mute",
      icon: isMuted ? Volume2 : VolumeX,
      action: () => {
        setIsMuted(!isMuted);
        addTerminalLog(`[COMMAND-PALETTE] Speech synthesis muted state changed to: ${!isMuted}`);
      }
    },
    {
      id: "cmd-view-tasks",
      type: "command" as const,
      category: "NAVIGATION",
      title: "Open Module: Tactical Mission Logs",
      description: "Reveal core operational tasks and milestone telemetries",
      shortcut: "/view-tasks",
      icon: Eye,
      action: () => {
        setActivePanel("tasks_emails");
        setActiveTab("tasks");
        addTerminalLog("[COMMAND-PALETTE] Navigating to Tactical Mission Logs.");
      }
    },
    {
      id: "cmd-view-emails",
      type: "command" as const,
      category: "NAVIGATION",
      title: "Open Module: Incoming Comm Transmissions",
      description: "Reveal secure mail gateways and incoming threads",
      shortcut: "/view-emails",
      icon: Mail,
      action: () => {
        setActivePanel("tasks_emails");
        setActiveTab("emails");
        addTerminalLog("[COMMAND-PALETTE] Navigating to Incoming Comms.");
      }
    },
    {
      id: "cmd-view-sandbox",
      type: "command" as const,
      category: "NAVIGATION",
      title: "Open Module: Sandbox Editor (IDE)",
      description: "Display code buffers, workspace files, and compilers",
      shortcut: "/view-sandbox",
      icon: FileCode,
      action: () => {
        setActivePanel("ide");
        addTerminalLog("[COMMAND-PALETTE] Navigating to Sandbox Editor.");
      }
    },
    {
      id: "cmd-view-chrono",
      type: "command" as const,
      category: "NAVIGATION",
      title: "Open Module: Cognitive Code Chatbot",
      description: "Display Neural Code Chatbot with model & persona parameters",
      shortcut: "/view-chatbot",
      icon: MessageSquare,
      action: () => {
        setActivePanel("timer");
        addTerminalLog("[COMMAND-PALETTE] Navigating to Neural Code Chatbot.");
      }
    },
    {
      id: "cmd-close-all",
      type: "command" as const,
      category: "NAVIGATION",
      title: "Close Workspace: Hide All Panels",
      description: "Collapse active control panels to minimize visual HUD clutter",
      shortcut: "/close",
      icon: X,
      action: () => {
        setActivePanel("none");
        addTerminalLog("[COMMAND-PALETTE] Collapsed all active modules.");
      }
    }
  ], [isMuted, activeFileName, runCompiler, runSpamScanner, clearTerminal, setIsMuted, setPomodoroPreset, setPomodoroActive, setPomodoroPaused, setActivePanel, setActiveTab, addTerminalLog]);

  // Combine static commands and dynamic records into searchable elements
  const allSearchableItems = useMemo(() => {
    const items: any[] = [];

    // 1. Add static system commands
    items.push(...systemCommands);

    // 2. Add files
    files.forEach((file) => {
      items.push({
        id: `file-${file.name}`,
        type: "file" as const,
        category: "WORKSPACE FILES",
        title: `Open File: ${file.name}`,
        description: `Source file inside workspace written in ${file.language} (path: ${file.path})`,
        meta: file.language + " " + file.path,
        icon: FileCode,
        action: () => {
          setActiveFileName(file.name);
          setActivePanel("ide");
          addTerminalLog(`[COMMAND-PALETTE] Loaded active file: ${file.name}`);
        }
      });
    });

    // 3. Add active tasks
    tasks.forEach((task) => {
      items.push({
        id: `task-${task.id}`,
        type: "task" as const,
        category: "TACTICAL TASKS",
        title: `Task: ${task.title}`,
        description: `Project: ${task.project} | Progress: ${task.progress}% | ${task.steps.length} milestones`,
        meta: task.project + " " + task.steps.map(s => s.title).join(" "),
        icon: CheckCircle2,
        action: () => {
          setActivePanel("tasks_emails");
          setActiveTab("tasks");
          addTerminalLog(`[COMMAND-PALETTE] Focused task: "${task.title}"`);
        }
      });
    });

    // 4. Add incoming communications (emails)
    emails.forEach((email) => {
      items.push({
        id: `email-${email.id}`,
        type: "email" as const,
        category: "SECURE COMMS",
        title: `Comm: from ${email.senderName}`,
        description: `Subject: ${email.subject} | "${email.body.slice(0, 50)}..."`,
        meta: email.sender + " " + email.subject + " " + email.body,
        icon: Mail,
        action: () => {
          setActivePanel("tasks_emails");
          setActiveTab("emails");
          // Mark as active email implicitly by opening (the panel will find it or first email)
          addTerminalLog(`[COMMAND-PALETTE] Focused comm dispatch thread: "${email.subject}"`);
        }
      });
    });

    // 5. Add dialogue interactions log
    dialogLogs.forEach((log, idx) => {
      items.push({
        id: `dialog-log-${idx}`,
        type: "log" as const,
        category: "DIALOGUE TELEMETRY",
        title: `Query: "${log.query}"`,
        description: `Response: "${log.response.slice(0, 65)}..."`,
        meta: log.query + " " + log.response,
        icon: Sparkles,
        action: () => {
          // Simply log to terminal for visibility
          addTerminalLog(`[COMMAND-PALETTE] Inspected Dialog Log: [User]: "${log.query}" | [JEETVIS]: "${log.response}"`);
        }
      });
    });

    // 6. Add terminal diagnostics logs
    terminalLogs.slice().reverse().forEach((log, idx) => {
      // Clean prefix out of log for aesthetic reasons
      const isSystemLog = log.startsWith("[SYSTEM]");
      items.push({
        id: `terminal-log-${idx}`,
        type: "log" as const,
        category: "TERMINAL DIAGNOSTICS",
        title: log,
        description: `Terminal diagnostic footprint compiled at local runtime clock`,
        meta: log,
        icon: Terminal,
        action: () => {
          addTerminalLog(`[COMMAND-PALETTE] Diagnostic trace selected: "${log}"`);
        }
      });
    });

    return items;
  }, [systemCommands, files, tasks, emails, dialogLogs, terminalLogs, setActiveFileName, setActivePanel, setActiveTab, addTerminalLog]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      // When empty, display navigation & focus commands as quick actions
      return allSearchableItems.filter(item => 
        item.type === "command" && (item.category === "NAVIGATION" || item.category === "CHRONO FOCUS" || item.id === "cmd-compile" || item.id === "cmd-spam")
      ).slice(0, 7);
    }

    const query = searchQuery.toLowerCase();
    
    return allSearchableItems.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(query);
      const matchDesc = item.description?.toLowerCase().includes(query);
      const matchMeta = item.meta?.toLowerCase().includes(query);
      const matchShortcut = item.shortcut?.toLowerCase().includes(query);
      const matchCategory = item.category?.toLowerCase().includes(query);

      return matchTitle || matchDesc || matchMeta || matchShortcut || matchCategory;
    }).slice(0, 15); // Limit output to keep palette incredibly responsive
  }, [allSearchableItems, searchQuery]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Navigate selected item inside input key listeners
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeItem(filteredItems[selectedIndex]);
    }
  };

  const executeItem = (item: any) => {
    if (!item) return;
    item.action();
    setIsOpen(false);
  };

  // Render match word with highlighting
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span className="text-slate-200">{text}</span>;
    
    const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
    
    return (
      <span className="text-slate-300">
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-cyan-400 bg-cyan-400/10 font-medium px-0.5 rounded">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <>
      {/* Floating Trigger HUD Button to notify the user and trigger by clicking */}
      <div className="fixed top-24 right-8 z-40 hidden lg:flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#000000]/90 border border-white/5 py-2 px-3.5 rounded-full font-mono text-[9px] uppercase tracking-widest text-slate-400 hover:text-cyan-400 hover:border-cyan-400/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
        >
          <Search className="h-3 w-3 text-cyan-400" />
          <span>COMMANDS</span>
          <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-bold border border-white/5">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Backdrop Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-start justify-center pt-[12vh] px-4"
          >
            {/* Modal Body Card */}
            <motion.div
              ref={containerRef}
              initial={{ y: -20, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -15, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#080808] border border-white/10 rounded-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col max-h-[70vh]"
            >
              
              {/* Dynamic Cyan Laser Top Glow */}
              <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-600" />

              {/* Command Search HUD Header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3 relative">
                <Search className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search workspace logs, tasks, files or type commands (/)..."
                  className="w-full bg-transparent border-none outline-none text-slate-100 font-mono text-xs placeholder-slate-600"
                />
                
                <button
                  onClick={toggleListening}
                  className={`p-1.5 rounded-full transition-colors ${
                    isListening ? "bg-red-500/20 text-red-400" : "hover:bg-white/5 text-slate-500 hover:text-cyan-400"
                  }`}
                  title={isListening ? "Stop listening" : "Voice command"}
                >
                  <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
                </button>

                <div className="flex items-center gap-1.5 font-mono text-[8px] text-slate-500">
                  <span className="border border-white/5 bg-[#000000] px-1.5 py-0.5 rounded uppercase font-semibold">ESC</span>
                  <span>to close</span>
                </div>
              </div>

              {/* Scrollable Search Results Stream */}
              <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1 select-none">
                {filteredItems.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                    <AlertCircle className="h-6 w-6 text-slate-700 animate-pulse" />
                    <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">No Telemetry Matches Found</p>
                    <p className="font-mono text-[8px] text-slate-700 leading-relaxed max-w-xs">Verify your search terms, Sir. Use characters or search commands directly.</p>
                  </div>
                ) : (
                  // Group items by category for premium visual layout
                  Object.entries(
                    filteredItems.reduce((acc: any, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {})
                  ).map(([category, items]: any, catIdx) => (
                    <div key={category} className="flex flex-col mb-2 last:mb-0">
                      {/* Section Heading */}
                      <span className="font-mono text-[7px] text-slate-500 font-bold tracking-[0.25em] uppercase px-3.5 py-1.5 block">
                        {category}
                      </span>

                      {/* Section Rows */}
                      <div className="flex flex-col gap-0.5">
                        {items.map((item: any) => {
                          const itemIndex = filteredItems.findIndex(f => f.id === item.id);
                          const isSelected = itemIndex === selectedIndex;
                          const Icon = item.icon || Search;

                          return (
                            <div
                              key={item.id}
                              onClick={() => executeItem(item)}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`px-3.5 py-2.5 rounded-md flex items-center justify-between gap-4 cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ? "bg-cyan-500/5 border border-cyan-400/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.05)]"
                                  : "border border-transparent hover:border-white/5 text-slate-400"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-cyan-400" : "text-slate-600"}`} />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-mono text-[11px] font-medium leading-none">
                                    {renderHighlightedText(item.title, searchQuery)}
                                  </span>
                                  <span className="font-mono text-[8px] text-slate-500 tracking-wide mt-1 truncate">
                                    {renderHighlightedText(item.description, searchQuery)}
                                  </span>
                                </div>
                              </div>

                              {/* Indicators & Shortcuts */}
                              <div className="flex items-center gap-2 font-mono text-[8px] shrink-0">
                                {item.shortcut && (
                                  <span className={`px-1.5 py-0.5 rounded border ${
                                    isSelected 
                                      ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400" 
                                      : "bg-[#000000] border-white/5 text-slate-600"
                                  }`}>
                                    {item.shortcut}
                                  </span>
                                )}
                                
                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -3 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1.5 text-cyan-400"
                                  >
                                    <CornerDownLeft className="h-3 w-3" />
                                    <span>ENTER</span>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Command Palette HUD Footer */}
              <div className="p-3 border-t border-white/5 bg-[#030303] px-4 flex items-center justify-between font-mono text-[8px] text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-500">↑↓</span> Arrow keys to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-500">↵</span> Enter to execute
                  </span>
                </div>
                <span>DIAGNOSTIC MATRIX READY</span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
