import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, Play, Pause, RotateCcw, Code, Terminal, FileCode, CheckCircle2, 
  Trash2, Mail, ShieldAlert, Sparkles, AlertOctagon, RefreshCw, Send, 
  X, Filter, ChevronUp, ChevronDown, ListTodo, Plus, Circle, CheckSquare, Square, Archive,
  FileText, FileSpreadsheet, Presentation, LogOut, LogIn, Search, ExternalLink, ShieldCheck, Download,
  Brain, Database, Calendar, BookOpen, MessageSquare, Bot, User
} from "lucide-react";
import { useJeetvis } from "../context/JeetvisContext";
import { 
  googleSignIn, logout, initAuth, fetchDocContent, 
  fetchSheetContent, fetchSlidesContent,
  fetchGmailMessages, sendGmailMessage, fetchCalendarEvents, createCalendarEvent,
  fetchClassroomCourses, fetchClassroomCoursework, fetchClassroomAnnouncements
} from "../lib/workspaceAuth";
import { GoogleDriveFile, GmailMessage } from "../types";

import VoiceInterface from "./VoiceInterface";

export default function ConcealedDock() {
  const {
    tasks,
    emails,
    files,
    terminalLogs,
    activeFileName,
    editorContent,
    activePanel,
    activeTab,
    
    addTask,
    toggleSubStep,
    deleteTask,
    deleteTasks,
    archiveTasks,
    
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
    
    memories,
    addMemory,
    deleteMemory,
    updateMemory,
    isSyncingMemories,
    chatHistory,
    isSyncingChat,

    signInWithWorkspace,
    refreshWorkspaceData,
    isWorkspaceLoading: isContextWorkspaceLoading,
    workspaceToken: contextWorkspaceToken,
    workspaceUser: contextWorkspaceUser,

    calendarEvents: contextCalendarEvents,
    classroomCourses: contextClassroomCourses,
    driveFiles: contextDriveFiles,
    gmailMessages: contextGmailMessages,
    isSimpleMode,
    suggestedFollowUps
  } = useJeetvis();

  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [memorySubTab, setMemorySubTab] = useState<"entries" | "chat">("entries");

  // Workspace sub-tab management
  const [workspaceSubTab, setWorkspaceSubTab] = useState<"drive" | "gmail" | "calendar" | "classroom">("drive");

  // Drive state
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [fileFilter, setFileFilter] = useState<"all" | "doc" | "sheet" | "slide">("all");
  const [fileSearch, setFileSearch] = useState("");
  const [importingContent, setImportingContent] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  // Gmail state
  const [selectedGmail, setSelectedGmail] = useState<any | null>(null);
  const [gmailSearch, setGmailSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSendingMail, setIsSendingMail] = useState(false);

  // Calendar state
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Code Chatbot States
  const [chatInput, setChatInput] = useState("");
  const [chatModel, setChatModel] = useState<"gemini-3.1-pro-preview" | "gemini-3.5-flash" | "gemini-3.1-flash-lite">("gemini-3.5-flash");
  const [chatPersona, setChatPersona] = useState<"jeetvis" | "auditor" | "designer" | "algo" | "companion">("jeetvis");
  const [chatIncludeContext, setChatIncludeContext] = useState(true);
  const [chatIsThinking, setChatIsThinking] = useState(false);

  const getInitialMessage = (persona: string) => {
    switch (persona) {
      case "auditor":
        return "Meticulous Code Auditor online. Send me your functions or scripts. I will scan them line-by-line for memory leaks, structural complexity, edge-case failures, and clean code violations.";
      case "designer":
        return "Visual UI Architect activated! Let's build stunning, interactive, responsive interfaces. I specialize in creative styling, SVG animations, and polished layouts.";
      case "algo":
        return "Algorithmic Specialist ready. Paste your data structures, search patterns, or computational hot-paths. Let's optimize the time and space complexity.";
      case "companion":
        return "Hello there, friend! I'm your simple coding helper companion. How can I help make your coding experience easy, stress-free, and fun today?";
      case "jeetvis":
      default:
        return "A pleasure to assist you, Sir. I am the JEETVIS Code Companion, ready to customize, debug, or architect code with maximum efficiency. What are our parameters today, Boss?";
    }
  };

  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "A pleasure to assist you, Sir. I am the JEETVIS Code Companion, ready to customize, debug, or architect code with maximum efficiency. What are our parameters today, Boss?" }
  ]);

  // Update welcome message if persona changes and chat is empty except for welcome
  useEffect(() => {
    if (chatMessages.length <= 1) {
      setChatMessages([
        { role: "assistant", content: getInitialMessage(chatPersona) }
      ]);
    }
  }, [chatPersona]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatEndRef.current && activePanel === "timer") {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatIsThinking, activePanel]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatIsThinking) return;

    const userMessage = chatInput;
    setChatInput("");
    
    const newMessages = [
      ...chatMessages,
      { role: "user" as const, content: userMessage }
    ];
    setChatMessages(newMessages);
    setChatIsThinking(true);

    try {
      let systemInstruction = "";
      if (chatPersona === "auditor") {
        systemInstruction = "You are an Elite Code Auditor and Refactor Specialist. Meticulously analyze the code for security holes, memory leaks, bugs, performance issues, and clean code styling. Point out bad practices and provide highly optimized solutions.";
      } else if (chatPersona === "designer") {
        systemInstruction = "You are a Creative Visual UI Architect. You focus on front-end aesthetics, Tailwind CSS classes, inline SVG layouts, transitions, animations, and beautiful responsive user interfaces.";
      } else if (chatPersona === "algo") {
        systemInstruction = "You are an Algorithm and Data Structure Specialist. You analyze Big O complexity, math, structures, and recursive patterns to optimize logical runtime execution.";
      } else if (chatPersona === "companion") {
        systemInstruction = "You are a warm, extremely friendly, simple, and encouraging personal coding helper companion. AVOID high-tech, complex sci-fi jargon. Speak with encouraging, easy, and gentle words.";
      } else {
        systemInstruction = "You are JEETVIS, the advanced British AI personal coding core. Address the user as 'Sir' or 'Boss'. Provide elegant, highly intelligent, and ultra-refined coding assistance. Always keep the user in supreme command.";
      }

      let finalMessagesForApi = [...newMessages];
      if (chatIncludeContext && editorContent) {
        const contextStr = `\n\n[ACTIVE CODE CONTEXT]\nFile Name: ${activeFileName}\nCode:\n\`\`\`\n${editorContent}\n\`\`\``;
        
        const lastUserMsg = { ...newMessages[newMessages.length - 1] };
        lastUserMsg.content = lastUserMsg.content + contextStr;
        
        finalMessagesForApi = [
          ...newMessages.slice(0, -1),
          lastUserMsg
        ];
      }

      const res = await fetch("/api/terminal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: finalMessagesForApi,
          model: chatModel,
          systemInstruction,
          temperature: chatPersona === "designer" ? 0.85 : 0.4
        })
      });

      const data = await res.json();
      if (data.text) {
        setChatMessages(prev => [
          ...prev,
          { role: "assistant" as const, content: data.text }
        ]);
        addTerminalLog(`[SUCCESS] Neural Chatbot response compiled using ${chatModel}.`);
      } else if (data.error) {
        setChatMessages(prev => [
          ...prev,
          { role: "assistant" as const, content: `System error occurred, Boss: ${data.error}` }
        ]);
        addTerminalLog(`[ERROR] Neural Chatbot error: ${data.error}`);
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { role: "assistant" as const, content: `Neural link disrupted, Sir. Connection failed: ${err.message}` }
      ]);
      addTerminalLog(`[ERROR] Chatbot socket failed: ${err.message}`);
    } finally {
      setChatIsThinking(false);
    }
  };

  const renderMessageContent = (msgContent: string) => {
    const parts = msgContent.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.split("\n");
        const header = lines[0].replace("```", "").trim();
        const codeContent = lines.slice(1, -1).join("\n");
        
        return (
          <div key={index} className="my-2 border border-white/5 rounded-xl bg-black/60 overflow-hidden font-mono text-[8.5px]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-[7.5px] text-slate-400 font-bold tracking-wider uppercase">
              <span>{header || "CODE"}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeContent);
                    addTerminalLog("[SUCCESS] Code block copied to clipboard.");
                  }}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded border border-white/5 transition-all cursor-pointer text-[7px]"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    setEditorContent(codeContent);
                    addTerminalLog(`[SUCCESS] Custom code block injected to Notepad!`);
                  }}
                  className="px-2 py-0.5 bg-cyan-400/25 hover:bg-cyan-400/45 text-cyan-300 hover:text-white rounded border border-cyan-400/30 transition-all cursor-pointer text-[7px]"
                >
                  Inject to Notepad
                </button>
              </div>
            </div>
            <pre className="p-3 overflow-x-auto text-cyan-100/90 leading-normal max-h-[200px] custom-scrollbar whitespace-pre">
              {codeContent}
            </pre>
          </div>
        );
      } else {
        return (
          <span key={index} className="whitespace-pre-line text-[9.5px] font-sans leading-relaxed text-slate-300">
            {part}
          </span>
        );
      }
    });
  };
  const [eventSummary, setEventSummary] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Classroom state
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [coursework, setCoursework] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isCourseDetailsLoading, setIsCourseDetailsLoading] = useState(false);

  // Mapping context to local names for compatibility
  const workspaceUser = contextWorkspaceUser;
  const workspaceToken = contextWorkspaceToken;
  const driveFiles = contextDriveFiles;
  const gmailMessages = contextGmailMessages;
  const calendarEvents = contextCalendarEvents;
  const classroomCourses = contextClassroomCourses;
  const isWorkspaceLoading = isContextWorkspaceLoading;
  const needsWorkspaceAuth = !workspaceToken;

  // Auto-select first items when context data arrives
  useEffect(() => {
    if (driveFiles.length > 0 && !selectedFile) setSelectedFile(driveFiles[0]);
  }, [driveFiles, selectedFile]);

  useEffect(() => {
    if (gmailMessages.length > 0 && !selectedGmail) setSelectedGmail(gmailMessages[0]);
  }, [gmailMessages, selectedGmail]);

  useEffect(() => {
    if (classroomCourses.length > 0 && !selectedCourse) {
      setSelectedCourse(classroomCourses[0]);
      if (workspaceToken) loadCourseDetails(workspaceToken, classroomCourses[0].id);
    }
  }, [classroomCourses, selectedCourse, workspaceToken]);

  // Memory Vault State
  const [manualMemoryText, setManualMemoryText] = useState("");
  const [manualMemoryCat, setManualMemoryCat] = useState<"user_preference" | "interaction_fact" | "code_snippet" | "custom_note">("user_preference");
  const [manualMemoryImp, setManualMemoryImp] = useState<"high" | "medium" | "low">("medium");

  const handleManualMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMemoryText.trim()) return;
    await addMemory(manualMemoryText, manualMemoryCat, manualMemoryImp);
    setManualMemoryText("");
  };


  // Workspace Logic Handlers
  const loadCourseDetails = async (token: string, courseId: string) => {
    setIsCourseDetailsLoading(true);
    try {
      const [cw, ann] = await Promise.all([
        fetchClassroomCoursework(token, courseId),
        fetchClassroomAnnouncements(token, courseId)
      ]);
      setCoursework(cw);
      setAnnouncements(ann);
    } catch (err: any) {
      addTerminalLog(`[ERROR] Failed to query Classroom course details: ${err.message || err}`);
    } finally {
      setIsCourseDetailsLoading(false);
    }
  };

  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !composeTo || !composeSubject || !composeBody) return;
    setIsSendingMail(true);
    addTerminalLog(`[GMAIL] Dispatching secure SMTP relay for "${composeSubject}" to ${composeTo}...`);
    try {
      const ok = await sendGmailMessage(workspaceToken, composeTo, composeSubject, composeBody);
      if (ok) {
        addTerminalLog(`[SUCCESS] Transmission successfully dispatched to: ${composeTo}.`);
        setShowCompose(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        await loadGmailMessages();
      } else {
        throw new Error("SMTP relay rejected message payload.");
      }
    } catch (err: any) {
      addTerminalLog(`[ERROR] Secure mail dispatch aborted: ${err.message || err}`);
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !eventSummary || !eventStart || !eventEnd) return;
    setIsCreatingEvent(true);
    addTerminalLog(`[CALENDAR] Synchronizing new orbital marker: "${eventSummary}"...`);
    try {
      const ok = await createCalendarEvent(workspaceToken, {
        summary: eventSummary,
        description: eventDescription,
        start: eventStart,
        end: eventEnd
      });
      if (ok) {
        addTerminalLog(`[SUCCESS] Calendar database updated for: "${eventSummary}".`);
        setShowAddEvent(false);
        setEventSummary("");
        setEventDescription("");
        setEventStart("");
        setEventEnd("");
        await loadCalendarEvents();
      } else {
        throw new Error("Calendar service rejected slot creation request.");
      }
    } catch (err: any) {
      addTerminalLog(`[ERROR] Calendar scheduling failed: ${err.message || err}`);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleWorkspaceLogin = async () => {
    await signInWithWorkspace();
  };

  const handleWorkspaceLogout = async () => {
    addTerminalLog("[WORKSPACE] Disconnecting current secure Google session.");
    await logout();
    // In a real app we'd update context, for now we reload to clear
    window.location.reload();
  };

  const loadWorkspaceFiles = async () => {
    await refreshWorkspaceData();
  };
  
  const loadGmailMessages = async () => {
    await refreshWorkspaceData();
  };
  
  const loadCalendarEvents = async () => {
    await refreshWorkspaceData();
  };
  
  const loadClassroomCourses = async () => {
    await refreshWorkspaceData();
  };

  const handleImportFileToEditor = async () => {
    if (!selectedFile || !workspaceToken) return;
    setImportingContent(true);
    setImportStatus("ACCESSING WORKSPACE FILE...");
    addTerminalLog(`[WORKSPACE-IMPORT] Fetching contents for "${selectedFile.name}"...`);

    try {
      let content = "";
      let newFileName = selectedFile.name;
      let language = "markdown";

      if (selectedFile.mimeType.includes("document")) {
        content = await fetchDocContent(workspaceToken, selectedFile.id);
        if (!newFileName.endsWith(".md")) newFileName += ".md";
        language = "markdown";
      } else if (selectedFile.mimeType.includes("spreadsheet")) {
        content = await fetchSheetContent(workspaceToken, selectedFile.id);
        if (!newFileName.endsWith(".csv") && !newFileName.endsWith(".md")) newFileName += ".md";
        language = "markdown";
      } else if (selectedFile.mimeType.includes("presentation")) {
        content = await fetchSlidesContent(workspaceToken, selectedFile.id);
        if (!newFileName.endsWith(".md")) newFileName += ".md";
        language = "markdown";
      }

      setImportStatus("SYNCHRONIZING WITH EDITOR BUFFER...");
      
      // Add imported file to workspace files state
      const existingFileIndex = files.findIndex(f => f.name === newFileName);
      if (existingFileIndex >= 0) {
        const updatedFiles = [...files];
        updatedFiles[existingFileIndex] = {
          ...updatedFiles[existingFileIndex],
          content: content
        };
        setFiles(updatedFiles);
      } else {
        setFiles(prev => [
          ...prev,
          {
            name: newFileName,
            path: `/workspace/${newFileName}`,
            content: content,
            language: language
          }
        ]);
      }

      setActiveFileName(newFileName);
      setEditorContent(content);

      addTerminalLog(`[SUCCESS] Imported "${newFileName}" successfully into Sandbox editor.`);
      setImportStatus("COMPLETE");
      setTimeout(() => setImportingContent(false), 800);
    } catch (err: any) {
      addTerminalLog(`[ERROR] Failed to ingest Workspace resource: ${err.message || err}`);
      setImportStatus("FAILED");
      setTimeout(() => setImportingContent(false), 2000);
    }
  };

  // Local state for active email in panel
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState<"all" | "work" | "newsletter" | "spam">("all");
  const [draftLoading, setDraftLoading] = useState(false);
  const [scanningSpam, setScanningSpam] = useState(false);
  const [isGmailMode, setIsGmailMode] = useState(false);

  useEffect(() => {
    if (contextWorkspaceToken && contextGmailMessages.length > 0) {
      setIsGmailMode(true);
    } else {
      setIsGmailMode(false);
    }
  }, [contextWorkspaceToken, contextGmailMessages]);

  const displayEmails = isGmailMode ? contextGmailMessages : emails;
  const activeEmail = isGmailMode 
    ? contextGmailMessages.find(m => m.id === activeEmailId) 
    : emails.find(e => e.id === activeEmailId);

  const handleDispatchGmail = async () => {
    if (!isGmailMode || !activeEmail || !activeEmail.aiDraft) return;
    const success = await sendGmailReply(
      activeEmail.id,
      (activeEmail as any).threadId,
      (activeEmail as any).senderEmail,
      `Re: ${activeEmail.subject}`,
      activeEmail.aiDraft
    );
    if (success) {
      setActiveEmailId(null);
    }
  };

  // Task creation local state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [taskCreating, setTaskCreating] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const activeTasks = tasks.filter(t => !t.isArchived);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAllTasks = () => {
    if (selectedTaskIds.length === activeTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(activeTasks.map(t => t.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    deleteTasks(selectedTaskIds);
    setSelectedTaskIds([]);
  };

  const handleBulkArchive = () => {
    if (selectedTaskIds.length === 0) return;
    archiveTasks(selectedTaskIds);
    setSelectedTaskIds([]);
  };

  // Doc Generator state
  const [specTopic, setSpecTopic] = useState("");
  const [specType, setSpecType] = useState("Technical Specification");
  const [specOutput, setSpecOutput] = useState("");
  const [specLoading, setSpecLoading] = useState(false);

  // Tick the Pomodoro countdown in background if active and not paused
  useEffect(() => {
    let timerInterval: any = null;
    if (pomodoroActive && !pomodoroPaused) {
      timerInterval = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            setPomodoroActive(false);
            setCompletedPomodoros((c) => c + 1);
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [pomodoroActive, pomodoroPaused]);

  // Handle task submission
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTaskCreating(true);
    await addTask(newTaskTitle, newTaskCategory);
    setNewTaskTitle("");
    setNewTaskCategory("");
    setTaskCreating(false);
  };

  // Generate Email Reply Draft
  const handleGenerateReply = async (type: string) => {
    if (!activeEmail) return;
    setDraftLoading(true);
    await generateDraft(activeEmail.id, type, isGmailMode);
    setDraftLoading(false);
  };

  // Handle Spec Doc Generation
  const handleGenerateSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specTopic.trim()) return;
    setSpecLoading(true);
    const content = await generateSpecDoc(specTopic, specType);
    setSpecOutput(content);
    setSpecLoading(false);
  };

  // Run mock scanner
  const handleSpamScan = () => {
    setScanningSpam(true);
    runSpamScanner();
    setTimeout(() => setScanningSpam(false), 1000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div id="concealed-workspace-dock" className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center">
      
      {/* Sleek Floating Navigation Menu when panel is closed or open */}
      <div className="mb-6 bg-[#000000]/95 border border-white/5 px-6 py-3 rounded-full flex items-center gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300">
        <button
          onClick={() => {
            setActivePanel(activePanel === "timer" ? "none" : "timer");
            reportActivity("timer");
          }}
          className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            activePanel === "timer" 
              ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-bold" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="h-3 w-3" />
          {isSimpleMode ? "Code Chatbot" : "Neural Chatbot"}
        </button>

        <button
          onClick={() => {
            setActivePanel(activePanel === "ide" ? "none" : "ide");
            reportActivity("ide");
          }}
          className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            activePanel === "ide" 
              ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-bold" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Code className="h-3 w-3" />
          {isSimpleMode ? "Notepad" : "Core Sandbox"}
        </button>

        <button
          onClick={() => {
            setActivePanel(activePanel === "tasks_emails" ? "none" : "tasks_emails");
            reportActivity("comm");
          }}
          className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            activePanel === "tasks_emails" 
              ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-bold" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Terminal className="h-3 w-3" />
          {isSimpleMode ? "Tasks & Mail" : "Tactical Matrix"}
        </button>

        <button
          onClick={() => setActivePanel(activePanel === "workspace" ? "none" : "workspace")}
          className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            activePanel === "workspace" 
              ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-bold" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldCheck className="h-3 w-3" />
          {isSimpleMode ? "Google Integration" : "Workspace"}
        </button>

        <button
          onClick={() => setActivePanel(activePanel === "memory" ? "none" : "memory")}
          className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            activePanel === "memory" 
              ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-bold" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Database className="h-3 w-3" />
          {isSimpleMode ? "Saved Preferences" : "Memory Vault"}
        </button>

        <button
          onClick={() => setShowVoiceInterface(true)}
          className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5"
        >
          <Brain className="h-3 w-3" />
          Neural Link
        </button>

        {activePanel !== "none" && (
          <button
            onClick={() => setActivePanel("none")}
            className="text-slate-500 hover:text-white transition-colors duration-200 cursor-pointer p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Smooth-sliding panel container */}
      <AnimatePresence>
        {activePanel !== "none" && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="w-full max-w-7xl mx-auto h-[480px] bg-[#050505]/98 border-t border-white/5 rounded-t-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden flex flex-col text-left"
          >
            
            {/* Control Panel Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between font-mono text-[9px]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-white uppercase tracking-widest">
                  JEETVIS MODULE: {activePanel === "timer" ? "COGNITIVE CODE CHATBOT" : activePanel === "ide" ? "INTELLIGENT SANDBOX V.3" : activePanel === "workspace" ? "WORKSPACE DATASTREAM COUPLER" : activePanel === "memory" ? "QUANTUM MEMORY REPOSITORY" : "CENTRAL COMMUNICATIONS & LOGISTICS"}
                </span>
              </div>
              <span className="text-slate-500 tracking-[0.2em]">DIRECT SECURE DATASTREAM // ACTIVE</span>
            </div>

            {/* Panel Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* 1. CODE CHATBOT CORE SYSTEM */}
              {activePanel === "timer" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 text-slate-100 font-mono">
                  
                  {/* Left Column: Chat Control Center - 4 Cols */}
                  <div className="lg:col-span-4 border-r border-white/5 pr-4 flex flex-col gap-5 justify-between">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">Cognitive Core</h3>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 leading-relaxed">
                          Tune JEETVIS' neural network parameters. Address questions, refactor scripts, or design layouts with deep thinking capability.
                        </p>
                      </div>

                      {/* Model Selection */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Brain Model Matrix</label>
                        <select
                          value={chatModel}
                          onChange={(e: any) => setChatModel(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded px-2.5 py-1.5 font-mono text-[9px] text-cyan-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="gemini-3.5-flash">gemini-3.5-flash (General Core)</option>
                          <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Thinking: HIGH)</option>
                          <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Express Line)</option>
                        </select>
                      </div>

                      {/* Persona Selection */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">System Role Profile</label>
                        <select
                          value={chatPersona}
                          onChange={(e: any) => setChatPersona(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded px-2.5 py-1.5 font-mono text-[9px] text-purple-400 focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="jeetvis">JEETVIS (Refined British)</option>
                          <option value="auditor">Code Auditor (Bug Spotter)</option>
                          <option value="designer">UI Architect (Visual/CSS)</option>
                          <option value="algo">Algorithmic (Big-O/Structures)</option>
                          <option value="companion">Companion (Encouraging)</option>
                        </select>
                      </div>

                      {/* Context Checkbox */}
                      <label className="flex items-start gap-2.5 mt-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={chatIncludeContext}
                          onChange={(e) => setChatIncludeContext(e.target.checked)}
                          className="rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer mt-0.5"
                        />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold uppercase">Include active context</span>
                          <span className="text-[7.5px] text-slate-500 normal-case">Sends active Notepad file ("{activeFileName}") as system state</span>
                        </div>
                      </label>
                    </div>

                    <div className="border-t border-white/5 pt-3 mb-2 flex flex-col gap-1">
                      <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-bold">Workspace Ingress</span>
                      <div className="flex items-center justify-between text-[8px] text-slate-400">
                        <span>Notepad sync status:</span>
                        <span className="text-emerald-400">ONLINE</span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-slate-400">
                        <span>Active model latency:</span>
                        <span className="text-cyan-400">OPTIMIZED</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Active Thread & Chat Interface - 8 Cols */}
                  <div className="lg:col-span-8 flex flex-col h-[350px] min-h-0 bg-black/40 border border-white/5 rounded-xl overflow-hidden relative">
                    
                    {/* Chat Messages */}
                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-0 select-text">
                      {chatMessages.map((msg, index) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={index}
                            className={`flex gap-2.5 max-w-[92%] ${
                              isUser ? "self-end flex-row-reverse" : "self-start"
                            }`}
                          >
                            <div
                              className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 border select-none ${
                                isUser
                                  ? "bg-cyan-950 border-cyan-500/30 text-cyan-400"
                                  : chatPersona === "auditor"
                                  ? "bg-emerald-950 border-emerald-500/30 text-emerald-400"
                                  : chatPersona === "designer"
                                  ? "bg-pink-950 border-pink-500/30 text-pink-400"
                                  : chatPersona === "algo"
                                  ? "bg-purple-950 border-purple-500/30 text-purple-400"
                                  : chatPersona === "companion"
                                  ? "bg-amber-950 border-amber-500/30 text-amber-400"
                                  : "bg-cyan-950 border-cyan-400/30 text-cyan-400"
                              }`}
                            >
                              {isUser ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Bot className="h-3 w-3" />
                              )}
                            </div>

                            <div
                              className={`p-2.5 rounded-xl border relative ${
                                isUser
                                  ? "bg-cyan-950/40 border-cyan-500/20 text-right"
                                  : "bg-white/5 border-white/5"
                              }`}
                            >
                              <div className={`font-mono text-[7px] uppercase tracking-wider text-slate-500 mb-1 select-none ${isUser ? "text-right" : "text-left"}`}>
                                {isUser ? "Commander" : `JEETVIS Core (${chatPersona.toUpperCase()})`}
                              </div>
                              <div className="text-left font-sans">
                                {renderMessageContent(msg.content)}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {chatIsThinking && (
                        <div className="flex gap-2.5 max-w-[92%] self-start animate-pulse">
                          <div className="h-6 w-6 rounded-lg bg-cyan-950 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                            <Bot className="h-3 w-3 animate-bounce" />
                          </div>
                          <div className="p-2.5 rounded-xl border bg-white/5 border-white/5 flex flex-col gap-1">
                            <span className="font-mono text-[7px] uppercase tracking-wider text-cyan-400">
                              {chatModel === "gemini-3.1-pro-preview" ? "Thinking Deeply..." : "Processing Response..."}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                              <span className="font-mono text-[8px] text-slate-500">
                                {chatPersona === "auditor" 
                                  ? "Auditing core functions..."
                                  : chatPersona === "designer"
                                  ? "Calibrating Tailwind visual classes..."
                                  : chatPersona === "algo"
                                  ? "Calculating complexity bounds..."
                                  : "Formulating elegant response, Sir."}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendChatMessage();
                      }}
                      className="flex items-center gap-2 p-2 bg-black/50 border-t border-white/5 flex-shrink-0 z-10"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={
                          chatIsThinking
                            ? "AI thinking..."
                            : `Ask ${chatPersona === "jeetvis" ? "JEETVIS" : chatPersona} to write, debug, or refine code...`
                        }
                        disabled={chatIsThinking}
                        className="flex-1 bg-slate-900 border border-white/5 rounded-lg p-2 font-mono text-[9px] text-white focus:outline-none focus:border-cyan-500/40 focus:ring-0 placeholder:text-slate-700"
                      />
                      <button
                        type="submit"
                        disabled={chatIsThinking || !chatInput.trim()}
                        className="h-8 w-8 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-45 text-slate-950 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>

                  </div>

                </div>
              )}

              {/* 2. AGENTIC WORKSPACE & IDE */}
              {activePanel === "ide" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                  
                  {/* IDE File Tree & Sidebar - 3 Cols */}
                  <div className="lg:col-span-3 border-r border-white/5 pr-4 flex flex-col gap-4">
                    <div className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest mb-1">
                      WORKSPACE GRID
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      {files.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveFileName(file.name)}
                          className={`w-full text-left font-mono text-[10px] p-2.5 rounded transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                            activeFileName === file.name 
                              ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300" 
                              : "border-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <FileCode className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Spec Document Generator Form */}
                    <form onSubmit={handleGenerateSpec} className="border-t border-white/5 pt-4 mt-auto flex flex-col gap-2.5">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest block">SPEC DECK BUILDER</span>
                      <input
                        type="text"
                        value={specTopic}
                        onChange={(e) => setSpecTopic(e.target.value)}
                        placeholder="E.g., clean energy proposal..."
                        className="bg-[#000000] border border-white/5 rounded px-2.5 py-1.5 font-mono text-[9px] text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-400/30 w-full"
                      />
                      <button
                        type="submit"
                        disabled={specLoading || !specTopic.trim()}
                        className="bg-cyan-400/10 border border-cyan-400/20 hover:border-cyan-400 hover:text-cyan-300 text-cyan-400 font-mono text-[9px] tracking-wider uppercase py-1.5 rounded transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Sparkles className="h-3 w-3" />
                        Compile Spec
                      </button>
                    </form>
                  </div>

                  {/* Main Code Editor View - 5 Cols */}
                  <div className="lg:col-span-5 flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                        Active Buffer: {activeFileName}
                      </span>
                      
                      <button
                        onClick={runCompiler}
                        className="bg-cyan-400 text-slate-950 font-mono text-[9px] tracking-widest uppercase font-bold px-3 py-1.5 rounded hover:bg-cyan-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="h-2.5 w-2.5 fill-slate-950" />
                        EXECUTE
                      </button>
                    </div>

                    <div className="flex-1 bg-[#000000] border border-white/5 rounded p-3 h-[240px] overflow-auto relative">
                      <textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-[10px] leading-relaxed text-slate-300"
                        style={{ tabSize: 4 }}
                      />
                    </div>
                  </div>

                  {/* Scrolling Diagnostics Terminal View - 4 Cols */}
                  <div className="lg:col-span-4 flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal className="h-3 w-3 text-cyan-400" />
                        TELEMETRY OUTPUT
                      </span>
                      <button 
                        onClick={clearTerminal} 
                        className="font-mono text-[8px] text-slate-600 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
                      >
                        RESET
                      </button>
                    </div>

                    <div className="flex-1 bg-[#000000] border border-white/5 rounded p-3.5 font-mono text-[9px] text-slate-500 leading-relaxed overflow-y-auto h-[240px] select-text">
                      <div className="flex flex-col gap-1.5">
                        {terminalLogs.map((log, idx) => (
                          <div 
                            key={idx}
                            className={
                              log.includes("[SUCCESS]") ? "text-emerald-400/90" : 
                              log.includes("[DEPLOY]") ? "text-cyan-400/90" : 
                              log.includes("[ERROR]") ? "text-rose-400/90" : 
                              log.includes("[WARNING]") ? "text-amber-400/90" : "text-slate-500"
                            }
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* 3. AUTOMATION LOGS (Emails & Tasks) */}
              {activePanel === "tasks_emails" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                  
                  {/* Left Column: Log Stream Selection (Filter / Navigation) - 3 Cols */}
                  <div className="lg:col-span-3 border-r border-white/5 pr-4 flex flex-col gap-4">
                    <div className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest mb-1">
                      LOGISTICS CHANNELS
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setActiveTab("tasks")}
                        className={`w-full text-left font-mono text-[10px] p-2.5 rounded transition-all duration-200 flex items-center justify-between cursor-pointer border ${
                          activeTab === "tasks" 
                            ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300 font-bold" 
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ListTodo className="h-3.5 w-3.5" />
                          MISSION LOGS
                        </span>
                        <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">
                          {tasks.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab("emails")}
                        className={`w-full text-left font-mono text-[10px] p-2.5 rounded transition-all duration-200 flex items-center justify-between cursor-pointer border ${
                          activeTab === "emails" 
                            ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300 font-bold" 
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          COMM TRANSMISSIONS
                        </span>
                        <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">
                          {isGmailMode 
                            ? contextGmailMessages.filter(m => !m.isRead).length 
                            : emails.filter(e => !e.isRead).length
                          }
                        </span>
                      </button>
                    </div>

                    {/* Quick Spam Scanner Utility */}
                    {activeTab === "emails" && (
                      <div className="border-t border-white/5 pt-4 mt-auto flex flex-col gap-2">
                        <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest block">MALWARE SCRUBBER</span>
                        <button
                          onClick={handleSpamScan}
                          disabled={scanningSpam}
                          className="bg-cyan-400/10 border border-cyan-400/20 hover:border-cyan-400 hover:text-cyan-300 text-cyan-400 font-mono text-[9px] tracking-wider uppercase py-2 rounded transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          <RefreshCw className={`h-3 w-3 ${scanningSpam ? "animate-spin" : ""}`} />
                          Scan Mail Gateways
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Middle Column & Right Column: Tabular Log telemetry - 9 Cols */}
                  <div className="lg:col-span-9 h-full">

                    {/* MISSION LOGS STREAM */}
                    {activeTab === "tasks" && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                        
                        {/* Tasks Task Creation / Queue list - 5 cols */}
                        <div className="md:col-span-5 flex flex-col gap-4 h-full border-r border-white/5 pr-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={toggleSelectAllTasks}
                                className="text-slate-600 hover:text-cyan-400 transition-colors"
                              >
                                {selectedTaskIds.length === activeTasks.length && activeTasks.length > 0 ? (
                                  <CheckSquare className="h-3 w-3" />
                                ) : (
                                  <Square className="h-3 w-3" />
                                )}
                              </button>
                              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">ACTIVE DIRECTIVES</span>
                            </div>
                            
                            {selectedTaskIds.length > 0 && (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={handleBulkArchive}
                                  title="Archive Selected"
                                  className="text-slate-600 hover:text-cyan-400 p-1 rounded transition-colors cursor-pointer"
                                >
                                  <Archive className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={handleBulkDelete}
                                  title="Delete Selected"
                                  className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Task Creator */}
                          <form onSubmit={handleTaskSubmit} className="flex flex-col gap-2 bg-[#000000] border border-white/5 p-2.5 rounded">
                            <input
                              type="text"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder="E.g., Repair telemetry system..."
                              className="bg-transparent border-b border-white/5 outline-none font-mono text-[9px] py-1 text-slate-300 placeholder-slate-700 focus:border-cyan-400/30 w-full"
                              required
                            />
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <input
                                type="text"
                                value={newTaskCategory}
                                onChange={(e) => setNewTaskCategory(e.target.value)}
                                placeholder="E.g., Core"
                                className="bg-transparent outline-none font-mono text-[8px] py-1 text-cyan-400 placeholder-slate-700 w-1/2"
                              />
                              <button
                                type="submit"
                                disabled={taskCreating || !newTaskTitle.trim()}
                                className="text-cyan-400 hover:text-white font-mono text-[8px] tracking-widest uppercase cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add
                              </button>
                            </div>
                          </form>

                          {/* Interactive list of active tasks */}
                          <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 flex flex-col gap-2">
                            {activeTasks.map((task) => (
                              <div 
                                key={task.id}
                                className={`flex items-center justify-between p-2 border rounded bg-[#000000]/40 group transition-all duration-300 ${
                                  selectedTaskIds.includes(task.id) ? "border-cyan-400/30" : "border-white/5 hover:border-cyan-400/10"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <button 
                                    onClick={() => toggleTaskSelection(task.id)}
                                    className="text-slate-600 hover:text-cyan-400 shrink-0"
                                  >
                                    {selectedTaskIds.includes(task.id) ? (
                                      <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
                                    ) : (
                                      <Square className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-[7px] font-mono uppercase tracking-widest text-cyan-400">{task.project}</span>
                                    <h4 className="font-mono text-[9px] font-medium text-slate-300 mt-1 truncate">{task.title}</h4>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[9px] text-slate-500 font-bold">{task.progress}%</span>
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sub-steps milestones breakdown stream - 7 cols */}
                        <div className="md:col-span-7 flex flex-col gap-4 overflow-y-auto max-h-[340px]">
                          <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">TACTICAL STEPS TELEMETRY</span>
                          
                          <div className="flex flex-col gap-3">
                            {activeTasks.length === 0 ? (
                              <div className="font-mono text-[9px] text-slate-600 italic">No operations queued, Sir.</div>
                            ) : (
                              activeTasks.map((task) => (
                                <div key={task.id} className="border-b border-white/5 pb-4 last:border-none">
                                  <span className="font-mono text-[8px] text-cyan-400/60 uppercase tracking-widest block mb-2">{task.title}</span>
                                  
                                  {task.loading ? (
                                    <div className="font-mono text-[9px] text-slate-500 animate-pulse flex items-center gap-1.5">
                                      <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                                      COMPILE SEQUENCING SCHEMAS...
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-2 pl-2">
                                      {task.steps.map((step, sIdx) => (
                                        <div 
                                          key={sIdx}
                                          onClick={() => toggleSubStep(task.id, sIdx)}
                                          className="flex items-start gap-2 cursor-pointer group"
                                        >
                                          <button className="text-cyan-400 mt-0.5 shrink-0">
                                            {step.completed ? (
                                              <CheckSquare className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400/10" />
                                            ) : (
                                              <Square className="h-3.5 w-3.5 text-slate-800 hover:text-cyan-400/50" />
                                            )}
                                          </button>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between text-[9px] font-mono">
                                              <span className={step.completed ? "text-slate-600 line-through" : "text-slate-300"}>{step.title}</span>
                                              <span className="text-[7px] text-slate-500">{step.estimatedMinutes}m</span>
                                            </div>
                                            <p className={`text-[8px] font-mono mt-0.5 ${step.completed ? "text-slate-700" : "text-slate-500"}`}>{step.description}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* COMMUNICATIONS / EMAIL GRID STREAM */}
                    {activeTab === "emails" && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                        
                        {/* Interactive message queue - 4 cols */}
                        <div className="md:col-span-4 flex flex-col gap-4 border-r border-white/5 pr-4 overflow-y-auto max-h-[340px]">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                              {isGmailMode ? "GMAIL INBOX STREAM" : "INCOMING STREAM"}
                            </span>
                            {isGmailMode && (
                              <button 
                                onClick={refreshWorkspaceData}
                                className="text-slate-600 hover:text-cyan-400 transition-colors"
                              >
                                <RefreshCw className={`h-2.5 w-2.5 ${isContextWorkspaceLoading ? "animate-spin" : ""}`} />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            {displayEmails.length === 0 ? (
                              <div className="font-mono text-[9px] text-slate-600 italic py-4 text-center border border-dashed border-white/5 rounded">
                                Buffer empty, Sir.
                              </div>
                            ) : displayEmails.map((email) => (
                              <button
                                key={email.id}
                                onClick={() => {
                                  setActiveEmailId(email.id);
                                  if (!isGmailMode) markEmailRead(email.id);
                                }}
                                className={`w-full text-left p-2.5 border rounded transition-all duration-200 flex flex-col gap-1 cursor-pointer ${
                                  activeEmailId === email.id 
                                    ? "border-cyan-400/20 bg-cyan-400/5" 
                                    : "border-white/5 bg-[#000000]/40 hover:border-white/10"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className={`font-mono text-[9px] truncate max-w-[120px] ${!email.isRead ? "text-cyan-400 font-bold" : "text-slate-300"}`}>
                                    {email.senderName}
                                  </span>
                                  <span className="font-mono text-[7px] text-slate-500">
                                    {isGmailMode ? (email as any).date : email.timestamp}
                                  </span>
                                </div>
                                <span className="font-mono text-[8px] text-slate-500 truncate w-full block uppercase tracking-wide">
                                  {email.subject}
                                </span>
                                {(email as any).isSpam && (
                                  <span className="text-[7px] font-mono text-rose-500/70 uppercase">
                                    [QUARANTINED]
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive mail reading & drafting view - 8 cols */}
                        <div className="md:col-span-8 flex flex-col gap-4 overflow-y-auto max-h-[340px]">
                          {activeEmail ? (
                            <div className="flex flex-col gap-3">
                              <div className="border-b border-white/5 pb-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[9px] text-cyan-400">
                                    {isGmailMode ? (activeEmail as any).senderEmail : (activeEmail as any).sender}
                                  </span>
                                  <button
                                    onClick={() => deleteEmail(activeEmail.id)}
                                    className="text-slate-600 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <h3 className="font-mono text-xs text-white uppercase tracking-wider mt-1">{activeEmail.subject}</h3>
                              </div>

                              <p className="font-mono text-[9px] text-slate-400 leading-relaxed whitespace-pre-line bg-[#000000] p-3 border border-white/5 rounded min-h-[100px]">
                                {activeEmail.body || (activeEmail as any).snippet}
                              </p>

                              {(activeEmail as any).isSpam && (
                                <div className="bg-rose-500/5 border border-rose-500/10 rounded p-2 flex items-start gap-2 font-mono text-[8px] text-rose-400">
                                  <AlertOctagon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <span>{(activeEmail as any).spamReason || "High risk spam signature detected."}</span>
                                </div>
                              )}

                              {/* AI Response drafting tools */}
                              <div className="border-t border-white/5 pt-3.5 mt-2 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">JEETVIS AUTO-RESPONDER</span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleGenerateReply("accept")}
                                      disabled={draftLoading}
                                      className="bg-cyan-400 text-slate-950 font-mono text-[8px] tracking-wider uppercase font-bold py-1 px-2.5 rounded transition-colors cursor-pointer disabled:opacity-40"
                                    >
                                      Accept Proposal
                                    </button>
                                    <button
                                      onClick={() => handleGenerateReply("refuse")}
                                      disabled={draftLoading}
                                      className="border border-white/10 text-slate-400 hover:text-white font-mono text-[8px] tracking-wider uppercase py-1 px-2.5 rounded transition-all cursor-pointer disabled:opacity-40"
                                    >
                                      Decline Polite
                                    </button>
                                    <button
                                      onClick={() => handleGenerateReply("summarize")}
                                      disabled={draftLoading}
                                      className="border border-white/10 text-emerald-400 hover:text-white font-mono text-[8px] tracking-wider uppercase py-1 px-2.5 rounded transition-all cursor-pointer disabled:opacity-40"
                                    >
                                      Summarize
                                    </button>
                                  </div>
                                </div>

                                {draftLoading ? (
                                  <div className="font-mono text-[8px] text-slate-500 animate-pulse flex items-center gap-1.5">
                                    <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                                    COMPILING REFINED DISPATCH DIRECTIVES...
                                  </div>
                                ) : activeEmail.aiDraft ? (
                                  <div className="flex flex-col gap-2 bg-[#000000] p-3 border border-cyan-400/10 rounded">
                                    <span className="font-mono text-[7px] text-cyan-400 uppercase tracking-widest block">PROPOSED REPLY STAMP</span>
                                    <p className="font-mono text-[9px] text-slate-300 leading-relaxed whitespace-pre-line">{activeEmail.aiDraft}</p>
                                    <button
                                      onClick={isGmailMode ? handleDispatchGmail : () => {
                                        alert("Dispatching transmission, Sir.");
                                        deleteEmail(activeEmail.id);
                                      }}
                                      className="self-end bg-cyan-400 text-slate-950 font-mono text-[8px] tracking-widest uppercase font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 mt-1 cursor-pointer"
                                    >
                                      <Send className="h-2.5 w-2.5" />
                                      DISPATCH
                                    </button>

                                    {suggestedFollowUps && suggestedFollowUps.length > 0 && (
                                      <div className="mt-3 border-t border-white/5 pt-3 flex flex-col gap-1.5">
                                        <span className="font-mono text-[7px] text-slate-500 uppercase tracking-widest block">Suggested Actions:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {suggestedFollowUps.map((q, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => {
                                                window.dispatchEvent(new CustomEvent("submit-command", { detail: q }));
                                              }}
                                              className={`font-mono text-[8px] px-2 py-0.5 rounded border bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer text-left ${
                                                isSimpleMode 
                                                  ? "border-emerald-500/20 text-emerald-300 hover:border-emerald-400/40" 
                                                  : "border-cyan-500/20 text-cyan-300 hover:border-cyan-400/40"
                                              }`}
                                            >
                                              {q}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="font-mono text-[8px] text-slate-600 italic">Select an response template above to synthesize dispatch coordinates.</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-20 bg-[#000000]/20 rounded border border-dashed border-white/5">
                              <Mail className="h-8 w-8 text-slate-800 mb-2" />
                              <div className="font-mono text-[9px] text-slate-600 italic uppercase tracking-widest">No communication selected, Sir.</div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* 4. GOOGLE WORKSPACE CONNECTOR */}
              {activePanel === "workspace" && (
                <div className="flex flex-col gap-4 h-full">
                  {/* Top: Workspace Sub-tabs selector */}
                  {!needsWorkspaceAuth && (
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <button
                        onClick={() => setWorkspaceSubTab("drive")}
                        className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          workspaceSubTab === "drive"
                            ? "bg-cyan-500/10 border border-cyan-400/25 text-cyan-400"
                            : "border border-white/5 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <FileText className="h-3 w-3" />
                        Files (Drive)
                      </button>
                      <button
                        onClick={() => setWorkspaceSubTab("gmail")}
                        className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          workspaceSubTab === "gmail"
                            ? "bg-cyan-500/10 border border-cyan-400/25 text-cyan-400"
                            : "border border-white/5 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <Mail className="h-3 w-3" />
                        Gmail Mailbox
                      </button>
                      <button
                        onClick={() => setWorkspaceSubTab("calendar")}
                        className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          workspaceSubTab === "calendar"
                            ? "bg-cyan-500/10 border border-cyan-400/25 text-cyan-400"
                            : "border border-white/5 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        Calendar
                      </button>
                      <button
                        onClick={() => setWorkspaceSubTab("classroom")}
                        className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          workspaceSubTab === "classroom"
                            ? "bg-cyan-500/10 border border-cyan-400/25 text-cyan-400"
                            : "border border-white/5 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <BookOpen className="h-3 w-3" />
                        Classroom
                      </button>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                    {/* Left Column: Shared Connection Status / Controls */}
                    <div className="lg:col-span-4 border-r border-white/5 pr-4 flex flex-col gap-4 overflow-y-auto max-h-[340px]">
                      <div className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        WORKSPACE CONNECTORS
                      </div>

                      {needsWorkspaceAuth ? (
                        <div className="flex flex-col gap-4 bg-[#020202] border border-white/5 rounded p-5 my-auto text-center items-center">
                          <Sparkles className="h-8 w-8 text-cyan-400 mb-2 animate-bounce" />
                          <div>
                            <h4 className="font-mono text-xs text-white uppercase tracking-wider">Secure Workspace Link</h4>
                            <p className="font-mono text-[8px] text-slate-500 mt-2 leading-relaxed">
                              Connect your Google Drive, Gmail mailbox, Google Calendar, and Google Classroom courses.
                            </p>
                          </div>

                          <button 
                            onClick={handleWorkspaceLogin}
                            disabled={isWorkspaceLoading}
                            className="gsi-material-button w-full flex items-center justify-center gap-2 border border-white/10 hover:border-cyan-400/40 bg-black py-2.5 rounded text-white font-mono text-[9px] uppercase tracking-wider cursor-pointer transition-all duration-300 disabled:opacity-50"
                          >
                            <div className="gsi-material-button-content-wrapper flex items-center gap-2">
                              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-3.5 w-3.5 block">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                              </svg>
                              <span className="gsi-material-button-contents">{isWorkspaceLoading ? "Linking..." : "Authorize Google Link"}</span>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {/* User Identity Banner */}
                          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded">
                            <div className="flex items-center gap-2">
                              {workspaceUser?.photoURL ? (
                                <img src={workspaceUser.photoURL} alt="Profile" className="h-5 w-5 rounded-full border border-emerald-400/30" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center font-mono text-[9px] text-emerald-400">J</div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-mono text-[9px] text-emerald-400 font-bold leading-none">{workspaceUser?.displayName || "Sir"}</span>
                                <span className="font-mono text-[7px] text-slate-500 mt-0.5">{workspaceUser?.email}</span>
                              </div>
                            </div>
                            <button 
                              onClick={handleWorkspaceLogout}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                              title="Disconnect Session"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Render Sub-tab Specific Left Column Controls */}
                          {workspaceSubTab === "drive" && (
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col gap-2 bg-[#000] p-2.5 border border-white/5 rounded">
                                <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
                                  <Search className="h-3.5 w-3.5 text-slate-500" />
                                  <input
                                    type="text"
                                    value={fileSearch}
                                    onChange={(e) => setFileSearch(e.target.value)}
                                    placeholder="Search G-Drive metadata..."
                                    className="bg-transparent border-none outline-none font-mono text-[9px] py-1 text-slate-300 placeholder-slate-700 w-full"
                                  />
                                </div>
                                <div className="grid grid-cols-4 gap-1 mt-1">
                                  {(["all", "doc", "sheet", "slide"] as const).map((filter) => (
                                    <button
                                      key={filter}
                                      onClick={() => setFileFilter(filter)}
                                      className={`py-1 rounded text-[8px] font-mono uppercase tracking-wider text-center transition-all cursor-pointer ${
                                        fileFilter === filter
                                          ? "bg-cyan-500/10 border border-cyan-400/20 text-cyan-400"
                                          : "border border-transparent text-slate-500 hover:text-slate-300"
                                      }`}
                                    >
                                      {filter}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => loadWorkspaceFiles()}
                                disabled={isWorkspaceLoading}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded font-mono text-[8px] text-slate-300 uppercase tracking-widest cursor-pointer disabled:opacity-40"
                              >
                                <RefreshCw className={`h-3 w-3 ${isWorkspaceLoading ? "animate-spin" : ""}`} />
                                Reload Drive
                              </button>
                            </div>
                          )}

                          {workspaceSubTab === "gmail" && (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  setShowCompose(true);
                                  setSelectedGmail(null);
                                }}
                                className="w-full bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold tracking-widest uppercase py-2 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Compose Dispatch
                              </button>
                              <div className="flex items-center gap-2 bg-[#000] p-2.5 border border-white/5 rounded">
                                <Search className="h-3.5 w-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  value={gmailSearch}
                                  onChange={(e) => setGmailSearch(e.target.value)}
                                  placeholder="Filter mailbox..."
                                  className="bg-transparent border-none outline-none font-mono text-[9px] py-1 text-slate-300 placeholder-slate-700 w-full"
                                />
                              </div>
                              <button
                                onClick={() => loadGmailMessages()}
                                disabled={isWorkspaceLoading}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded font-mono text-[8px] text-slate-300 uppercase tracking-widest cursor-pointer disabled:opacity-40"
                              >
                                <RefreshCw className={`h-3 w-3 ${isWorkspaceLoading ? "animate-spin" : ""}`} />
                                Sync Mailbox
                              </button>
                            </div>
                          )}

                          {workspaceSubTab === "calendar" && (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setShowAddEvent(true)}
                                className="w-full bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold tracking-widest uppercase py-2 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Schedule Slot
                              </button>
                              <button
                                onClick={() => loadCalendarEvents()}
                                disabled={isWorkspaceLoading}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded font-mono text-[8px] text-slate-300 uppercase tracking-widest cursor-pointer disabled:opacity-40"
                              >
                                <RefreshCw className={`h-3 w-3 ${isWorkspaceLoading ? "animate-spin" : ""}`} />
                                Reload Agenda
                              </button>
                            </div>
                          )}

                          {workspaceSubTab === "classroom" && (
                            <div className="flex flex-col gap-2">
                              <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block mt-1">My ACTIVE Courses</span>
                              {isWorkspaceLoading ? (
                                <span className="font-mono text-[8px] text-slate-600 italic">Syncing Course Stream...</span>
                              ) : classroomCourses.length === 0 ? (
                                <span className="font-mono text-[8px] text-slate-600 italic">No Class courses found.</span>
                              ) : (
                                <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                                  {classroomCourses.map((course) => (
                                    <button
                                      key={course.id}
                                      onClick={() => {
                                        setSelectedCourse(course);
                                        loadCourseDetails(workspaceToken!, course.id);
                                      }}
                                      className={`w-full text-left p-2 border rounded font-mono text-[9px] transition-all cursor-pointer ${
                                        selectedCourse?.id === course.id
                                          ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300"
                                          : "border-white/5 bg-black/40 text-slate-400 hover:border-white/10"
                                      }`}
                                    >
                                      <div className="truncate font-bold">{course.name}</div>
                                      <div className="text-[7.5px] text-slate-500 truncate mt-0.5">{course.section || "Active Section"}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => loadClassroomCourses()}
                                disabled={isWorkspaceLoading}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded font-mono text-[8px] text-slate-300 uppercase tracking-widest cursor-pointer disabled:opacity-40"
                              >
                                <RefreshCw className={`h-3 w-3 ${isWorkspaceLoading ? "animate-spin" : ""}`} />
                                Reload Classroom
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle Column: List Data View */}
                    <div className="lg:col-span-4 border-r border-white/5 pr-4 flex flex-col gap-3 overflow-y-auto max-h-[340px]">
                      {needsWorkspaceAuth ? (
                        <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">
                          Secure link required to visualize workspace stream.
                        </div>
                      ) : (
                        <>
                          {workspaceSubTab === "drive" && (
                            <>
                              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                <span>METADATA INDEX</span>
                                <span className="text-slate-600 text-[8px]">{driveFiles.length} files</span>
                              </span>
                              {isWorkspaceLoading ? (
                                <div className="font-mono text-[9px] text-slate-500 animate-pulse flex flex-col items-center justify-center gap-3 my-auto py-10">
                                  <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                                  SYNCHRONIZING SECURE METADATA...
                                </div>
                              ) : driveFiles.length === 0 ? (
                                <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">No G-Drive files found.</div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {driveFiles
                                    .filter((file) => {
                                      if (fileSearch && !file.name.toLowerCase().includes(fileSearch.toLowerCase())) return false;
                                      if (fileFilter === "doc" && !file.mimeType.includes("document")) return false;
                                      if (fileFilter === "sheet" && !file.mimeType.includes("spreadsheet")) return false;
                                      if (fileFilter === "slide" && !file.mimeType.includes("presentation")) return false;
                                      return true;
                                    })
                                    .map((file) => {
                                      const isSelected = selectedFile?.id === file.id;
                                      return (
                                        <button
                                          key={file.id}
                                          onClick={() => setSelectedFile(file)}
                                          className={`w-full text-left p-2.5 border rounded transition-all duration-200 flex items-start gap-2.5 cursor-pointer ${
                                            isSelected
                                              ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300 font-bold"
                                              : "border-white/5 bg-[#000000]/40 hover:border-white/10 text-slate-400 hover:text-slate-300"
                                          }`}
                                        >
                                          {file.mimeType.includes("document") && <FileText className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />}
                                          {file.mimeType.includes("spreadsheet") && <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />}
                                          {file.mimeType.includes("presentation") && <Presentation className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />}
                                          <div className="flex-1 min-w-0">
                                            <span className="font-mono text-[9.5px] truncate block leading-tight">{file.name}</span>
                                            <span className="font-mono text-[7px] text-slate-500 block mt-0.5">{new Date(file.modifiedTime).toLocaleDateString()}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                </div>
                              )}
                            </>
                          )}

                          {workspaceSubTab === "gmail" && (
                            <>
                              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                <span>INBOX STREAM</span>
                                <span className="text-slate-600 text-[8px]">{gmailMessages.length} messages</span>
                              </span>
                              {isWorkspaceLoading ? (
                                <div className="font-mono text-[9px] text-slate-500 animate-pulse flex flex-col items-center justify-center gap-3 my-auto py-10">
                                  <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                                  SYNCING SMTP DIRECTIVES...
                                </div>
                              ) : gmailMessages.length === 0 ? (
                                <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">No Gmail transmissions received.</div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {gmailMessages
                                    .filter((msg) => {
                                      if (gmailSearch && !msg.subject.toLowerCase().includes(gmailSearch.toLowerCase()) && !msg.senderName.toLowerCase().includes(gmailSearch.toLowerCase())) {
                                        return false;
                                      }
                                      return true;
                                    })
                                    .map((msg) => {
                                      const isSelected = selectedGmail?.id === msg.id;
                                      return (
                                        <button
                                          key={msg.id}
                                          onClick={() => {
                                            setSelectedGmail(msg);
                                            setShowCompose(false);
                                          }}
                                          className={`w-full text-left p-2.5 border rounded transition-all duration-200 flex flex-col gap-1 cursor-pointer ${
                                            isSelected
                                              ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300"
                                              : "border-white/5 bg-black/40 hover:border-white/10 text-slate-400 hover:text-slate-300"
                                          }`}
                                        >
                                          <div className="flex justify-between w-full font-mono text-[9px]">
                                            <span className={!msg.isRead ? "text-cyan-400 font-bold" : "text-slate-300"}>{msg.senderName}</span>
                                            <span className="text-slate-500 text-[7px]">{msg.date}</span>
                                          </div>
                                          <span className="font-mono text-[8px] text-slate-400 truncate w-full block uppercase tracking-wide">{msg.subject}</span>
                                          <span className="font-mono text-[7.5px] text-slate-500 truncate w-full block mt-0.5">{msg.snippet}</span>
                                        </button>
                                      );
                                    })}
                                </div>
                              )}
                            </>
                          )}

                          {workspaceSubTab === "calendar" && (
                            <>
                              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">ORBITAL MARKERS</span>
                              {isWorkspaceLoading ? (
                                <div className="font-mono text-[9px] text-slate-500 animate-pulse flex flex-col items-center justify-center gap-3 my-auto py-10">
                                  <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                                  FETCHING ORBITAL COORDINATES...
                                </div>
                              ) : calendarEvents.length === 0 ? (
                                <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">No scheduling triggers locked.</div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {calendarEvents.map((ev) => {
                                    const eventDate = new Date(ev.start);
                                    return (
                                      <div key={ev.id} className="p-2.5 border border-white/5 bg-black/40 rounded flex items-start gap-2.5 font-mono text-[9px]">
                                        <Clock className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-white font-bold truncate">{ev.summary}</div>
                                          <div className="text-slate-500 text-[7px] mt-0.5">
                                            {eventDate.toLocaleString()}
                                          </div>
                                          {ev.location && <div className="text-slate-600 text-[7px] truncate mt-0.5">LOC: {ev.location}</div>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}

                          {workspaceSubTab === "classroom" && (
                            <>
                              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">COURSEWORK QUEUE</span>
                              {isCourseDetailsLoading ? (
                                <div className="font-mono text-[9px] text-slate-500 animate-pulse flex items-center justify-center gap-1.5 py-8">
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                                  PARSING ACADEMIC SYLLABI...
                                </div>
                              ) : !selectedCourse ? (
                                <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">No Course Selected.</div>
                              ) : coursework.length === 0 ? (
                                <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">No assignments declared for this stream.</div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {coursework.map((cwItem) => (
                                    <div key={cwItem.id} className="p-2.5 border border-cyan-400/5 bg-black/40 rounded flex flex-col gap-1.5 font-mono text-[9px]">
                                      <div className="flex justify-between items-start gap-2">
                                        <span className="text-white font-bold leading-tight">{cwItem.title}</span>
                                        {cwItem.maxPoints && <span className="text-cyan-400 text-[7px] shrink-0 border border-cyan-400/20 px-1 rounded">{cwItem.maxPoints} PTS</span>}
                                      </div>
                                      {cwItem.description && <p className="text-[8px] text-slate-500 leading-relaxed max-h-[60px] overflow-y-auto">{cwItem.description}</p>}
                                      <div className="flex justify-between text-[7px] text-slate-600 border-t border-white/5 pt-1 mt-1 font-mono">
                                        <span>DUE: {cwItem.dueDate ? `${cwItem.dueDate.month}/${cwItem.dueDate.day}/${cwItem.dueDate.year}` : "NONE"}</span>
                                        <a href={cwItem.alternateLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">SUBMIT ↗</a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Right Column: Detailed Inspector / Actions */}
                    <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[340px]">
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">RESOURCE CONSOLE</span>
                      {needsWorkspaceAuth ? (
                        <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">Secure link required to perform actions.</div>
                      ) : (
                        <>
                          {workspaceSubTab === "drive" && (
                            selectedFile ? (
                              <div className="flex flex-col gap-4 h-full">
                                <div className="bg-[#000] border border-white/5 rounded p-4 flex flex-col gap-3">
                                  <div className="flex items-start gap-3 border-b border-white/5 pb-3">
                                    {selectedFile.mimeType.includes("document") && <FileText className="h-7 w-7 text-blue-400 shrink-0" />}
                                    {selectedFile.mimeType.includes("spreadsheet") && <FileSpreadsheet className="h-7 w-7 text-emerald-400 shrink-0" />}
                                    {selectedFile.mimeType.includes("presentation") && <Presentation className="h-7 w-7 text-amber-500 shrink-0" />}
                                    <div className="min-w-0">
                                      <h4 className="font-mono text-[11px] font-bold text-white uppercase tracking-wider break-words leading-tight">{selectedFile.name}</h4>
                                      <p className="font-mono text-[8px] text-slate-500 mt-1 uppercase tracking-wide">ID: {selectedFile.id}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 font-mono text-[8px] text-slate-400">
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">MIME-TYPE:</span>
                                      <span className="truncate max-w-[180px]">{selectedFile.mimeType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">LAST MODIFIED:</span>
                                      <span>{new Date(selectedFile.modifiedTime).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 mt-auto">
                                  <button
                                    onClick={handleImportFileToEditor}
                                    disabled={importingContent || !workspaceToken}
                                    className="w-full bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold tracking-widest uppercase py-3 rounded hover:bg-cyan-300 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                                  >
                                    <Download className={`h-3.5 w-3.5 ${importingContent ? "animate-bounce" : ""}`} />
                                    {importingContent ? importStatus : "Import into Sandbox"}
                                  </button>
                                  <a
                                    href={selectedFile.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full border border-white/10 hover:border-white/20 bg-[#000]/40 text-slate-300 hover:text-white font-mono text-[9px] font-bold tracking-widest uppercase py-2.5 rounded transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-center"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Open in Google Drive
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">Select G-Drive file to ingest.</div>
                            )
                          )}

                          {workspaceSubTab === "gmail" && (
                            showCompose ? (
                              <form onSubmit={handleSendGmail} className="flex flex-col gap-3 font-mono text-[9px]">
                                <span className="font-mono text-[8px] text-cyan-400 uppercase tracking-wider block">Compose Secure Mail</span>
                                <input
                                  type="email"
                                  placeholder="Recipient (To)"
                                  value={composeTo}
                                  onChange={(e) => setComposeTo(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="Subject"
                                  value={composeSubject}
                                  onChange={(e) => setComposeSubject(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                                  required
                                />
                                <textarea
                                  placeholder="Type secure payload..."
                                  value={composeBody}
                                  onChange={(e) => setComposeBody(e.target.value)}
                                  rows={5}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 resize-none"
                                  required
                                />
                                <button
                                  type="submit"
                                  disabled={isSendingMail}
                                  className="w-full bg-cyan-400 text-slate-950 py-2.5 rounded text-[9px] font-bold tracking-widest uppercase cursor-pointer transition-all disabled:opacity-40"
                                >
                                  {isSendingMail ? "Transmitting..." : "Send Mail Dispatch"}
                                </button>
                              </form>
                            ) : selectedGmail ? (
                              <div className="flex flex-col gap-3 font-mono text-[9px]">
                                <div className="border-b border-white/5 pb-2">
                                  <div className="text-cyan-400 font-bold truncate">FROM: {selectedGmail.senderName}</div>
                                  <div className="text-slate-500 text-[8px] truncate mt-0.5">{selectedGmail.senderEmail}</div>
                                  <h4 className="text-white text-[10px] font-bold uppercase tracking-wider mt-1.5 break-words">{selectedGmail.subject}</h4>
                                </div>
                                <div className="bg-black/40 border border-white/5 p-3 rounded text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto whitespace-pre-line">
                                  {selectedGmail.body}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setComposeTo(selectedGmail.senderEmail);
                                      setComposeSubject(`Re: ${selectedGmail.subject}`);
                                      setComposeBody(`\n\nOn ${selectedGmail.date}, ${selectedGmail.senderName} wrote:\n> ${selectedGmail.snippet}`);
                                      setShowCompose(true);
                                    }}
                                    className="flex-1 bg-cyan-400 text-slate-950 py-2 rounded text-[8px] font-bold tracking-widest uppercase transition-all cursor-pointer text-center"
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">Select email stream to view or compose.</div>
                            )
                          )}

                          {workspaceSubTab === "calendar" && (
                            showAddEvent ? (
                              <form onSubmit={handleCreateEvent} className="flex flex-col gap-3 font-mono text-[9px]">
                                <span className="font-mono text-[8px] text-cyan-400 uppercase tracking-wider block">Schedule New Slot</span>
                                <input
                                  type="text"
                                  placeholder="Slot Title"
                                  value={eventSummary}
                                  onChange={(e) => setEventSummary(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="Description / Context"
                                  value={eventDescription}
                                  onChange={(e) => setEventDescription(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                                />
                                <div className="flex flex-col gap-1">
                                  <label className="text-slate-500 text-[7px] uppercase">Start Coordinate</label>
                                  <input
                                    type="datetime-local"
                                    value={eventStart}
                                    onChange={(e) => setEventStart(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                                    required
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-slate-500 text-[7px] uppercase">End Coordinate</label>
                                  <input
                                    type="datetime-local"
                                    value={eventEnd}
                                    onChange={(e) => setEventEnd(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                                    required
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowAddEvent(false)}
                                    className="flex-1 border border-white/10 text-slate-400 py-2 rounded uppercase tracking-wider text-center cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isCreatingEvent}
                                    className="flex-1 bg-cyan-400 text-slate-950 py-2 rounded font-bold uppercase tracking-wider text-center cursor-pointer disabled:opacity-40"
                                  >
                                    {isCreatingEvent ? "Syncing..." : "Lock Slot"}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="font-mono text-[9px] bg-black/40 border border-white/5 p-4 rounded text-center my-auto flex flex-col items-center gap-3">
                                <Calendar className="h-8 w-8 text-cyan-400 animate-pulse" />
                                <div className="text-white uppercase font-bold tracking-wider">Orbital Sync Engine</div>
                                <p className="text-[8px] text-slate-500 leading-relaxed">
                                  View upcoming slots directly synced from your primary Google Calendar or create slots in real time.
                                </p>
                              </div>
                            )
                          )}

                          {workspaceSubTab === "classroom" && (
                            selectedCourse ? (
                              <div className="flex flex-col gap-3 font-mono text-[9px]">
                                <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block">ANNOUNCEMENTS FEED</span>
                                {isCourseDetailsLoading ? (
                                  <span className="text-slate-600 italic">Syncing classroom feed...</span>
                                ) : announcements.length === 0 ? (
                                  <span className="text-slate-600 italic">No public notices found.</span>
                                ) : (
                                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                                    {announcements.map((annItem) => (
                                      <div key={annItem.id} className="p-2 border border-white/5 bg-black/40 rounded flex flex-col gap-1">
                                        <p className="text-slate-300 text-[8px] leading-relaxed whitespace-pre-line">{annItem.text}</p>
                                        <div className="flex justify-between text-[7px] text-slate-600 mt-1">
                                          <span>POSTED: {new Date(annItem.creationTime).toLocaleDateString()}</span>
                                          <a href={annItem.alternateLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Link ↗</a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="font-mono text-[9px] text-slate-600 italic my-auto text-center">Select active course to stream educational updates.</div>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MEMORY REPOSITORY SYSTEM */}
              {activePanel === "memory" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-white">
                  {/* Left Column: Log New Memory / Preference - 5 Cols */}
                  <div className="lg:col-span-5 flex flex-col gap-4 lg:border-r border-white/5 lg:pr-6">
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-2">
                        <Brain className="h-4 w-4 animate-pulse" />
                        Log Core Directive
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-1 leading-relaxed">
                        Manually insert preference nodes or facts into JEETVIS's synaptic memory core.
                      </p>
                    </div>

                    <form onSubmit={handleManualMemorySubmit} className="flex flex-col gap-4">
                      {/* Memory Content */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] text-slate-400 uppercase tracking-wider">synaptic instruction</label>
                        <textarea
                          value={manualMemoryText}
                          onChange={(e) => setManualMemoryText(e.target.value)}
                          placeholder="E.g., Sir prefers clean Python docstrings and dark mode accents..."
                          rows={3}
                          className="w-full bg-[#000]/40 border border-white/10 rounded p-3 font-mono text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 resize-none transition-colors"
                          required
                        />
                      </div>

                      {/* Category Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] text-slate-400 uppercase tracking-wider">Classification</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "user_preference", label: "PREFERENCE" },
                            { id: "interaction_fact", label: "FACT NODE" },
                            { id: "code_snippet", label: "CODE SNIPPET" },
                            { id: "custom_note", label: "CUSTOM NOTE" }
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setManualMemoryCat(cat.id as any)}
                              className={`py-1.5 px-2 border rounded font-mono text-[8px] tracking-wider transition-all duration-300 cursor-pointer ${
                                manualMemoryCat === cat.id
                                  ? "border-cyan-400 text-cyan-400 bg-cyan-500/5 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                                  : "border-white/5 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Importance Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[8px] text-slate-400 uppercase tracking-wider">synaptic priority</label>
                        <div className="flex gap-2">
                          {[
                            { id: "low", label: "LOW" },
                            { id: "medium", label: "MEDIUM" },
                            { id: "high", label: "CRITICAL" }
                          ].map((imp) => (
                            <button
                              key={imp.id}
                              type="button"
                              onClick={() => setManualMemoryImp(imp.id as any)}
                              className={`flex-1 py-1.5 px-2 border rounded font-mono text-[8px] tracking-wider transition-all duration-300 cursor-pointer ${
                                manualMemoryImp === imp.id
                                  ? imp.id === "high"
                                    ? "border-red-500 text-red-400 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.1)] font-bold"
                                    : imp.id === "medium"
                                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                                    : "border-slate-500 text-slate-300 bg-slate-500/5"
                                  : "border-white/5 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {imp.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Log Action Button */}
                      <button
                        type="submit"
                        className="w-full bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold tracking-widest uppercase py-3 rounded hover:bg-cyan-300 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Log into Memory Core
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Memories/Chat Viewer - 7 Cols */}
                  <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setMemorySubTab("entries")}
                          className={`font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer ${memorySubTab === "entries" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"}`}
                        >
                          SYNASE STREAM // {memories.length} ENTRIES
                        </button>
                        <button 
                          onClick={() => setMemorySubTab("chat")}
                          className={`font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer ${memorySubTab === "chat" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"}`}
                        >
                          NEURAL CHAT LOGS // {chatHistory.length} MESSAGES
                        </button>
                      </div>
                      {(isSyncingMemories || isSyncingChat) && (
                        <span className="font-mono text-[8px] text-cyan-400 animate-pulse flex items-center gap-1.5 uppercase">
                          <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Synchronizing...
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[340px] pr-2 flex flex-col gap-2.5">
                      {memorySubTab === "entries" ? (
                        memories.length === 0 ? (
                          <div className="font-mono text-[9px] text-slate-600 italic text-center py-12">
                            No memory blocks registered in quantum buffer. Speak or write directives to initialize.
                          </div>
                        ) : (
                          memories.map((m) => (
                            <div
                              key={m.id}
                              className="bg-[#000]/30 border border-white/5 rounded-lg p-3.5 flex flex-col gap-2 relative group hover:border-cyan-500/20 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between font-mono text-[8px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-cyan-400 uppercase tracking-wider bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-400/10">
                                    {m.category.replace("_", " ")}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded border ${
                                    m.importance === "high"
                                      ? "text-red-400 bg-red-500/5 border-red-500/20 font-bold"
                                      : m.importance === "medium"
                                      ? "text-cyan-400 bg-cyan-500/5 border-cyan-400/15"
                                      : "text-slate-400 bg-slate-500/5 border-slate-500/20"
                                  } uppercase tracking-wide`}>
                                    {m.importance === "high" ? "Critical" : m.importance}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-600">{new Date(m.timestamp).toLocaleDateString()}</span>
                                  <button
                                    onClick={() => deleteMemory(m.id)}
                                    className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-200 font-mono text-[10px] leading-relaxed">
                                {m.content}
                              </p>
                            </div>
                          ))
                        )
                      ) : (
                        chatHistory.length === 0 ? (
                          <div className="font-mono text-[9px] text-slate-600 italic text-center py-12">
                            No neural interaction history recorded. Initialize the link to record logs.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {chatHistory.map((chat) => (
                              <div key={chat.id} className={`p-2 border rounded font-mono text-[8px] ${chat.role === "user" ? "border-cyan-500/10 bg-cyan-500/5 ml-4" : "border-white/5 bg-black/40 mr-4"}`}>
                                <div className="flex justify-between items-center mb-1 opacity-50">
                                  <span className="uppercase">{chat.role === "user" ? "User/Boss" : "JEETVIS"}</span>
                                  <span>{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-slate-300 leading-relaxed">{chat.content}</p>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVoiceInterface && (
          <VoiceInterface onClose={() => setShowVoiceInterface(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}
