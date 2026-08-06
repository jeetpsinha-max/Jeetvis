import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useJeetvis } from "../context/JeetvisContext";
import HolographicCore from "./HolographicCore";
import DriveExplorer from "./DriveExplorer";
import CloudMonitoring from "./CloudMonitoring";
import CodeSandbox from "./CodeSandbox";
import { 
  Clock, Code, Terminal, ListTodo, Mail, Play, Pause, RotateCcw, 
  RefreshCw, Trash2, CheckSquare, Square, Plus, Send, AlertOctagon,
  Sparkles, ShieldCheck, HardDrive, MessageSquare, Bot, User
} from "lucide-react";

export default function DashboardGrid({ mobileActiveView }: { mobileActiveView?: "directives" | "core" | "sandbox" | "telemetry" }) {
  const [ideView, setIdeView] = React.useState<"sandbox" | "editor" | "drive">("sandbox");
  const [telemetryTab, setTelemetryTab] = React.useState<"logs" | "cloud">("logs");
  const { 
    dashboardLayout, 
    reportActivity,
    pomodoroTime,
    pomodoroActive,
    pomodoroPaused,
    setPomodoroActive,
    setPomodoroPaused,
    setPomodoroTime,
    completedPomodoros,
    setCompletedPomodoros,
    pomodoroPreset,
    
    activeFileName,
    editorContent,
    setEditorContent,
    runCompiler,
    terminalLogs,
    clearTerminal,
    
    tasks,
    emails,
    activeTab,
    setActiveTab,
    addTask,
    toggleSubStep,
    deleteTask,
    markEmailRead,
    deleteEmail,
    generateDraft,
    sendGmailReply,
    gmailMessages,
    workspaceToken,
    isSimpleMode
  } = useJeetvis();

  // Sidebar Chat Terminal States
  const [sideChatInput, setSideChatInput] = React.useState("");
  const [sideChatMessages, setSideChatMessages] = React.useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "JEETVIS Code Terminal Online. Ask me anything, Boss." }
  ]);
  const [sideChatIsThinking, setSideChatIsThinking] = React.useState(false);
  const sideChatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    sideChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sideChatMessages, sideChatIsThinking]);

  const sendSideChatMessage = async () => {
    if (!sideChatInput.trim() || sideChatIsThinking) return;

    const userMessage = sideChatInput;
    setSideChatInput("");
    
    const newMessages = [
      ...sideChatMessages,
      { role: "user" as const, content: userMessage }
    ];
    setSideChatMessages(newMessages);
    setSideChatIsThinking(true);

    try {
      let finalMessagesForApi = [...newMessages];
      if (editorContent) {
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
          model: "gemini-3.5-flash",
          systemInstruction: "You are JEETVIS, a helpful British AI assistant. Address the user as Boss. Be direct, sleek, and provide quick answers with clean code blocks.",
          temperature: 0.5
        })
      });

      const data = await res.json();
      if (data.text) {
        setSideChatMessages(prev => [
          ...prev,
          { role: "assistant" as const, content: data.text }
        ]);
      } else {
        setSideChatMessages(prev => [
          ...prev,
          { role: "assistant" as const, content: "Error compiling response, Boss." }
        ]);
      }
    } catch (err) {
      setSideChatMessages(prev => [
        ...prev,
        { role: "assistant" as const, content: "Neural connection lost, Boss." }
      ]);
    } finally {
      setSideChatIsThinking(false);
    }
  };

  const [isRefactoring, setIsRefactoring] = React.useState(false);

  const handleAIRefactor = async () => {
    if (!editorContent.trim() || isRefactoring) return;
    setIsRefactoring(true);
    reportActivity("ide");
    try {
      const res = await fetch("/api/terminal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Optimize and refactor the following code. Make it cleaner, well-structured, more efficient, and fix any potential bugs. Return ONLY the raw refactored code without markdown containers, introductory text, or explanatory text. Just the code.\n\nCode:\n${editorContent}`
            }
          ],
          model: "gemini-3.5-flash",
          systemInstruction: "You are an elite code refactoring compiler. Return ONLY raw code, no formatting markdown or extra text.",
          temperature: 0.2
        })
      });
      const data = await res.json();
      if (data.text) {
        let cleanText = data.text.trim();
        if (cleanText.startsWith("```")) {
          const lines = cleanText.split("\n");
          if (lines[0].startsWith("```")) lines.shift();
          if (lines[lines.length - 1].endsWith("```")) lines.pop();
          cleanText = lines.join("\n");
        }
        setEditorContent(cleanText);
        reportActivity("ide");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefactoring(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Chat Terminal Component (replaces Timer)
  const ChatTerminalModule = () => (
    <motion.div 
      layout
      onMouseEnter={() => reportActivity("timer")}
      className="flex flex-col gap-3 p-4 bg-[#050505]/60 border border-white/5 rounded-2xl backdrop-blur-xl h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-h-[180px]"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono text-[9px] text-white uppercase tracking-widest font-bold">
            {isSimpleMode ? "Code Chatbot" : "Neural Terminal"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[7px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>STANDBY</span>
        </div>
      </div>

      {/* Terminal logs showing the chat messages */}
      <div className="flex-1 bg-black/45 rounded-lg border border-white/5 p-2.5 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-[100px] select-text">
        {sideChatMessages.map((msg, idx) => (
          <div key={idx} className="font-mono text-[8.5px] leading-relaxed">
            <span className={msg.role === "user" ? "text-cyan-400" : "text-emerald-400"}>
              {msg.role === "user" ? "$ commander: " : "> jeetvis: "}
            </span>
            <span className="text-slate-300">{msg.content}</span>
          </div>
        ))}
        {sideChatIsThinking && (
          <div className="font-mono text-[8.5px] text-cyan-400 animate-pulse flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            <span>&gt; compiling response...</span>
          </div>
        )}
        <div ref={sideChatEndRef} />
      </div>

      {/* Terminal prompt input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          sendSideChatMessage();
        }}
        className="flex items-center gap-2 bg-[#0d0d0d] border border-white/5 rounded-lg px-2 py-1.5"
      >
        <span className="font-mono text-[8px] text-cyan-400 select-none">$</span>
        <input
          type="text"
          value={sideChatInput}
          onChange={(e) => setSideChatInput(e.target.value)}
          placeholder="Ask JEETVIS anything..."
          disabled={sideChatIsThinking}
          className="flex-1 bg-transparent border-none outline-none font-mono text-[8.5px] text-slate-200 placeholder:text-slate-700 p-0 focus:ring-0 focus:ring-offset-0 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sideChatIsThinking || !sideChatInput.trim()}
          className="text-cyan-400 hover:text-cyan-300 disabled:opacity-30 cursor-pointer"
        >
          <Send className="h-3 w-3" />
        </button>
      </form>
    </motion.div>
  );

  // IDE Module
  const IDEModule = () => {
    if (ideView === "sandbox") {
      return <CodeSandbox ideView={ideView} setIdeView={setIdeView} />;
    }
    return (
      <motion.div 
        layout
        onMouseEnter={() => reportActivity("ide")}
        className="flex flex-col gap-4 p-5 bg-[#050505]/60 border border-white/5 rounded-2xl backdrop-blur-xl h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIdeView("sandbox")}
              className={`flex items-center gap-2 transition-all duration-300 ${ideView === "sandbox" ? "text-cyan-400" : "text-slate-600 hover:text-slate-400"}`}
            >
              <Code className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
                Code Lab
              </span>
            </button>
            <button 
              onClick={() => setIdeView("editor")}
              className={`flex items-center gap-2 transition-all duration-300 ${ideView === "editor" ? "text-cyan-400" : "text-slate-600 hover:text-slate-400"}`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
                Notepad
              </span>
            </button>
            <button 
              onClick={() => setIdeView("drive")}
              className={`flex items-center gap-2 transition-all duration-300 ${ideView === "drive" ? "text-cyan-400" : "text-slate-600 hover:text-slate-400"}`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
                {isSimpleMode ? "My Files" : "Drive"}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-slate-500 truncate max-w-[100px]">{activeFileName}</span>
            {ideView === "editor" && (
              <button 
                onClick={runCompiler}
                className="text-cyan-400 hover:text-cyan-300 p-1 cursor-pointer"
                title={isSimpleMode ? "Save and check Notepad contents" : "Run Compiler"}
              >
                <Play className="h-3 w-3 fill-current" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {ideView === "editor" ? (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="w-full h-full bg-black/40 rounded border border-white/5 p-3 relative flex flex-col justify-between"
              >
                <div className="flex-1 relative min-h-0">
                  <textarea
                    value={editorContent}
                    onChange={(e) => {
                      setEditorContent(e.target.value);
                      reportActivity("ide");
                    }}
                    className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-[10px] leading-relaxed text-slate-300 custom-scrollbar"
                    style={{ tabSize: 4 }}
                    placeholder="Type or paste code here, then use AI Optimize to refactor..."
                  />
                  <div className="absolute top-0 right-0 p-1 pointer-events-none opacity-25">
                    <div className="text-[7px] font-mono text-cyan-400 text-right">
                      LN: {editorContent.split("\n").length}<br/>
                      UTF-8
                    </div>
                  </div>
                </div>

                {/* Sleek, optimized actions panel */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2 font-mono text-[8.5px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleAIRefactor}
                      disabled={isRefactoring || !editorContent.trim()}
                      className="flex items-center gap-1 px-2 py-1 bg-cyan-400/10 hover:bg-cyan-400/25 text-cyan-400 disabled:opacity-35 border border-cyan-400/20 rounded transition-all cursor-pointer font-bold"
                    >
                      <Sparkles className={`h-2.5 w-2.5 ${isRefactoring ? "animate-spin" : ""}`} />
                      {isRefactoring ? "REFACTORING..." : "AI OPTIMIZE"}
                    </button>
                    
                    <button
                      onClick={() => {
                        const formatted = editorContent
                          .split("\n")
                          .map(line => line.trimEnd())
                          .join("\n");
                        setEditorContent(formatted);
                        reportActivity("ide");
                      }}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded transition-all cursor-pointer"
                    >
                      FORMAT
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(editorContent);
                        reportActivity("ide");
                      }}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded transition-all cursor-pointer"
                    >
                      COPY
                    </button>
                    <button
                      onClick={() => {
                        setEditorContent("");
                        reportActivity("ide");
                      }}
                      className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 rounded transition-all cursor-pointer font-bold"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="drive"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="w-full h-full"
              >
                <DriveExplorer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Automation Logs & Cloud Monitoring Module
  const LogsModule = () => (
    <motion.div 
      layout
      onMouseEnter={() => reportActivity("logs")}
      className="flex flex-col gap-4 p-5 bg-[#050505]/60 border border-white/5 rounded-2xl backdrop-blur-xl h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTelemetryTab("logs")}
            className={`flex items-center gap-2 transition-all duration-300 ${telemetryTab === "logs" ? "text-cyan-400" : "text-slate-600 hover:text-slate-400"}`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
              {isSimpleMode ? "System Activity" : "Telemetry"}
            </span>
          </button>
          <button 
            onClick={() => setTelemetryTab("cloud")}
            className={`flex items-center gap-2 transition-all duration-300 ${telemetryTab === "cloud" ? "text-cyan-400" : "text-slate-600 hover:text-slate-400"}`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
              Cloud Monitor
            </span>
          </button>
        </div>
        {telemetryTab === "logs" && (
          <button onClick={clearTerminal} className="text-[8px] font-mono text-slate-600 hover:text-slate-400 uppercase tracking-widest">Clear</button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {telemetryTab === "logs" ? (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              className="w-full h-full bg-black/40 rounded border border-white/5 p-3.5 font-mono text-[9px] text-slate-500 leading-relaxed overflow-y-auto custom-scrollbar"
            >
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
                    <span className="opacity-40 mr-2">{String(idx).padStart(3, "0")}</span>
                    {log}
                  </div>
                ))}
                {terminalLogs.length === 0 && (
                  <div className="text-slate-700 italic">
                    {isSimpleMode ? "No recent activities recorded. All systems running beautifully." : "Sir, the telemetry buffer is currently empty."}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="cloud"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="w-full h-full overflow-y-auto custom-scrollbar pr-1"
            >
              <CloudMonitoring />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // Communication / Tactical Module (Minimized version)
  const TacticalModule = () => {
    const [summary, setSummary] = React.useState<string>("");
    const [generating, setGenerating] = React.useState(false);

    const generateSummary = async () => {
      setGenerating(true);
      const taskData = tasks.map(t => `- ${t.title} (${t.completed ? 'Done' : 'Pending'})`).join('\n');
      
      try {
        const res = await fetch("/api/terminal/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Generate a concise, encouraging 'daily focus summary' for my day based on these tasks:\n\n${taskData}\n\nKeep it under 3 sentences, addressing me as Boss.` }],
            model: "gemini-3.5-flash",
            systemInstruction: "You are a concise, encouraging assistant.",
            temperature: 0.5
          })
        });
        const data = await res.json();
        setSummary(data.text || "Could not generate summary.");
      } catch (err) {
        setSummary("Error generating summary.");
      } finally {
        setGenerating(false);
      }
    };

    return (
    <motion.div 
      layout
      onMouseEnter={() => reportActivity("comm")}
      className="flex flex-col gap-4 p-5 bg-[#050505]/60 border border-white/5 rounded-2xl backdrop-blur-xl h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono text-[10px] text-white uppercase tracking-widest font-bold">
            {isSimpleMode ? "Task List" : "Directives"}
          </span>
        </div>
        <button 
            onClick={generateSummary}
            disabled={generating}
            className="flex items-center gap-1 text-[8px] font-mono text-cyan-400 hover:text-cyan-300 uppercase tracking-widest cursor-pointer disabled:opacity-50"
        >
            <Sparkles className={`h-2.5 w-2.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Compiling...' : 'Focus Summary'}
        </button>
      </div>

      {summary && (
        <div className="bg-cyan-950/20 border border-cyan-500/20 p-2 rounded text-[9px] text-cyan-100 font-mono italic leading-relaxed">
            {summary}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
        {tasks.filter(t => !t.isArchived).map(task => (
          <div key={task.id} className="p-2 border border-white/5 rounded bg-black/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px] font-mono text-cyan-400/60 uppercase">{task.project}</span>
              <span className="text-[8px] font-mono text-slate-500">{task.progress}%</span>
            </div>
            <h4 className="text-[9px] font-mono text-slate-300 truncate">{task.title}</h4>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-[9px] font-mono text-slate-600 italic py-4 text-center">
            {isSimpleMode ? "All tasks completed! Amazing job." : "No directives queued."}
          </div>
        )}
      </div>
    </motion.div>
  );
  };

  return (
    <div className="w-full h-full max-h-[85vh] py-4 sm:py-10 px-0 sm:px-6">
      <AnimatePresence mode="wait">
        <div className="grid grid-cols-12 gap-4 sm:gap-6 h-full items-center">
          
          {/* Left Column (3 units on large, switchable on mobile) */}
          <div className={`
            ${dashboardLayout === "focus" ? "hidden" : "col-span-12 lg:col-span-3"} 
            ${mobileActiveView === "directives" ? "flex" : "hidden sm:flex"} 
            flex-col gap-4 sm:gap-6 h-full py-2 sm:py-4
          `}>
            <div className="flex-[2] min-h-[150px] sm:min-h-[200px]">
              <TacticalModule />
            </div>
            <div className="flex-[1] min-h-[120px] sm:min-h-[150px]">
              <ChatTerminalModule />
            </div>
          </div>

          {/* Center Column (Always contains Core) */}
          <div className={`
            ${dashboardLayout === "developer" ? "col-span-12 lg:col-span-4" : 
              dashboardLayout === "focus" ? "col-span-12" : 
              "col-span-12 lg:col-span-6"} 
            ${mobileActiveView === "core" ? "flex" : "hidden sm:flex"} 
            justify-center items-center h-full relative py-4 lg:py-0
          `}>
             <AnimatePresence mode="popLayout">
                <motion.div 
                  layout
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="w-full h-full flex items-center justify-center min-h-[300px]"
                >
                   <HolographicCore />
                </motion.div>
             </AnimatePresence>
          </div>

          {/* Right Column (3 units on large, switchable on mobile) */}
          <div className={`
            ${dashboardLayout === "developer" ? "col-span-12 lg:col-span-5" : 
              dashboardLayout === "focus" ? "hidden" : 
              "col-span-12 lg:col-span-3"} 
            ${(mobileActiveView === "sandbox" || mobileActiveView === "telemetry") ? "flex" : "hidden sm:flex"} 
            flex-col gap-4 sm:gap-6 h-full py-2 sm:py-4
          `}>
            {dashboardLayout === "monitoring" || mobileActiveView === "telemetry" ? (
               <div className="flex-1 min-h-[200px]">
                  <LogsModule />
               </div>
            ) : (dashboardLayout === "developer" || mobileActiveView === "sandbox") ? (
               <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                  <div className={`flex-1 min-h-[250px] ${mobileActiveView === "sandbox" ? "block" : "hidden sm:block"}`}>
                    <IDEModule />
                  </div>
                  <div className="flex-1 min-h-[150px] hidden sm:block">
                    <LogsModule />
                  </div>
               </div>
            ) : (
               <>
                <div className="flex-[2] min-h-[200px]">
                  <IDEModule />
                </div>
                <div className="flex-[1] min-h-[150px]">
                  <LogsModule />
                </div>
               </>
            )}
          </div>

        </div>
      </AnimatePresence>
    </div>
  );
}
