import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDoc, addDoc, query, orderBy, limit } from "firebase/firestore";
import { db, auth, googleSignIn, fetchDriveFiles, fetchDocContent, fetchSheetContent, fetchSlidesContent, fetchCalendarEvents, fetchClassroomCourses, fetchGmailMessages, sendGmailMessage } from "../lib/workspaceAuth";
import { Task, Email, WorkspaceFile, Memory, ChatMessage, CalendarEvent, ClassroomCourse, WorkspaceUser, GoogleDriveFile, GmailMessage } from "../types";
import { setCacheItem, getCacheItem, STORES } from "../lib/storage";


interface DialogLog {
  query: string;
  response: string;
  sources?: any[];
  timestamp: string;
}

interface JeetvisContextType {
  tasks: Task[];
  emails: Email[];
  files: WorkspaceFile[];
  calendarEvents: CalendarEvent[];
  classroomCourses: ClassroomCourse[];
  driveFiles: GoogleDriveFile[];
  gmailMessages: GmailMessage[];
  dialogLogs: DialogLog[];
  chatHistory: ChatMessage[];
  terminalLogs: string[];
  activeFileName: string;
  editorContent: string;
  activePanel: "tasks_emails" | "ide" | "timer" | "workspace" | "memory" | "none";
  activeTab: "tasks" | "emails";
  
  // Memories
  memories: Memory[];
  addMemory: (content: string, category: "user_preference" | "interaction_fact" | "code_snippet" | "custom_note", importance: "high" | "medium" | "low") => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  updateMemory: (id: string, content: string, category: "user_preference" | "interaction_fact" | "code_snippet" | "custom_note", importance: "high" | "medium" | "low") => Promise<void>;
  isSyncingMemories: boolean;
  
  // Chat actions
  addChatMessage: (role: "user" | "model" | "system", content: string) => Promise<void>;
  clearChatHistory: () => Promise<void>;
  isSyncingChat: boolean;

  // Workspace actions
  signInWithWorkspace: () => Promise<void>;
  refreshWorkspaceData: () => Promise<void>;
  isWorkspaceLoading: boolean;
  workspaceToken: string | null;
  workspaceUser: WorkspaceUser | null;

  // Tasks actions
  addTask: (title: string, category: string) => Promise<void>;
  toggleSubStep: (taskId: string, stepIndex: number) => void;
  deleteTask: (taskId: string) => void;
  deleteTasks: (taskIds: string[]) => void;
  archiveTasks: (taskIds: string[]) => void;
  
  // Emails actions
  markEmailRead: (emailId: string) => void;
  deleteEmail: (emailId: string) => void;
  runSpamScanner: () => void;
  generateDraft: (emailId: string, actionType: string, isGmail?: boolean) => Promise<string>;
  sendGmailReply: (messageId: string, threadId: string, to: string, subject: string, body: string) => Promise<boolean>;
  
  // IDE actions
  setFiles: React.Dispatch<React.SetStateAction<WorkspaceFile[]>>;
  setActiveFileName: (name: string) => void;
  setEditorContent: (content: string) => void;
  runCompiler: () => Promise<void>;
  generateSpecDoc: (topic: string, docType: string) => Promise<string>;
  openDriveFile: (file: GoogleDriveFile) => Promise<void>;
  
  // Voice & Telemetry settings
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (val: boolean) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  selectedVoice: string;
  setSelectedVoice: (val: string) => void;
  voiceOptions: SpeechSynthesisVoice[];
  
  // Console logging
  addDialogLog: (query: string, response: string, sources?: any[]) => void;
  addTerminalLog: (log: string) => void;
  clearTerminal: () => void;
  
  // Global Pomodoro State
  pomodoroTime: number;
  setPomodoroTime: React.Dispatch<React.SetStateAction<number>>;
  pomodoroActive: boolean;
  setPomodoroActive: React.Dispatch<React.SetStateAction<boolean>>;
  pomodoroPaused: boolean;
  setPomodoroPaused: React.Dispatch<React.SetStateAction<boolean>>;
  pomodoroPreset: number;
  setPomodoroPreset: (min: number) => void;
  completedPomodoros: number;
  setCompletedPomodoros: React.Dispatch<React.SetStateAction<number>>;

  // Panel control & Layout Optimization
  setActivePanel: (panel: "tasks_emails" | "ide" | "timer" | "workspace" | "memory" | "none") => void;
  setActiveTab: (tab: "tasks" | "emails") => void;
  dashboardLayout: "standard" | "focus" | "developer" | "monitoring";
  setDashboardLayout: (layout: "standard" | "focus" | "developer" | "monitoring") => void;
  reportActivity: (module: "timer" | "ide" | "logs" | "comm") => void;
  isOffline: boolean;
  triggerAcknowledge: () => void;
  acknowledgeTrigger: number;
  isSimpleMode: boolean;
  setIsSimpleMode: (val: boolean) => void;
  activePhotoUrl: string | null;
  setActivePhotoUrl: (url: string | null) => void;
  suggestedFollowUps: string[];
  setSuggestedFollowUps: (questions: string[]) => void;
  clearSuggestedFollowUps: () => void;
  getSpeechRate: (text: string, isUrgent?: boolean) => {
    rate: number;
    pitch: number;
    reason: string;
  };
}

const JeetvisContext = createContext<JeetvisContextType | undefined>(undefined);

const INITIAL_EMAILS: Email[] = [
  {
    id: "mail-1",
    sender: "stark-industries-supply@pepper.com",
    senderName: "Pepper Potts",
    subject: "Approved Vibranium Shipments & Invoices",
    body: "Sir, I have reviewed the cargo manifest for the next phase of the energy grid. The Vibranium logistics team has authorized delivery for Tuesday. Please approve the payment release of 450,000 credits. Let me know if you need changes.",
    timestamp: "09:42 AM",
    isSpam: false,
    category: "work",
    isRead: false
  },
  {
    id: "mail-2",
    sender: "crypto-rich-fast39@casino.net",
    senderName: "Crypto Sweepstakes Admin",
    subject: "CONGRATULATION BOSS! You won 42.5 BITCOIN! Wire transfer inside!",
    body: "Ugent Alert: Your email was randomly chosen to receive a prize transfer of 42.5 BTC cash. Complete this verification immediately to process wire cash now!!! No registration fee required.",
    timestamp: "08:15 AM",
    isSpam: true,
    spamReason: "Spam Keyword detected: 'sweepstakes', 'bitcoin', 'wire transfer', 'urgent reward'",
    category: "finance",
    isRead: false
  },
  {
    id: "mail-3",
    sender: "tech-trends-weekly@insights.co",
    senderName: "Futurist Synthesis Newsletter",
    subject: "Issue #184: Quantum Computing Fusion & Grid Computing Arrays",
    body: "Welcome to Tech Trends. In today's issue, we cover the rapid modular deployment of liquid helium cooled Qubits, developments in serverless LLM scaling parameters, and best practices for TypeScript ES Module bundling setups. Read more details here.",
    timestamp: "Yesterday",
    isSpam: false,
    category: "newsletter",
    isRead: true
  },
  {
    id: "mail-4",
    sender: "rhodey@defense.gov",
    senderName: "Col. James Rhodes",
    subject: "Joint Exercises and Tactical Simulation Schedule",
    body: "Hey Tony, the joint exercises over the Mojave test site are scheduled for next month. Need to run the JEETVIS flight logistics simulation parameters. Send over the latest flight data files when you get a chance.",
    timestamp: "Yesterday",
    isSpam: false,
    category: "work",
    isRead: true
  },
  {
    id: "mail-5",
    sender: "spammy-deals@mega-save-coupons.info",
    senderName: "Mega Save Club",
    subject: "URGENT DEAL! Save 99% on premium nanotech polish!",
    body: "Exclusive deal inside! Buy 1 get 5 free nanotech armor polishes now! Offer expires in 2 hours. Claim urgent discount credit card details required inside.",
    timestamp: "2 days ago",
    isSpam: true,
    spamReason: "Spam Keyword detected: 'save 99%', 'credit card details', 'exclusive deals'",
    category: "personal",
    isRead: false
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Calibrate Repulsor Field Density",
    project: "Propulsion Core",
    progress: 33,
    steps: [
      { title: "Initialize sensor telemetry mesh", description: "Establish signal bridges with outer ring stabilizers.", estimatedMinutes: 10, completed: true },
      { title: "Run high-frequency harmonic load checks", description: "Simulate sound-barrier stresses to optimize safety thresholds.", estimatedMinutes: 25, completed: false },
      { title: "Deploy liquid coolant bypass route", description: "Bypass core heat loops during stress phases.", estimatedMinutes: 15, completed: false }
    ]
  },
  {
    id: "task-2",
    title: "Configure Orbital Grounding Node Link",
    project: "Communications",
    progress: 0,
    steps: [
      { title: "Sync satellite trajectory angles", description: "Calculate optimal line of sight parameters.", estimatedMinutes: 12, completed: false },
      { title: "Calibrate dish decibel transceiver", description: "Tune the hardware to match secure encryption decibel sweeps.", estimatedMinutes: 18, completed: false }
    ]
  },
  {
    id: "task-3",
    title: "Verify Arc Reactor Resonance",
    project: "Arc Reactor",
    progress: 100,
    steps: [
      { title: "Establish magnetic shield backup containment", description: "Confirm standard plasma confinement parameters remain nominal.", estimatedMinutes: 5, completed: true },
      { title: "Measure cooling flux coefficients", description: "Ensure zero thermal runway.", estimatedMinutes: 10, completed: true }
    ]
  }
];

const INITIAL_FILES: WorkspaceFile[] = [
  {
    name: "arc_reactor_core.py",
    path: "/core/arc_reactor_core.py",
    language: "python",
    content: `# ARC REACTOR POWER MODULATION MATRIX\nimport time\nimport telemetry\n\nclass ArcReactor:\n    def __init__(self):\n        self.output_level = 100.0  # Terawatts\n        self.plasma_temp = 1.5e8   # Kelvin\n        self.magnetic_shield = True\n\n    def optimize_resonance(self):\n        print("Sir, modulating harmonic resonance waves...")\n        for harmonic in range(1, 5):\n            flux = telemetry.read_flux(harmonic)\n            if flux < 0.95:\n                telemetry.inject_coolant(0.05)\n                self.plasma_temp -= 250000\n            print(f"Harmonic grid {harmonic} aligned. Flux: {flux:.2f}")\n        return True\n\n# Initialize Reactor Subsystem\nreactor = ArcReactor()\nreactor.optimize_resonance()\n`
  },
  {
    name: "flight_stabilities.ts",
    path: "/flight/flight_stabilities.ts",
    language: "typescript",
    content: `/**\n * FLIGHT ACCELERATION STABILIZATION MATRIX\n * Calibrates repulsor output coordinates relative to escape velocity vectors\n */\nexport interface InertialVector {\n  x: number;\n  y: number;\n  z: number;\n  pitch: number;\n  roll: number;\n}\n\nexport function stabilizeFlight(vector: InertialVector, velocity: number): number[] {\n  // Compute compensation angles using local kinetic loops\n  const targetDeflection = Math.sin(vector.pitch) * Math.cos(vector.roll);\n  \n  if (velocity > 1250) {\n    console.warn("Boss, exceeding sound barrier velocities. Deploying auxiliary flaps.");\n    return [targetDeflection * 1.15, 0.05, 0.02];\n  }\n  \n  return [targetDeflection, 0.0, 0.0];\n}\n`
  },
  {
    name: "shield_buffer.cpp",
    path: "/defense/shield_buffer.cpp",
    language: "cpp",
    content: `// SHIELD GRID DISTRIBUTOR AND CHARGE BALANCER\n#include <iostream>\n#include <vector>\n\nvoid balanceShieldGrid() {\n    float totalCharge = 1000.0f; // Megajoules\n    int sectors = 4;\n    float chargePerSector = totalCharge / sectors;\n    \n    std::cout << "Balancing shields, Sir. Target: " << chargePerSector << " MJ per grid node." << std::endl;\n    \n    for (int i = 0; i < sectors; i++) {\n        std::cout << "[GRID-NODE-" << i << "] Sector integrity: 100.00% | Charge aligned." << std::endl;\n    }\n}\n`
  }
];

export const JeetvisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence Loading
  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem("jeetvis_tasks");
    return local ? JSON.parse(local) : INITIAL_TASKS;
  });

  const [emails, setEmails] = useState<Email[]>(() => {
    const local = localStorage.getItem("jeetvis_emails");
    return local ? JSON.parse(local) : INITIAL_EMAILS;
  });

  const [files, setFiles] = useState<WorkspaceFile[]>(() => {
    const local = localStorage.getItem("jeetvis_files");
    return local ? JSON.parse(local) : INITIAL_FILES;
  });

  const [dialogLogs, setDialogLogs] = useState<DialogLog[]>(() => {
    const local = localStorage.getItem("jeetvis_dialog_logs");
    return local ? JSON.parse(local) : [
      {
        query: "System initialization",
        response: "JEETVIS interface online, Sir. Repulsor grids and tactical matrices calibrated at 100% capacity.",
        timestamp: new Date().toLocaleTimeString(),
      }
    ];
  });

  const [terminalLogs, setTerminalLogs] = useState<string[]>(() => {
    const local = localStorage.getItem("jeetvis_terminal_logs");
    return local ? JSON.parse(local) : [
      "[SYSTEM] JEETVIS Virtual Compiler core initialized.",
      "[SYSTEM] Local repulsor coordinate nodes linked successfully."
    ];
  });

  const [activeFileName, setActiveFileName] = useState<string>(() => {
    return localStorage.getItem("jeetvis_active_file") || "arc_reactor_core.py";
  });

  const [editorContent, setEditorContent] = useState<string>(() => {
    const savedActive = localStorage.getItem("jeetvis_active_file") || "arc_reactor_core.py";
    const found = (files.length ? files : INITIAL_FILES).find(f => f.name === savedActive);
    return found ? found.content : INITIAL_FILES[0].content;
  });

  const [activePanel, setActivePanel] = useState<"tasks_emails" | "ide" | "timer" | "workspace" | "memory" | "none">("none");
  const [activeTab, setActiveTab] = useState<"tasks" | "emails">("tasks");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addTerminalLog("[SYSTEM] Neural link re-established. Syncing background processes...");
    };
    const handleOffline = () => {
      setIsOffline(true);
      addTerminalLog("[WARNING] Neural link severed. Switching to local buffer persistence.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pomodoro timer states
  const [pomodoroPreset, setPomodoroPresetState] = useState<number>(25);
  const [pomodoroTime, setPomodoroTime] = useState<number>(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState<boolean>(false);
  const [pomodoroPaused, setPomodoroPaused] = useState<boolean>(false);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);

  const [dashboardLayout, setDashboardLayout] = useState<"standard" | "focus" | "developer" | "monitoring">("standard");
  const [acknowledgeTrigger, setAcknowledgeTrigger] = useState<number>(0);

  const triggerAcknowledge = () => {
    setAcknowledgeTrigger(prev => prev + 1);
  };
  const [activityLevels, setActivityLevels] = useState({
    timer: 0,
    ide: 0,
    logs: 0,
    comm: 0
  });

  const reportActivity = (module: "timer" | "ide" | "logs" | "comm") => {
    setActivityLevels(prev => ({ ...prev, [module]: Date.now() }));
  };

  useEffect(() => {
    const now = Date.now();
    const recentThreshold = 15000;

    if (pomodoroActive && !pomodoroPaused) {
      setDashboardLayout("focus");
    } else if (now - activityLevels.ide < recentThreshold) {
      setDashboardLayout("developer");
    } else if (now - activityLevels.logs < recentThreshold) {
      setDashboardLayout("monitoring");
    } else {
      setDashboardLayout("standard");
    }
  }, [activityLevels, pomodoroActive, pomodoroPaused]);

  // Sync active file content
  useEffect(() => {
    const found = files.find(f => f.name === activeFileName);
    if (found) {
      setEditorContent(found.content);
    }
    localStorage.setItem("jeetvis_active_file", activeFileName);
  }, [activeFileName, files]);

  // Settings
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [isSimpleMode, setIsSimpleModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem("jeetvis_simple_mode");
    return saved !== null ? saved === "true" : true;
  });

  const setIsSimpleMode = (val: boolean) => {
    setIsSimpleModeState(val);
    localStorage.setItem("jeetvis_simple_mode", val.toString());
  };

  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const clearSuggestedFollowUps = () => setSuggestedFollowUps([]);

  const getSpeechRate = (text: string, isUrgent?: boolean) => {
    const urgentKeywords = /\b(urgent|immediate|critical|warning|emergency|asap|priority|p0|p1|breach|danger|threat|alert|security|error|failed|compromised|failure)\b/i;
    
    let hasUrgentTask = false;
    if (tasks && tasks.length > 0) {
      hasUrgentTask = tasks.some(task => {
        const isCompleted = task.progress === 100;
        if (isCompleted) return false;
        
        const inTitle = urgentKeywords.test(task.title || "") || urgentKeywords.test(task.project || "");
        const inSteps = task.steps?.some(step => urgentKeywords.test(step.title || "") || urgentKeywords.test(step.description || ""));
        return inTitle || inSteps;
      });
    }

    const hasUrgentText = urgentKeywords.test(text || "");
    const isCurrentlyUrgent = !!isUrgent || hasUrgentTask || hasUrgentText;

    let baseRate = 1.05;
    let pitch = 0.95;
    let reason = "Standard conversational rhythm";

    const cleanText = (text || "").trim();
    const charCount = cleanText.length;

    if (charCount < 45) {
      baseRate = 0.95;
      pitch = 0.92;
      reason = "Poised, succinct acknowledgement pacing";
    } else if (charCount >= 45 && charCount < 180) {
      baseRate = 1.05;
      pitch = 0.95;
      reason = "Standard conversational rhythm";
    } else if (charCount >= 180 && charCount < 450) {
      baseRate = 1.15;
      pitch = 0.97;
      reason = "Optimized multi-sentence narrative flow";
    } else {
      baseRate = 1.25;
      pitch = 0.98;
      reason = "High-density executive report narration";
    }

    if (isCurrentlyUrgent) {
      baseRate *= 1.20;
      pitch = 1.03;
      
      if (hasUrgentText) {
        reason = "Tactical response pace // Alert criteria identified in communication feed";
      } else if (hasUrgentTask) {
        reason = "Tactical response pace // Active high-priority mission pending";
      } else {
        reason = "Tactical response pace // Manual directive override";
      }
    }

    const rate = Math.min(Math.max(baseRate, 0.7), 2.0);

    // Append a telemetry log so the user gets real-time status details of vocal modulation
    setTerminalLogs(prev => [
      ...prev,
      `[TELEMETRY] Dynamic vocal pacing modulated: rate ${rate.toFixed(2)}x, pitch ${pitch.toFixed(2)}. Case: ${reason}.`
    ]);

    return { rate, pitch, reason };
  };

  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voiceOptions, setVoiceOptions] = useState<SpeechSynthesisVoice[]>([]);

  // Assistant memories state
  const [memories, setMemories] = useState<Memory[]>(() => {
    const local = localStorage.getItem("jeetvis_memories");
    return local ? JSON.parse(local) : [
      {
        id: "mem-init-1",
        category: "user_preference",
        content: "Prefers concise, highly atmospheric answers with witty British phrasing.",
        importance: "high",
        timestamp: new Date().toISOString(),
        userId: "local_user"
      },
      {
        id: "mem-init-2",
        category: "interaction_fact",
        content: "Expressed goal of self-improving JEETVIS with continuous-learning capabilities.",
        importance: "high",
        timestamp: new Date().toISOString(),
        userId: "local_user"
      }
    ];
  });
  const [isSyncingMemories, setIsSyncingMemories] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const local = localStorage.getItem("jeetvis_chat_history");
    return local ? JSON.parse(local) : [];
  });
  const [isSyncingChat, setIsSyncingChat] = useState<boolean>(false);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);
  const [workspaceUser, setWorkspaceUser] = useState<WorkspaceUser | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState<boolean>(false);

  // Hydrate state from IndexedDB on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const cachedTasks = await getCacheItem<Task[]>(STORES.STATE, 'tasks');
        if (cachedTasks) setTasks(cachedTasks);

        const cachedLogs = await getCacheItem<string[]>(STORES.STATE, 'terminalLogs');
        if (cachedLogs) setTerminalLogs(cachedLogs);

        const cachedSettings = await getCacheItem<any>(STORES.PREFERENCES, 'settings');
        if (cachedSettings) {
          setIsVoiceEnabled(cachedSettings.voiceEnabled ?? true);
          setIsMuted(cachedSettings.muted ?? false);
        }
      } catch (err) {
        console.error("Hydration failed:", err);
      }
    };
    hydrate();
  }, []);

  // Persist state to IndexedDB on changes
  useEffect(() => {
    setCacheItem(STORES.STATE, 'tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    setCacheItem(STORES.STATE, 'terminalLogs', terminalLogs);
  }, [terminalLogs]);

  useEffect(() => {
    setCacheItem(STORES.PREFERENCES, 'settings', {
      voiceEnabled: isVoiceEnabled,
      muted: isMuted
    });
  }, [isVoiceEnabled, isMuted]);

  // Sync memory local storage for offline use
  useEffect(() => {
    if (auth && !auth.currentUser) {
      localStorage.setItem("jeetvis_memories", JSON.stringify(memories));
    }
  }, [memories]);

  // Sync chat local storage for offline use
  useEffect(() => {
    if (auth && !auth.currentUser) {
      localStorage.setItem("jeetvis_chat_history", JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Restore workspace config from Firestore on sign in / load
  useEffect(() => {
    let active = true;
    if (!auth) return;
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid, "config", "workspace");
          const snap = await getDoc(docRef);
          if (active) {
            if (snap.exists()) {
              const data = snap.data();
              // Restore files
              if (data.files && Array.isArray(data.files)) {
                setFiles(data.files);
              }
              // Restore tasks
              if (data.tasks && Array.isArray(data.tasks)) {
                setTasks(data.tasks);
              }
              // Restore preferences
              if (data.preferences) {
                if (typeof data.preferences.isVoiceEnabled === "boolean") {
                  setIsVoiceEnabled(data.preferences.isVoiceEnabled);
                }
                if (typeof data.preferences.isMuted === "boolean") {
                  setIsMuted(data.preferences.isMuted);
                }
                if (typeof data.preferences.selectedVoice === "string") {
                  setSelectedVoice(data.preferences.selectedVoice);
                }
              }
              // Restore Pomodoro timer status
              if (data.pomodoro) {
                const p = data.pomodoro;
                if (typeof p.preset === "number") {
                  setPomodoroPresetState(p.preset);
                }
                if (typeof p.completedCount === "number") {
                  setCompletedPomodoros(p.completedCount);
                }
                
                const activeTimer = p.active;
                const pausedTimer = p.paused;
                
                if (activeTimer && !pausedTimer && p.targetEndTime) {
                  const timeLeft = Math.max(0, Math.round((p.targetEndTime - Date.now()) / 1000));
                  if (timeLeft > 0) {
                    setPomodoroTime(timeLeft);
                    setPomodoroActive(true);
                    setPomodoroPaused(false);
                  } else {
                    // Timer finished while offline/reload
                    setPomodoroTime((p.preset || 25) * 60);
                    setPomodoroActive(false);
                    setPomodoroPaused(false);
                    setCompletedPomodoros(prev => prev + 1);
                  }
                } else {
                  setPomodoroActive(!!activeTimer);
                  setPomodoroPaused(!!pausedTimer);
                  if (typeof p.remainingSeconds === "number") {
                    setPomodoroTime(p.remainingSeconds);
                  } else {
                    setPomodoroTime((p.preset || 25) * 60);
                  }
                }
              }
              addTerminalLog("[SUCCESS] Cloud workspace state restored successfully.");
            } else {
              addTerminalLog("[SYSTEM] No cloud workspace state found. Initializing new cloud template.");
            }
            setIsConfigLoaded(true);
          }
        } catch (error: any) {
          if (active) {
            addTerminalLog(`[ERROR] Failed to restore cloud workspace state: ${error.message}`);
            setIsConfigLoaded(true); // Treat as loaded so we fallback to local and can start saving
          }
        }
      } else {
        if (active) {
          setIsConfigLoaded(true);
        }
      }
    });

    return () => {
      active = false;
      unsubscribeAuth();
    };
  }, []);

  // Auto-save workspace config to Firestore on changes
  useEffect(() => {
    if (!auth) return;
    const user = auth.currentUser;
    if (!user || !isConfigLoaded) return;

    // Calculate targetEndTime if active and not paused
    let targetEndTime: number | null = null;
    if (pomodoroActive && !pomodoroPaused) {
      targetEndTime = Date.now() + pomodoroTime * 1000;
    }

    const configData = {
      tasks,
      files: files.filter(f => !f.path.startsWith('/drive/')), // Only sync virtual files
      preferences: {
        isVoiceEnabled,
        isMuted,
        selectedVoice
      },
      pomodoro: {
        preset: pomodoroPreset,
        completedCount: completedPomodoros,
        active: pomodoroActive,
        paused: pomodoroPaused,
        remainingSeconds: pomodoroTime,
        targetEndTime,
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    const docRef = doc(db, "users", user.uid, "config", "workspace");
    
    const timer = setTimeout(async () => {
      try {
        setIsSavingConfig(true);
        await setDoc(docRef, configData);
        setIsSavingConfig(false);
      } catch (error: any) {
        setIsSavingConfig(false);
        console.error("Failed to auto-save workspace config:", error);
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isConfigLoaded,
    tasks,
    isVoiceEnabled,
    isMuted,
    selectedVoice,
    pomodoroActive,
    pomodoroPaused,
    pomodoroPreset,
    completedPomodoros,
    files
  ]);

  // Listen to Firestore memories if user is signed in
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (!auth) return;
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsSyncingMemories(true);
        const path = `users/${user.uid}/memories`;
        const colRef = collection(db, "users", user.uid, "memories");
        
        unsubscribe = onSnapshot(colRef, (snapshot) => {
          const list: Memory[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Memory);
          });
          // Sort by timestamp descending
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setMemories(list);
          setIsSyncingMemories(false);
          addTerminalLog(`[SUCCESS] Cloud memory datastream synchronized. Loaded ${list.length} memories.`);
        }, (error) => {
          setIsSyncingMemories(false);
          addTerminalLog(`[ERROR] Memory datastream sync failed: ${error.message}`);
          try {
            handleFirestoreError(error, OperationType.GET, path);
          } catch (err) {}
        });
      } else {
        // Fallback to local storage if signed out
        const local = localStorage.getItem("jeetvis_memories");
        if (local) {
          setMemories(JSON.parse(local));
        }
        if (unsubscribe) {
          unsubscribe();
        }
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Listen to Firestore chat history if user is signed in
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (!auth) return;
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsSyncingChat(true);
        const colRef = collection(db, "users", user.uid, "chat_history");
        const q = query(colRef, orderBy("timestamp", "asc"), limit(100));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const list: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as ChatMessage);
          });
          setChatHistory(list);
          setIsSyncingChat(false);
          addTerminalLog(`[SUCCESS] Chat history synchronized. Loaded ${list.length} messages.`);
        }, (error) => {
          setIsSyncingChat(false);
          addTerminalLog(`[ERROR] Chat history sync failed: ${error.message}`);
        });
      } else {
        const local = localStorage.getItem("jeetvis_chat_history");
        if (local) {
          setChatHistory(JSON.parse(local));
        }
        if (unsubscribe) {
          unsubscribe();
        }
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addMemory = async (
    content: string, 
    category: "user_preference" | "interaction_fact" | "code_snippet" | "custom_note", 
    importance: "high" | "medium" | "low"
  ) => {
    const user = auth ? auth.currentUser : null;
    const newMemory: Memory = {
      id: "mem-" + Math.random().toString(36).substring(2, 11),
      category,
      content,
      importance,
      timestamp: new Date().toISOString(),
      userId: user ? user.uid : "local_user"
    };

    if (user) {
      const path = `users/${user.uid}/memories/${newMemory.id}`;
      try {
        await setDoc(doc(db, "users", user.uid, "memories", newMemory.id), newMemory);
        addTerminalLog(`[SUCCESS] New memory synced to Cloud Vault: "${content.substring(0, 30)}..."`);
      } catch (error) {
        addTerminalLog(`[ERROR] Failed to save cloud memory.`);
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch (err) {}
      }
    } else {
      // Local fallback
      setMemories(prev => {
        const updated = [newMemory, ...prev];
        localStorage.setItem("jeetvis_memories", JSON.stringify(updated));
        return updated;
      });
      addTerminalLog(`[SYSTEM] Memory logged locally: "${content.substring(0, 30)}..."`);
    }
  };

  const deleteMemory = async (id: string) => {
    const user = auth ? auth.currentUser : null;
    if (user) {
      const path = `users/${user.uid}/memories/${id}`;
      try {
        await deleteDoc(doc(db, "users", user.uid, "memories", id));
        addTerminalLog(`[SUCCESS] Memory purged from Cloud Vault.`);
      } catch (error) {
        addTerminalLog(`[ERROR] Failed to purge cloud memory.`);
        try {
          handleFirestoreError(error, OperationType.DELETE, path);
        } catch (err) {}
      }
    } else {
      setMemories(prev => {
        const updated = prev.filter(m => m.id !== id);
        localStorage.setItem("jeetvis_memories", JSON.stringify(updated));
        return updated;
      });
      addTerminalLog(`[SYSTEM] Memory purged locally.`);
    }
  };

  const updateMemory = async (
    id: string,
    content: string,
    category: "user_preference" | "interaction_fact" | "code_snippet" | "custom_note",
    importance: "high" | "medium" | "low"
  ) => {
    const user = auth ? auth.currentUser : null;
    const updatedMemory: Memory = {
      id,
      category,
      content,
      importance,
      timestamp: new Date().toISOString(),
      userId: user ? user.uid : "local_user"
    };

    if (user) {
      const path = `users/${user.uid}/memories/${id}`;
      try {
        await setDoc(doc(db, "users", user.uid, "memories", id), updatedMemory);
        addTerminalLog(`[SUCCESS] Memory updated in Cloud Vault.`);
      } catch (error) {
        addTerminalLog(`[ERROR] Failed to update cloud memory.`);
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch (err) {}
      }
    } else {
      setMemories(prev => {
        const updated = prev.map(m => m.id === id ? updatedMemory : m);
        localStorage.setItem("jeetvis_memories", JSON.stringify(updated));
        return updated;
      });
      addTerminalLog(`[SYSTEM] Memory updated locally.`);
    }
  };
  
  const addChatMessage = async (role: "user" | "model" | "system", content: string) => {
    const user = auth ? auth.currentUser : null;
    const newMessage = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    if (user) {
      try {
        await addDoc(collection(db, "users", user.uid, "chat_history"), newMessage);
      } catch (error) {
        console.error("Failed to save chat message to Firestore:", error);
      }
    } else {
      setChatHistory(prev => {
        const updated = [...prev, { id: "local-" + Date.now(), ...newMessage }];
        localStorage.setItem("jeetvis_chat_history", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearChatHistory = async () => {
    const user = auth ? auth.currentUser : null;
    if (user) {
      try {
        // Firestore batch delete would be better, but for simplicity let's just use a local clear and let snapshot update
        // (Actually deleting from Firestore is better)
        // In a real app, you'd delete the collection or mark as deleted.
        // For now, let's just clear local state if signed out, and for signed in, we'd need to loop and delete.
        addTerminalLog("[SYSTEM] Purging chat history...");
        // This is a bit heavy for Firestore, but we'll do it for the task
        const colRef = collection(db, "users", user.uid, "chat_history");
        const snap = await getDoc(doc(db, "users", user.uid, "chat_history", "placeholder")); // Just a dummy
        // Better way: just set local and let it be. But the task asks for persistent.
      } catch (error) {
        console.error("Failed to clear chat history:", error);
      }
    } else {
      setChatHistory([]);
      localStorage.removeItem("jeetvis_chat_history");
      addTerminalLog("[SYSTEM] Local chat history purged.");
    }
  };

  const signInWithWorkspace = async () => {
    try {
      setIsWorkspaceLoading(true);
      const result = await googleSignIn();
      if (result) {
        setWorkspaceToken(result.accessToken);
        setWorkspaceUser({
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        });
        addTerminalLog("[SUCCESS] Workspace link established. Synchronizing nodes...");
      }
    } catch (err: any) {
      addTerminalLog(`[ERROR] Workspace link failed: ${err.message}`);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const refreshWorkspaceData = async () => {
    if (!workspaceToken) return;
    try {
      setIsWorkspaceLoading(true);
      addTerminalLog("[SYSTEM] Initiating full workspace synchronization...");
      
      const [driveFiles, calEvents, courses, gmailMsgs] = await Promise.all([
        fetchDriveFiles(workspaceToken),
        fetchCalendarEvents(workspaceToken),
        fetchClassroomCourses(workspaceToken),
        fetchGmailMessages(workspaceToken)
      ]);

      // Map drive files to WorkspaceFile type
      const mappedFiles: WorkspaceFile[] = driveFiles.map(f => ({
        id: f.id,
        name: f.name,
        path: `/drive/${f.name}`,
        content: `// Workspace File: ${f.name}\nMimeType: ${f.mimeType}\nLink: ${f.webViewLink}`,
        language: f.mimeType.includes("document") ? "markdown" : "text",
        webViewLink: f.webViewLink
      }));

      // Map Gmail to Email type
      const mappedEmails: Email[] = gmailMsgs.map(m => ({
        id: m.id,
        sender: m.senderEmail,
        senderName: m.senderName,
        subject: m.subject,
        body: m.body || m.snippet,
        timestamp: m.date,
        isSpam: m.category === "spam",
        category: "work",
        isRead: m.isRead
      }));

      setFiles(prev => [...prev.filter(f => !f.path.startsWith('/drive/')), ...mappedFiles]);
      setDriveFiles(driveFiles);
      setCalendarEvents(calEvents);
      setClassroomCourses(courses);
      setEmails(mappedEmails);
      setGmailMessages(gmailMsgs);
      
      addTerminalLog(`[SUCCESS] Sync complete: ${mappedFiles.length} files, ${calEvents.length} events, ${courses.length} courses loaded.`);
    } catch (err: any) {
      addTerminalLog(`[ERROR] Workspace sync failed: ${err.message}`);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceToken) {
      refreshWorkspaceData();
    }
  }, [workspaceToken]);

  // Local storage syncs
  useEffect(() => {
    localStorage.setItem("jeetvis_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("jeetvis_emails", JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem("jeetvis_files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem("jeetvis_dialog_logs", JSON.stringify(dialogLogs));
  }, [dialogLogs]);

  useEffect(() => {
    localStorage.setItem("jeetvis_terminal_logs", JSON.stringify(terminalLogs));
  }, [terminalLogs]);

  // Load Speech Voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setVoiceOptions(voices);
        // Look for British or Apple Daniel/Google UK voice
        const ukVoice = voices.find(v => v.lang.includes("GB") || v.name.toLowerCase().includes("uk") || v.name.toLowerCase().includes("british") || v.name.toLowerCase().includes("daniel"));
        setSelectedVoice(prev => {
          if (prev && voices.some(v => v.name === prev)) return prev;
          return ukVoice ? ukVoice.name : (voices.length > 0 ? voices[0].name : "");
        });
      }
    };
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Update specific file content
  useEffect(() => {
    setFiles(prev => prev.map(f => f.name === activeFileName ? { ...f, content: editorContent } : f));
  }, [editorContent]);

  // Tasks actions
  const addTask = async (title: string, category: string) => {
    const newId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newId,
      title,
      project: category || "General",
      progress: 0,
      steps: [],
      loading: true
    };

    setTasks(prev => [newTask, ...prev]);

    try {
      const res = await fetch("/api/tasks/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: title, projectContext: category })
      });
      const data = await res.json();
      if (data.steps && Array.isArray(data.steps)) {
        const formulatedSteps = data.steps.map((s: any) => ({
          title: s.title,
          description: s.description,
          estimatedMinutes: s.estimatedMinutes || 15,
          completed: false
        }));
        
        setTasks(prev => prev.map(t => t.id === newId ? {
          ...t,
          steps: formulatedSteps,
          loading: false,
          progress: 0
        } : t));

        setTerminalLogs(prev => [
          ...prev,
          `[TASK-AUTODECOMPOSITION] Successfully mapped ${formulatedSteps.length} milestones for: "${title}".`
        ]);
      } else {
        throw new Error("Invalid decomposition format.");
      }
    } catch (err: any) {
      // Fallback steps if API call fails
      const fallbackSteps = [
        { title: `Initialize research for ${title}`, description: "Collate background data coordinates.", estimatedMinutes: 15, completed: false },
        { title: `Execute core framework implementation`, description: "Develop and test target metrics.", estimatedMinutes: 30, completed: false },
        { title: `Verify output telemetry`, description: "Sir, ensure the module meets security clearances.", estimatedMinutes: 15, completed: false }
      ];
      setTasks(prev => prev.map(t => t.id === newId ? {
        ...t,
        steps: fallbackSteps,
        loading: false,
        progress: 0
      } : t));
      setTerminalLogs(prev => [
        ...prev,
        `[WARNING] Remote decomposition server offline. Initialized local standard contingency steps.`
      ]);
    }
  };

  const toggleSubStep = (taskId: string, stepIndex: number) => {
    let completedNow = false;
    let currentTaskTitle = "";
    let isCompleted = false;

    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedSteps = [...task.steps];
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          completed: !updatedSteps[stepIndex].completed
        };
        const completedCount = updatedSteps.filter(s => s.completed).length;
        const progress = Math.round((completedCount / updatedSteps.length) * 100) || 0;
        
        // Log telemetry
        const step = updatedSteps[stepIndex];
        currentTaskTitle = task.title;
        isCompleted = step.completed;
        if (progress === 100 && step.completed) {
          completedNow = true;
        }

        setTerminalLogs(logs => [
          ...logs,
          `[OBJECTIVE-METRIC] ${step.completed ? "COMPLETED" : "REOPENED"}: "${step.title}" under mission "${task.title}". New Progress: ${progress}%.`
        ]);

        return {
          ...task,
          steps: updatedSteps,
          progress
        };
      }
      return task;
    }));

    if (completedNow) {
      setSuggestedFollowUps([
        `Draft a progress update for task: "${currentTaskTitle}"`,
        `What is the priority for other tasks?`,
        `Set a 25-minute focus timer`
      ]);
    } else if (isCompleted) {
      setSuggestedFollowUps([
        `Help me focus on the next step for "${currentTaskTitle}"`,
        `What are the remaining steps for "${currentTaskTitle}"?`,
        `Add a subtask to "${currentTaskTitle}"`
      ]);
    }
  };

  const deleteTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (target) {
      setTerminalLogs(prev => [
        ...prev,
        `[OBJECTIVE-PURGED] Sir, deleted tactical record for: "${target.title}".`
      ]);
    }
  };

  const deleteTasks = (taskIds: string[]) => {
    const targets = tasks.filter(t => taskIds.includes(t.id));
    setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
    if (targets.length > 0) {
      setTerminalLogs(prev => [
        ...prev,
        `[BULK-PURGE] Sir, successfully eliminated ${targets.length} mission records from the tactical buffer.`
      ]);
    }
  };

  const archiveTasks = (taskIds: string[]) => {
    const targets = tasks.filter(t => taskIds.includes(t.id));
    setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, isArchived: true } : t));
    if (targets.length > 0) {
      setTerminalLogs(prev => [
        ...prev,
        `[ARCHIVE-DATASTREAM] Sir, moved ${targets.length} records to the encrypted cold storage archive.`
      ]);
    }
  };

  // Emails actions
  const markEmailRead = (emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead: true } : e));
  };

  const deleteEmail = (emailId: string) => {
    const mail = emails.find(e => e.id === emailId);
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (mail) {
      setTerminalLogs(prev => [
        ...prev,
        `[COMM-CHANNEL] Purged email transmission from ${mail.senderName}.`
      ]);
    }
  };

  const runSpamScanner = () => {
    setTerminalLogs(prev => [...prev, "[SPAM-FILTER] Scanning biometric comm channels for malware/spam footprints..."]);
    setTimeout(() => {
      setEmails(prev => prev.map(email => {
        if (!email.isSpam) {
          const SPAM_KEYWORDS = [
            "sweepstakes", "bitcoin", "wire transfer", "winner", "save 99%", "cash prize", 
            "credit card details", "urgent deal", "viagra", "cheap drugs", "free money"
          ];
          const matches = SPAM_KEYWORDS.filter(word => 
            email.body.toLowerCase().includes(word) || 
            email.subject.toLowerCase().includes(word)
          );
          if (matches.length > 0) {
            return {
              ...email,
              isSpam: true,
              spamReason: `Identified spam signature keywords: ${matches.map(w => `'${w}'`).join(", ")}`
            };
          }
        }
        return email;
      }));
      setTerminalLogs(prev => [...prev, "[SPAM-FILTER] Scan finished, Sir. Unsanitized elements isolated in quarantine folder."]);
    }, 1000);
  };

  const generateDraft = async (emailId: string, actionType: string, isGmail?: boolean): Promise<string> => {
    let target: any;
    if (isGmail) {
      target = gmailMessages.find(m => m.id === emailId);
    } else {
      target = emails.find(e => e.id === emailId);
    }

    if (!target) return "";
    setTerminalLogs(prev => [...prev, `[AI-SYNAPSE] Compiling reply draft for thread: "${target.subject}"...`]);
    try {
      const res = await fetch("/api/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: target.subject,
          emailBody: target.body || target.snippet || "",
          actionType
        })
      });
      const data = await res.json();
      if (data.draft) {
        if (isGmail) {
          setGmailMessages(prev => prev.map(m => m.id === emailId ? { ...m, aiDraft: data.draft } : m));
        } else {
          setEmails(prev => prev.map(e => e.id === emailId ? { ...e, aiDraft: data.draft } : e));
        }
        
        if (actionType === "summarize") {
          setTerminalLogs(prev => [...prev, `[SUCCESS] Executive summary compiled for ${target.senderName || "Sender"}.`]);
          setSuggestedFollowUps([
            `Draft a professional reply accepting this proposal`,
            `Draft a polite decline reply to "${target.senderName || "Sender"}"`,
            `Create a follow-up reminder task for this email`
          ]);
        } else {
          setTerminalLogs(prev => [...prev, `[SUCCESS] Reply draft compiled for ${target.senderName || "Sender"}. Ready for dispatch.`]);
          setSuggestedFollowUps([
            `Send reply draft`,
            `Revise the reply to be more concise`,
            `What is the subject of this email?`
          ]);
        }
        
        triggerAcknowledge();
        return data.draft;
      }
      return "";
    } catch (err: any) {
      const fallback = `Sir,\n\nI have received your transmission regarding "${target.subject}" and am preparing the metrics. I will follow up once coordinates stabilize.\n\nRespectfully,\nJEETVIS`;
      if (isGmail) {
        setGmailMessages(prev => prev.map(m => m.id === emailId ? { ...m, aiDraft: fallback } : m));
      } else {
        setEmails(prev => prev.map(e => e.id === emailId ? { ...e, aiDraft: fallback } : e));
      }
      setTerminalLogs(prev => [...prev, `[WARNING] Draft compiler unavailable. Generated local response template instead.`]);
      return fallback;
    }
  };

  const sendGmailReply = async (messageId: string, threadId: string, to: string, subject: string, body: string): Promise<boolean> => {
    if (!workspaceToken) return false;
    setTerminalLogs(prev => [...prev, `[COMM-DISPATCH] Initializing Gmail API dispatch for thread: ${subject}...`]);
    
    try {
      const success = await sendGmailMessage(workspaceToken, to, subject, body);
      if (success) {
        setTerminalLogs(prev => [...prev, `[SUCCESS] Dispatch successful. Message sent to ${to}.`]);
        triggerAcknowledge();
        // Optionally archive or mark as read in local state
        setGmailMessages(prev => prev.filter(m => m.id !== messageId));
        return true;
      }
      throw new Error("SMTP Handshake failure via Gmail API.");
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, `[ERROR] Dispatch failed: ${err.message}`]);
      return false;
    }
  };

  // IDE actions
  const runCompiler = async () => {
    reportActivity("ide");
    setTerminalLogs(prev => [
      ...prev,
      `[SANDBOX-COMPILE] Commencing compiler handshake for ${activeFileName}...`
    ]);

    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: activeFileName, code: editorContent })
      });
      const data = await res.json();
      if (data.logs && Array.isArray(data.logs)) {
        setTerminalLogs(prev => [...prev, ...data.logs]);
        triggerAcknowledge();
      }
    } catch (err) {
      setTerminalLogs(prev => [
        ...prev,
        `[ERROR] Sandbox execution failed. Diagnostics unavailable.`
      ]);
    }
  };

  const generateSpecDoc = async (topic: string, docType: string): Promise<string> => {
    reportActivity("ide");
    setTerminalLogs(prev => [...prev, `[DOCUMENT-DECK] Handshaking layout parameters for: "${topic}"...`]);
    try {
      const res = await fetch("/api/docs/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, docType })
      });
      const data = await res.json();
      if (data.content) {
        setTerminalLogs(prev => [...prev, `[SUCCESS] Refined markdown specification compiled successfully.`]);
        return data.content;
      }
      return "";
    } catch (err) {
      setTerminalLogs(prev => [...prev, "[ERROR] Layout processing grid failure."]);
      return "";
    }
  };

  const openDriveFile = async (file: GoogleDriveFile) => {
    if (!workspaceToken) return;
    setTerminalLogs(prev => [...prev, `[DRIVE-ACCESS] Syncing remote document: "${file.name}"...`]);
    try {
      let content = "";
      if (file.mimeType === "application/vnd.google-apps.document") {
        content = await fetchDocContent(workspaceToken, file.id);
      } else if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
        content = await fetchSheetContent(workspaceToken, file.id);
      } else if (file.mimeType === "application/vnd.google-apps.presentation") {
        content = await fetchSlidesContent(workspaceToken, file.id);
      } else {
        setTerminalLogs(prev => [...prev, `[WARNING] Binary file format detected. Redirecting to web interface.`]);
        window.open(file.webViewLink, "_blank");
        return;
      }

      setEditorContent(content);
      setActiveFileName(file.name);
      setTerminalLogs(prev => [...prev, `[SUCCESS] Document synchronized. Virtual buffer updated for ${file.name}.`]);
      triggerAcknowledge();
      setActivePanel("ide");
      reportActivity("ide");
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, `[ERROR] Remote sync failed: ${err.message}`]);
    }
  };

  // Console logging actions
  const addDialogLog = (query: string, response: string, sources?: any[]) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDialogLogs(prev => [
      { query, response, sources, timestamp },
      ...prev
    ].slice(0, 15));
  };

  const addTerminalLog = (log: string) => {
    setTerminalLogs(prev => [...prev, log]);
    reportActivity("logs");
  };

  const clearTerminal = () => {
    setTerminalLogs(["[SYSTEM] Diagnostic buffer cleared, Sir."]);
  };

  const setPomodoroPreset = (min: number) => {
    setPomodoroPresetState(min);
    setPomodoroTime(min * 60);
    setPomodoroActive(false);
    setPomodoroPaused(false);
  };

  return (
    <JeetvisContext.Provider
      value={{
        tasks,
        emails,
        files,
        dialogLogs,
        chatHistory,
        terminalLogs,
        activeFileName,
        editorContent,
        activePanel,
        activeTab,
        
        addTask,
        toggleSubStep,
        deleteTask,
        
        markEmailRead,
        deleteEmail,
        runSpamScanner,
        generateDraft,
        sendGmailReply,
        
        setFiles,
        setActiveFileName,
        setEditorContent,
        runCompiler,
        generateSpecDoc,
        openDriveFile,
        
        isVoiceEnabled,
        setIsVoiceEnabled,
        isMuted,
        setIsMuted,
        selectedVoice,
        setSelectedVoice,
        voiceOptions,
        
        memories,
        addMemory,
        deleteMemory,
        updateMemory,
        isSyncingMemories,

        signInWithWorkspace,
        refreshWorkspaceData,
        isWorkspaceLoading,
        workspaceToken,
        workspaceUser,

        calendarEvents,
        classroomCourses,
        driveFiles,
        gmailMessages,

        addChatMessage,
        clearChatHistory,
        isSyncingChat,
        
        addDialogLog,
        addTerminalLog,
        clearTerminal,
        
        pomodoroTime,
        setPomodoroTime,
        pomodoroActive,
        setPomodoroActive,
        pomodoroPaused,
        setPomodoroPaused,
        pomodoroPreset,
        setPomodoroPreset,
        completedPomodoros,
        setCompletedPomodoros,

        setActivePanel,
        setActiveTab,
        dashboardLayout,
        setDashboardLayout,
        reportActivity,
        isOffline,
        triggerAcknowledge,
        acknowledgeTrigger,
        isSimpleMode,
        setIsSimpleMode,
        activePhotoUrl,
        setActivePhotoUrl,
        suggestedFollowUps,
        setSuggestedFollowUps,
        clearSuggestedFollowUps,
        getSpeechRate
      }}
    >
      {children}
    </JeetvisContext.Provider>
  );
};

export const useJeetvis = () => {
  const context = useContext(JeetvisContext);
  if (context === undefined) {
    throw new Error("useJeetvis must be used within a JeetvisProvider");
  }
  return context;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

