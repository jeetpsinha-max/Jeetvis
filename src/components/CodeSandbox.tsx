import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useJeetvis } from "../context/JeetvisContext";
import { getAccessToken } from "../lib/workspaceAuth";
import { 
  Play, 
  Sparkles, 
  Terminal, 
  Code, 
  Cpu, 
  Database, 
  Thermometer, 
  Clock, 
  RefreshCw, 
  Download, 
  Layers, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  MessageSquare,
  HelpCircle,
  Maximize2,
  AlignLeft,
  Send,
  Bot,
  User
} from "lucide-react";

interface CodeTemplate {
  name: string;
  filename: string;
  language: "javascript" | "python" | "typescript" | "html";
  description: string;
  code: string;
}

const TEMPLATES: CodeTemplate[] = [
  {
    name: "Arc Reactor Calibration",
    filename: "arc_reactor_calibration.py",
    language: "python",
    description: "Thermal cooling loops and core power balancing equations.",
    code: `class ArcReactorCore:
    def __init__(self):
        self.power_output_tw = 120.5  # Terawatts
        self.coolant_pressure_psi = 1450.0
        self.core_temperature_k = 1240.0
        self.stabilizer_efficiency = 0.982
        
    def calibrate_sectors(self):
        print("[JEETVIS] Initiating sector check...")
        print(f"Current core thermal signature: {self.core_temperature_k} K")
        
        sectors = ["Alpha", "Beta", "Gamma", "Delta"]
        for sector in sectors:
            temp_offset = (self.core_temperature_k - 1000) * 0.12
            print(f" -> Checking Sector {sector}... Integrity: 100% | Offset: {temp_offset:.1f} K")
            
        print("[SUCCESS] Magnetic confinement buffers aligned.")
        self.core_temperature_k -= 140.0
        self.stabilizer_efficiency = 0.998
        print(f"Updated power resonance efficiency: {self.stabilizer_efficiency * 100:.2f}%")
        return "STABLE"

# Execute calibration array
reactor = ArcReactorCore()
reactor.calibrate_sectors()
`
  },
  {
    name: "Holographic Matrix Wave",
    filename: "hologram_visualizer.html",
    language: "html",
    description: "An interactive HTML/CSS visualizer depicting glowing plasma waves.",
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #020205;
      color: #22d3ee;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      overflow: hidden;
    }
    .orb {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0) 70%);
      border: 1px solid rgba(34, 211, 238, 0.4);
      position: relative;
      animation: pulse 3s ease-in-out infinite;
      box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
    }
    .ring {
      position: absolute;
      border: 1px dashed rgba(34, 211, 238, 0.2);
      border-radius: 50%;
      top: -10px; left: -10px; right: -10px; bottom: -10px;
      animation: rotate 6s linear infinite;
    }
    .status {
      margin-top: 20px;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      text-shadow: 0 0 5px rgba(34, 211, 238, 0.5);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 35px rgba(34, 211, 238, 0.6); }
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="orb">
    <div class="ring"></div>
  </div>
  <div class="status">Quantum Mainframe Connected</div>
  <script>
    console.log("Holographic matrix loaded, Sir. Syncing vector coordinates...");
    setInterval(() => {
      const level = (Math.random() * 5 + 95).toFixed(1);
      console.log(\`Matrix Sync Rate: \${level}%\`);
    }, 3000);
  </script>
</body>
</html>
`
  },
  {
    name: "Flight Vector Compilations",
    filename: "flight_vectors.ts",
    language: "typescript",
    description: "Computes repulsor stabilizer angles based on kinetic escape velocities.",
    code: `interface PropulsionVector {
  pitch: number;
  roll: number;
  yaw: number;
  thrustPct: number;
}

function computeEscapeVector(currentVelocity: number): PropulsionVector {
  console.log(\`[COMPUTATION] Calculating angles at \${currentVelocity} knots...\`);
  
  const escapeVelocityKnots = 21960; // Mach 33 escape velocity
  const deflectionNeeded = currentVelocity > escapeVelocityKnots ? 0.0 : Math.asin(currentVelocity / escapeVelocityKnots);
  
  return {
    pitch: parseFloat((deflectionNeeded * 57.2958).toFixed(2)),
    roll: 0.0,
    yaw: currentVelocity > 10000 ? -1.5 : 0.0,
    thrustPct: currentVelocity > escapeVelocityKnots ? 100.0 : 85.5
  };
}

const flightTelemetry = computeEscapeVector(14500);
console.log("[TELEMETRY] Optimal stabilization coordinates established:");
console.log(JSON.stringify(flightTelemetry, null, 2));
`
  },
  {
    name: "Vibranium Density Matrix",
    filename: "vibranium_matrix.js",
    language: "javascript",
    description: "Simulates molecular density distributions inside vibranium grids.",
    code: `// Vibranium Molecular Grid Simulation
function calculateDensityIntegrity(compressionRatio) {
  console.log("Sir, analyzing quantum vibranium grid cohesion...");
  
  const gridCells = 5;
  let totalStability = 0;
  
  for (let i = 1; i <= gridCells; i++) {
    // Cohesion is logarithmic relative to compression
    const nodeCohesion = Math.log(i * compressionRatio + 1) * 45.2;
    console.log(\`[GRID-NODE-\${i}] Density Vector: \${nodeCohesion.toFixed(2)}% Cohesive\`);
    totalStability += nodeCohesion;
  }
  
  const finalIntegrity = (totalStability / gridCells);
  console.log(\`[SUMMARY] Unified Grid Cohesion: \${finalIntegrity.toFixed(2)}%\`);
  return finalIntegrity;
}

calculateDensityIntegrity(1.85);
`
  }
];

/**
 * Lightweight formatting utility that cleans up indentation, excess blank lines,
 * and handles language-specific layout for JavaScript, TypeScript, HTML, and Python.
 */
export function formatCodeString(
  rawCode: string,
  lang: "javascript" | "python" | "typescript" | "html"
): string {
  if (!rawCode) return "";
  const lines = rawCode.split("\n");
  const formattedLines: string[] = [];
  let currentIndent = 0;
  const indentSize = lang === "python" ? 4 : 2;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      // Keep at most 1 consecutive empty line
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== "") {
        formattedLines.push("");
      }
      continue;
    }

    if (lang === "python") {
      // Preserve Python structural indent but clean up irregular spaces
      const leadingWhitespace = line.match(/^\s*/)?.[0] || "";
      let spaceCount = 0;
      for (const char of leadingWhitespace) {
        if (char === "\t") spaceCount += 4;
        else if (char === " ") spaceCount += 1;
      }
      const roundedIndent = Math.round(spaceCount / 4) * 4;
      formattedLines.push(" ".repeat(roundedIndent) + trimmed);
      continue;
    }

    if (lang === "html") {
      const startsWithClosing = trimmed.startsWith("</");
      if (startsWithClosing) {
        currentIndent = Math.max(0, currentIndent - 1);
      }

      formattedLines.push(" ".repeat(currentIndent * indentSize) + trimmed);

      // Simple tag indent tracking
      const hasOpeningTag = /<([a-zA-Z0-9:-]+)([^>]*[^/])?>/.test(trimmed);
      const hasClosingTag = /<\/([a-zA-Z0-9:-]+)>/.test(trimmed);
      const isSelfClosing = /<([a-zA-Z0-9:-]+)([^>]*)\/>/.test(trimmed) || 
                            trimmed.startsWith("<!") || 
                            trimmed.startsWith("<!--") || 
                            trimmed.startsWith("<meta") || 
                            trimmed.startsWith("<link") || 
                            trimmed.startsWith("<img") || 
                            trimmed.startsWith("<input") || 
                            trimmed.startsWith("<br") || 
                            trimmed.startsWith("<hr");

      if (hasOpeningTag && !hasClosingTag && !isSelfClosing) {
        currentIndent++;
      }
      continue;
    }

    // JS/TS formatting
    // Calculate leading closing braces to adjust indentation of this specific line
    let leadingCloseCount = 0;
    let temp = trimmed;
    while (temp.length > 0 && (
      temp.startsWith("}") || temp.startsWith("]") || temp.startsWith(")") ||
      temp.startsWith("};") || temp.startsWith("];") || temp.startsWith(");") ||
      temp.startsWith("},") || temp.startsWith("],") || temp.startsWith("),")
    )) {
      if (temp.startsWith("};") || temp.startsWith("];") || temp.startsWith(");") || temp.startsWith("},") || temp.startsWith("],") || temp.startsWith("),")) {
        leadingCloseCount++;
        temp = temp.slice(2).trim();
      } else {
        leadingCloseCount++;
        temp = temp.slice(1).trim();
      }
    }

    const printIndent = Math.max(0, currentIndent - leadingCloseCount);

    // Standardize spacing around control structures and arrow functions
    let cleanedLine = trimmed;
    cleanedLine = cleanedLine
      .replace(/\b(if|for|while|switch|catch)\s*\(/g, "$1 (")
      .replace(/\)\s*\{/g, ") {")
      .replace(/=>\s*/g, "=> ")
      .replace(/\s*=>/g, " =>");

    formattedLines.push(" ".repeat(printIndent * indentSize) + cleanedLine);

    // Calculate next line's starting indentation
    let netBraces = 0;
    let inString = false;
    let stringChar = "";
    
    for (let j = 0; j < trimmed.length; j++) {
      const char = trimmed[j];
      if ((char === '"' || char === "'" || char === "`") && trimmed[j - 1] !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === "{" || char === "[" || char === "(") {
          netBraces++;
        } else if (char === "}" || char === "]" || char === ")") {
          netBraces--;
        }
      }
    }

    currentIndent = Math.max(0, currentIndent + netBraces);
  }

  // Remove any trailing empty line but keep one
  let result = formattedLines.join("\n");
  if (!result.endsWith("\n")) {
    result += "\n";
  }
  return result;
}

export default function CodeSandbox() {
  const { addTerminalLog, reportActivity, isSimpleMode } = useJeetvis();

  // Code editor states
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jeetvis_sandbox_template_idx");
      return saved !== null ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [language, setLanguage] = useState<"javascript" | "python" | "typescript" | "html">(( ) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jeetvis_sandbox_language");
      if (saved !== null) return saved as any;
    }
    return TEMPLATES[0].language;
  });
  const [code, setCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jeetvis_sandbox_code");
      if (saved !== null) return saved;
    }
    return TEMPLATES[0].code;
  });
  const [filename, setFilename] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jeetvis_sandbox_filename");
      if (saved !== null) return saved;
    }
    return TEMPLATES[0].filename;
  });

  // Save sandbox state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("jeetvis_sandbox_code", code);
    localStorage.setItem("jeetvis_sandbox_language", language);
    localStorage.setItem("jeetvis_sandbox_filename", filename);
    localStorage.setItem("jeetvis_sandbox_template_idx", selectedTemplateIdx.toString());
  }, [code, language, filename, selectedTemplateIdx]);

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<"console" | "preview" | "diagnostics" | "terminal" | "chatbot">("console");
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    "[SYSTEM] Quantum Code Sandbox ready.",
    "[SYSTEM] Write code or pick a calibration template, then click RUN to execute."
  ]);

  // Real Terminal Connection States
  const [terminalInput, setTerminalInput] = useState("");
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: "input" | "stdout" | "stderr" | "system"; text: string }>>([
    { type: "system", text: "JEETVIS Core Terminal Connection Established." },
    { type: "system", text: "Shell environment active in workspace. Type commands and execute below." }
  ]);
  const [terminalAgentPrompt, setTerminalAgentPrompt] = useState("");
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [agentLogs, setAgentLogs] = useState<Array<{ action: string; detail: string; output?: string }>>([]);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);

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
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatIsThinking]);

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
      if (chatIncludeContext && code) {
        const contextStr = `\n\n[ACTIVE CODE CONTEXT]\nFile Name: ${filename}\nLanguage: ${language}\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;
        
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
                    setCode(codeContent);
                    addTerminalLog(`[SUCCESS] Custom code block injected to virtual workspace!`);
                  }}
                  className="px-2 py-0.5 bg-cyan-400/25 hover:bg-cyan-400/45 text-cyan-300 hover:text-white rounded border border-cyan-400/30 transition-all cursor-pointer text-[7px]"
                >
                  Inject to Notepad
                </button>
              </div>
            </div>
            <pre className="p-3 overflow-x-auto text-cyan-100/90 leading-normal max-h-[220px] custom-scrollbar whitespace-pre">
              {codeContent}
            </pre>
          </div>
        );
      } else {
        return (
          <span key={index} className="whitespace-pre-line text-[9px] font-sans leading-relaxed text-slate-300">
            {part}
          </span>
        );
      }
    });
  };

  // Execute a manual terminal command on the backend
  const runTerminalCommand = async (commandStr: string) => {
    if (!commandStr.trim() || isTerminalRunning) return;
    setIsTerminalRunning(true);
    setTerminalLogs(prev => [...prev, { type: "input", text: commandStr }]);
    setTerminalInput("");

    try {
      const res = await fetch("/api/terminal/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandStr })
      });
      const data = await res.json();
      if (data.stdout) {
        setTerminalLogs(prev => [...prev, { type: "stdout", text: data.stdout }]);
      }
      if (data.stderr) {
        setTerminalLogs(prev => [...prev, { type: "stderr", text: data.stderr }]);
      }
      if (data.error) {
        setTerminalLogs(prev => [...prev, { type: "stderr", text: `[SYSTEM ERROR]: ${data.error}` }]);
      }
      setTerminalLogs(prev => [...prev, { type: "system", text: `Command completed with exit code: ${data.exitCode}` }]);
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, { type: "stderr", text: `Handshake failed: ${err.message}` }]);
    } finally {
      setIsTerminalRunning(false);
    }
  };

  // Engage the Gemini 3.1 Pro high-thinking Terminal Agent
  const engageTerminalAgent = async () => {
    if (!terminalAgentPrompt.trim() || isAgentThinking) return;
    setIsAgentThinking(true);
    setAgentLogs([]);
    setAgentResponse(null);
    
    setTerminalLogs(prev => [
      ...prev,
      { type: "system", text: `>>> Initiating High Thinking Coding Agent for: "${terminalAgentPrompt}"` },
      { type: "system", text: `>>> Connecting to gemini-3.1-pro-preview with HIGH thinkingLevel...` }
    ]);

    try {
      const accessToken = await getAccessToken();
      const res = await fetch("/api/terminal/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: terminalAgentPrompt, accessToken })
      });
      const data = await res.json();
      
      if (data.agentLogs) {
        setAgentLogs(data.agentLogs);
        // Stream agent actions to our terminal log for a highly visual aesthetic
        data.agentLogs.forEach((log: any) => {
          setTerminalLogs(prev => [
            ...prev,
            { type: "system", text: `[AGENT ACTION] ${log.action}: ${log.detail}` },
            ...(log.output ? [{ type: "stdout", text: log.output }] : [])
          ]);
        });
      }

      if (data.text) {
        setAgentResponse(data.text);
        setTerminalLogs(prev => [
          ...prev,
          { type: "system", text: `>>> Agent successfully completed coding sequence.` }
        ]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setTerminalLogs(prev => [
        ...prev,
        { type: "stderr", text: `>>> Agent execution failed: ${err.message}` }
      ]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  // Telemetry diagnostics states (the HUD Gauges)
  const [diagnostics, setDiagnostics] = useState<{
    cpuPercent: number;
    memoryMB: number;
    executionTimeMs: number;
    thermal: string;
    status: "success" | "warning" | "error";
  } | null>(null);

  const [verbalFeedback, setVerbalFeedback] = useState<string | null>(null);

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // HTML live preview iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update editor when changing templates
  const selectTemplate = (idx: number) => {
    setSelectedTemplateIdx(idx);
    const tmpl = TEMPLATES[idx];
    setLanguage(tmpl.language);
    setCode(tmpl.code);
    setFilename(tmpl.filename);
    setSandboxLogs([
      `[SYSTEM] Loaded template script: ${tmpl.name}`,
      `[SYSTEM] Ready to execute, Sir.`
    ]);
    setDiagnostics(null);
    setVerbalFeedback(null);
  };

  // Run the code
  const runCode = async () => {
    reportActivity("ide");

    // Auto-format code input area with lightweight formatter
    const formatted = formatCodeString(code, language);
    const codeChanged = formatted !== code;
    if (codeChanged) {
      setCode(formatted);
    }

    setIsExecuting(true);
    setDiagnostics(null);
    setVerbalFeedback(null);
    setActiveOutputTab("console");

    setSandboxLogs(prev => [
      ...prev,
      ...(codeChanged ? [`[SYSTEM] Code alignment & indentation auto-formatted, Sir.`] : []),
      `[SANDBOX] Commencing sandbox handshake for ${filename}...`,
      `[SANDBOX] Establishing safe virtual compilation containers...`
    ]);

    // If HTML, we can run it client-side immediately
    if (language === "html") {
      setSandboxLogs(prev => [
        ...prev,
        `[SUCCESS] Web application compiled successfully.`,
        `[DEPLOY] Live render complete. View 'Live Preview' tab, Boss.`
      ]);
      setDiagnostics({
        cpuPercent: 3.4,
        memoryMB: 12.8,
        executionTimeMs: 14,
        thermal: "+0.01",
        status: "success"
      });
      setVerbalFeedback("Sir, the web document is fully compiled and rendered in our localized iframe matrix. All scripts are operating securely.");
      setIsExecuting(false);
      setActiveOutputTab("preview");
      return;
    }

    // For pure JS, we can execute it locally AND query Gemini for diagnostics, or do a full Neural Run
    try {
      const response = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: filename, code: formatted, language })
      });

      if (!response.ok) {
        throw new Error("Virtual compiler handshake failed.");
      }

      const data = await response.json();

      // Parse and display outputs
      if (data.stdout) {
        const stdoutLines = data.stdout.split("\n").filter((l: string) => l.trim().length > 0);
        setSandboxLogs(prev => [
          ...prev,
          ...stdoutLines.map((l: string) => `[STDOUT] ${l}`)
        ]);
      }

      if (data.diagnostics) {
        setDiagnostics(data.diagnostics);
        if (data.diagnostics.status === "error") {
          setSandboxLogs(prev => [...prev, `[ERROR] Execution terminated due to structural instability.`]);
        } else if (data.diagnostics.status === "warning") {
          setSandboxLogs(prev => [...prev, `[WARNING] Compilations warning detected. Optimization advisable.`]);
        } else {
          setSandboxLogs(prev => [...prev, `[SUCCESS] Execution finished with status code 0 (SUCCESS).`]);
        }
      }

      if (data.feedback) {
        setVerbalFeedback(data.feedback);
        addTerminalLog(`[AI-DIAGNOSTIC] ${data.feedback}`);
      }

    } catch (err: any) {
      setSandboxLogs(prev => [
        ...prev,
        `[ERROR] Sandbox execution failed: ${err.message}`
      ]);
      setDiagnostics({
        cpuPercent: 0,
        memoryMB: 0,
        executionTimeMs: 0,
        thermal: "0.00",
        status: "error"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate code using AI Architect
  const generateCodeWithAI = async () => {
    if (!aiPrompt.trim()) return;
    reportActivity("ide");
    setIsGenerating(true);
    setSandboxLogs(prev => [
      ...prev,
      `[ARCHITECT] Requesting molecular code alignment for prompt: "${aiPrompt}"...`,
      `[ARCHITECT] Directing Gemini architect array...`
    ]);

    try {
      const response = await fetch("/api/sandbox/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, language })
      });

      if (!response.ok) {
        throw new Error("Architect failed to respond.");
      }

      const data = await response.json();
      if (data.code) {
        setCode(data.code);
        setSandboxLogs(prev => [
          ...prev,
          `[SUCCESS] Logic mapped perfectly. Inserted code into editor panel, Sir.`
        ]);
        setAiPrompt("");
      } else {
        throw new Error("Empty code response.");
      }
    } catch (err: any) {
      setSandboxLogs(prev => [
        ...prev,
        `[ERROR] AI code generator failed: ${err.message}`
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Safe client-side JavaScript evaluator for interactive visual triggers
  const executeLocalJS = () => {
    if (language !== "javascript") return;

    // Auto-format code input area with lightweight formatter
    const formatted = formatCodeString(code, language);
    const codeChanged = formatted !== code;
    if (codeChanged) {
      setCode(formatted);
    }

    setSandboxLogs(prev => [
      ...prev,
      ...(codeChanged ? [`[SYSTEM] Code alignment & indentation auto-formatted, Sir.`] : []),
      `[LOCAL-EXEC] Direct browser trigger running...`
    ]);
    
    // Backup regular console
    const oldLog = console.log;
    const interceptedLogs: string[] = [];
    console.log = (...args) => {
      interceptedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
      oldLog(...args);
    };

    try {
      // Create sandboxed local execution
      const evaluator = new Function(formatted);
      evaluator();
      setSandboxLogs(prev => [
        ...prev,
        ...interceptedLogs.map(l => `[LOCAL-OUT] ${l}`),
        `[SUCCESS] Local evaluator completed safely.`
      ]);
    } catch (err: any) {
      setSandboxLogs(prev => [
        ...prev,
        `[LOCAL-ERROR] ${err.message}`
      ]);
    } finally {
      // Restore console
      console.log = oldLog;
    }
  };

  // Manual code formatting trigger
  const handleManualFormat = () => {
    reportActivity("ide");
    const formatted = formatCodeString(code, language);
    const codeChanged = formatted !== code;
    setCode(formatted);
    setSandboxLogs(prev => [
      ...prev,
      codeChanged 
        ? `[SYSTEM] Manual format completed: Spacing & indentations aligned.`
        : `[SYSTEM] Spacing alignment check: Code is already perfectly formatted.`
    ]);
  };

  // Load preview in Iframe
  useEffect(() => {
    if (language === "html" && iframeRef.current) {
      const iframe = iframeRef.current;
      const document = iframe.contentDocument || iframe.contentWindow?.document;
      if (document) {
        document.open();
        // Inject a custom script in the preview to capture iframe console logs!
        const scriptInjector = `
          <script>
            const _oldLog = console.log;
            console.log = function(...args) {
              _oldLog(...args);
              window.parent.postMessage({
                type: 'SANDBOX_PREVIEW_LOG',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ")
              }, '*');
            };
            window.onerror = function(message, source, lineno, colno, error) {
              window.parent.postMessage({
                type: 'SANDBOX_PREVIEW_ERROR',
                message: message + " at line " + lineno
              }, '*');
            };
          </script>
        `;
        document.write(scriptInjector + code);
        document.close();
      }
    }
  }, [code, language, activeOutputTab]);

  // Listen to messages from iframe console
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SANDBOX_PREVIEW_LOG') {
        setSandboxLogs(prev => [...prev, `[PREVIEW-CON] ${e.data.message}`]);
      } else if (e.data && e.data.type === 'SANDBOX_PREVIEW_ERROR') {
        setSandboxLogs(prev => [...prev, `[PREVIEW-ERR] ${e.data.message}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div 
      id="quantum-code-sandbox-arena" 
      className="flex flex-col gap-4 p-5 bg-[#050505]/65 border border-white/5 rounded-2xl backdrop-blur-xl h-full shadow-[0_12px_40px_rgba(0,0,0,0.65)] relative overflow-hidden text-slate-200"
    >
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
            <Code className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              {isSimpleMode ? "AI Code Playpen" : "Quantum Code Deck"}
            </h2>
            <p className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              {isSimpleMode ? "Write, generate, and run scripts instantly" : "Virtual execution environment & modular sandbox"}
            </p>
          </div>
        </div>

        {/* Templates Selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-slate-500 uppercase">Load Blueprint:</span>
          <select
            value={selectedTemplateIdx}
            onChange={(e) => selectTemplate(parseInt(e.target.value))}
            className="bg-[#0c0c0f] border border-white/10 hover:border-cyan-400/30 text-cyan-400/90 hover:text-cyan-400 py-1 px-2.5 rounded text-[8px] font-mono outline-none cursor-pointer transition-all duration-200"
          >
            {TEMPLATES.map((tmpl, idx) => (
              <option key={idx} value={idx} className="bg-[#050505] text-slate-400">
                {tmpl.name} ({tmpl.language.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Editor + Output panels */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        {/* Editor Column */}
        <div className="xl:col-span-7 flex flex-col gap-3 h-full min-h-[300px]">
          <div className="flex items-center justify-between bg-black/30 border border-white/5 p-1.5 rounded-lg">
            {/* Filename & Lang Info */}
            <div className="flex items-center gap-2 px-2">
              <input
                type="text"
                value={filename}
                onChange={(e) => {
                  setFilename(e.target.value);
                  const ext = e.target.value.split('.').pop() || 'js';
                  if (['py'].includes(ext)) setLanguage('python');
                  else if (['ts', 'tsx'].includes(ext)) setLanguage('typescript');
                  else if (['html', 'htm'].includes(ext)) setLanguage('html');
                  else setLanguage('javascript');
                }}
                className="bg-transparent border-none outline-none font-mono text-[9px] text-slate-300 font-bold focus:text-white"
              />
              <span className="text-[8px] font-mono bg-cyan-400/10 text-cyan-400 px-1.5 py-0.5 rounded uppercase">
                {language}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleManualFormat}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                title="Format spacing & alignment"
              >
                <AlignLeft className="h-2.5 w-2.5 text-cyan-400" />
                <span>Format</span>
              </button>

              {language === "javascript" && (
                <button
                  onClick={executeLocalJS}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 rounded text-[8px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  title="Run directly in the browser console matrix"
                >
                  Local Run
                </button>
              )}
              
              <button
                onClick={runCode}
                disabled={isExecuting}
                className="flex items-center gap-1 px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold font-mono rounded text-[8px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {isExecuting ? (
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Play className="h-2.5 w-2.5 fill-current" />
                )}
                <span>Run Logic</span>
              </button>
            </div>
          </div>

          {/* Core Code Area */}
          <div className="flex-1 relative border border-white/5 rounded-xl bg-[#030305] overflow-hidden group">
            {/* Line numbers simulated layout */}
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-black/20 border-r border-white/5 select-none py-3.5 text-right pr-2 text-slate-700 font-mono text-[9px] leading-relaxed">
              {Array.from({ length: Math.max(1, code.split("\n").length) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none pl-10 pr-4 py-3.5 font-mono text-[10px] leading-relaxed text-cyan-100/90 resize-none custom-scrollbar focus:text-white focus:ring-0 selection:bg-cyan-500/25 focus:border-none"
              style={{ tabSize: 2 }}
              spellCheck="false"
            />

            {/* Subtle corner hologram HUD specs */}
            <div className="absolute bottom-2 right-2 pointer-events-none opacity-20 group-hover:opacity-45 transition-opacity font-mono text-[6.5px] text-right text-cyan-400">
              CHARSET: UTF-8<br />
              COMPILER: NEURAL_MAPPED<br />
              SAFE_CONTAINER: ACTIVE
            </div>
          </div>

          {/* AI Code Architect input box */}
          <div className="flex items-center gap-2 p-2 bg-[#0a0a0f] border border-white/5 rounded-xl">
            <div className="text-cyan-400 flex-shrink-0 animate-pulse pl-1">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Command JEETVIS to build some code... (e.g. 'flight stabilization physics')"
              className="flex-1 bg-transparent border-none outline-none text-[9.5px] font-mono text-slate-300 placeholder:text-slate-600 focus:text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating) generateCodeWithAI();
              }}
            />
            <button
              onClick={generateCodeWithAI}
              disabled={isGenerating || !aiPrompt.trim()}
              className="px-3 py-1 bg-white/5 hover:bg-cyan-400 hover:text-slate-950 text-cyan-400/90 border border-white/10 hover:border-transparent rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-cyan-400"
            >
              {isGenerating ? "ALIGNING..." : "GENERATE"}
            </button>
          </div>

        </div>

        {/* Output Column */}
        <div className="xl:col-span-5 flex flex-col gap-3 h-full min-h-[300px]">
          
          {/* Tabs header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveOutputTab("console")}
                className={`px-3 py-1 rounded-md font-mono text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeOutputTab === "console"
                    ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3" />
                  <span>Console</span>
                </div>
              </button>

              {language === "html" && (
                <button
                  onClick={() => setActiveOutputTab("preview")}
                  className={`px-3 py-1 rounded-md font-mono text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeOutputTab === "preview"
                      ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3 w-3" />
                    <span>Live Preview</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => setActiveOutputTab("diagnostics")}
                className={`px-3 py-1 rounded-md font-mono text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeOutputTab === "diagnostics"
                    ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Cpu className="h-3 w-3" />
                  <span>Diagnostics</span>
                </div>
              </button>

              <button
                id="terminal-tab-btn"
                onClick={() => setActiveOutputTab("terminal")}
                className={`px-3 py-1 rounded-md font-mono text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeOutputTab === "terminal"
                    ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-cyan-400" />
                  <span>Live Terminal</span>
                </div>
              </button>

              <button
                id="chatbot-tab-btn"
                onClick={() => setActiveOutputTab("chatbot")}
                className={`px-3 py-1 rounded-md font-mono text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeOutputTab === "chatbot"
                    ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-cyan-400 animate-pulse" />
                  <span>Code Chat</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                if (activeOutputTab === "terminal") {
                  setTerminalLogs([
                    { type: "system", text: "Terminal buffer cleared, Sir." }
                  ]);
                } else if (activeOutputTab === "chatbot") {
                  setChatMessages([
                    { role: "assistant", content: getInitialMessage(chatPersona) }
                  ]);
                } else {
                  setSandboxLogs([
                    `[SYSTEM] Terminal buffer cleared, Sir.`
                  ]);
                }
              }}
              className="text-[7.5px] font-mono text-slate-600 hover:text-slate-400 uppercase tracking-widest cursor-pointer"
            >
              Clear Buffer
            </button>
          </div>

          {/* Output view container */}
          <div className="flex-1 min-h-[220px] bg-black/40 border border-white/5 rounded-xl overflow-hidden relative flex flex-col">
            
            {/* View 1: Console logs */}
            {activeOutputTab === "console" && (
              <div className="flex-1 p-3.5 font-mono text-[9.5px] leading-relaxed text-slate-400 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
                {sandboxLogs.map((log, idx) => {
                  let styleClass = "text-slate-500";
                  if (log.includes("[SUCCESS]")) styleClass = "text-emerald-400 font-medium";
                  else if (log.includes("[DEPLOY]") || log.includes("[ARCHITECT]")) styleClass = "text-cyan-400";
                  else if (log.includes("[ERROR]") || log.includes("[PREVIEW-ERR]")) styleClass = "text-rose-400 font-bold";
                  else if (log.includes("[WARNING]")) styleClass = "text-amber-400 font-semibold";
                  else if (log.includes("[STDOUT]")) styleClass = "text-slate-200";
                  else if (log.includes("[SYSTEM]")) styleClass = "text-slate-400 font-semibold";
                  else if (log.includes("[LOCAL-EXEC]") || log.includes("[LOCAL-OUT]")) styleClass = "text-purple-300";

                  return (
                    <div key={idx} className={styleClass}>
                      <span className="opacity-25 mr-2 select-none">{String(idx).padStart(3, "0")}</span>
                      {log}
                    </div>
                  );
                })}
              </div>
            )}

            {/* View 2: Live HTML preview inside an iframe */}
            {activeOutputTab === "preview" && language === "html" && (
              <div className="flex-1 bg-[#020205] relative">
                <iframe
                  ref={iframeRef}
                  title="Interactive HTML Sandbox Render Grid"
                  className="w-full h-full border-none bg-transparent"
                  sandbox="allow-scripts"
                />
              </div>
            )}

            {/* View 3: Diagnostics HUD gauges */}
            {activeOutputTab === "diagnostics" && (
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                
                {diagnostics ? (
                  <div className="flex flex-col gap-4">
                    {/* Visual status flag */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="font-mono text-[9px] text-slate-400 uppercase">Cohesion Status:</span>
                      <div className="flex items-center gap-1.5">
                        {diagnostics.status === "success" ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-mono text-[9px] text-emerald-400 uppercase font-bold">Stable Vector</span>
                          </>
                        ) : diagnostics.status === "warning" ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                            <span className="font-mono text-[9px] text-amber-400 uppercase font-bold">Fluctuation Warning</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-bounce" />
                            <span className="font-mono text-[9px] text-rose-500 uppercase font-bold">Grid Severed</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* HUD Meters */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Gauge 1: Processor Load */}
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-1.5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1.5 pointer-events-none opacity-10">
                          <Cpu className="h-8 w-8 text-cyan-400" />
                        </div>
                        <span className="font-mono text-[7.5px] text-slate-500 uppercase tracking-widest">CPU core cycle</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-lg font-bold text-white">{diagnostics.cpuPercent}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
                            style={{ width: `${diagnostics.cpuPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Gauge 2: Sandbox Footprint */}
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1.5 pointer-events-none opacity-10">
                          <Database className="h-8 w-8 text-cyan-400" />
                        </div>
                        <span className="font-mono text-[7.5px] text-slate-500 uppercase tracking-widest">Memory Allocation</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-lg font-bold text-white">{diagnostics.memoryMB} MB</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (diagnostics.memoryMB / 128) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Gauge 3: Execution Delay */}
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1.5 pointer-events-none opacity-10">
                          <Clock className="h-8 w-8 text-cyan-400" />
                        </div>
                        <span className="font-mono text-[7.5px] text-slate-500 uppercase tracking-widest">Quantum Latency</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-lg font-bold text-white">{diagnostics.executionTimeMs} ms</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (diagnostics.executionTimeMs / 250) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Gauge 4: Thermal Change */}
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1.5 pointer-events-none opacity-10">
                          <Thermometer className="h-8 w-8 text-cyan-400" />
                        </div>
                        <span className="font-mono text-[7.5px] text-slate-500 uppercase tracking-widest">Thermal delta</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-lg font-bold text-white">{diagnostics.thermal}°C</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-400 rounded-full transition-all duration-1000"
                            style={{ width: "30%" }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-600 font-mono text-[9px]">
                    <HelpCircle className="h-8 w-8 text-slate-800 mb-2 animate-pulse" />
                    <span>Sir, please click run to collect virtual telemetry metrics.</span>
                  </div>
                )}

              </div>
            )}

            {/* View 4: Real-time Terminal Connection & Gemini 3.1 Pro Coding Agent */}
            {activeOutputTab === "terminal" && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 font-mono">
                {/* Real-time split layout: Terminal Logs & Gemini Agent control panel */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden h-full">
                  
                  {/* Left Column: The Real Interactive Terminal Terminal Screen */}
                  <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 h-[240px] lg:h-full overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/5 flex-shrink-0">
                      <span className="text-[8px] tracking-wider uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Holographic Workspace Shell
                      </span>
                      <button
                        onClick={() => setTerminalLogs([{ type: "system", text: "Buffer re-calibrated, Sir." }])}
                        className="text-[6.5px] text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
                      >
                        Reset Terminal
                      </button>
                    </div>

                    {/* Scrollable logs screen */}
                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar text-[9px] leading-relaxed flex flex-col gap-1 select-text selection:bg-cyan-500/20">
                      {terminalLogs.map((log, index) => {
                        let colorClass = "text-slate-300";
                        let prefix = "";
                        
                        if (log.type === "input") {
                          colorClass = "text-cyan-400 font-medium";
                          prefix = "sir@jeetvis-terminal:~$ ";
                        } else if (log.type === "system") {
                          colorClass = "text-purple-400 font-semibold";
                          prefix = "[SYSTEM]: ";
                        } else if (log.type === "stderr") {
                          colorClass = "text-rose-400 font-semibold";
                          prefix = "[STDERR]: ";
                        }
                        
                        return (
                          <div key={index} className={`${colorClass} whitespace-pre-wrap break-all`}>
                            {prefix}{log.text}
                          </div>
                        );
                      })}
                    </div>

                    {/* Command prompt bar */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        runTerminalCommand(terminalInput);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 border-t border-white/5 flex-shrink-0"
                    >
                      <span className="text-cyan-400 font-bold text-[9px] select-none">sir@jeetvis-terminal:~$</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder="Enter command (e.g. ls, npm run lint, python3 -c '...')"
                        disabled={isTerminalRunning}
                        className="flex-1 bg-transparent border-none outline-none text-[9px] font-mono text-white focus:ring-0 p-0 placeholder:text-slate-700 focus:border-none"
                      />
                      {isTerminalRunning ? (
                        <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin flex-shrink-0" />
                      ) : (
                        <button type="submit" className="text-[7.5px] uppercase font-bold tracking-wider text-cyan-400 hover:text-cyan-300 cursor-pointer">
                          RUN
                        </button>
                      )}
                    </form>
                  </div>

                  {/* Right Column: Gemini 3.1 Pro Agent Panel */}
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/5 flex-shrink-0">
                      <span className="text-[8px] tracking-wider uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="h-2.5 w-2.5 text-cyan-400 animate-pulse" />
                        Gemini 3.1 Pro Agent Core
                      </span>
                      <span className="text-[6.5px] bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 px-1 py-0.5 rounded font-bold uppercase">
                        Thinking Mode: HIGH
                      </span>
                    </div>

                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-0">
                      {/* Interactive Agent form */}
                      <div className="flex flex-col gap-2 p-2.5 bg-white/5 border border-white/5 rounded-xl flex-shrink-0">
                        <label className="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold">
                          Neural Command Directive
                        </label>
                        <textarea
                          value={terminalAgentPrompt}
                          onChange={(e) => setTerminalAgentPrompt(e.target.value)}
                          placeholder="Command Gemini to code what you want (e.g. 'write a python script that parses index.html and checks if all ids are correct, then run it on the terminal and show result')"
                          rows={3}
                          className="w-full bg-black/40 border border-white/5 rounded-lg p-2 font-mono text-[9px] text-cyan-100 placeholder:text-slate-700 outline-none focus:border-cyan-500/50 resize-none"
                        />
                        <button
                          onClick={engageTerminalAgent}
                          disabled={isAgentThinking || !terminalAgentPrompt.trim()}
                          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-45 text-slate-950 font-bold rounded-lg text-[8px] font-mono uppercase tracking-widest transition-all cursor-pointer"
                        >
                          {isAgentThinking ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Thinking Array Calibrating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              <span>Engage Gemini 3.1 Pro Agent</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Agent Response explanation screen */}
                      {isAgentThinking && (
                        <div className="flex flex-col gap-2 p-3 bg-[#0a1420]/30 border border-cyan-500/10 rounded-xl relative overflow-hidden flex-shrink-0">
                          <span className="font-mono text-[8px] uppercase tracking-wider text-cyan-400 animate-pulse">
                            JEETVIS Neural matrix calculating...
                          </span>
                          <span className="font-mono text-[7px] text-slate-500">
                            Gemini 3.1 Pro is executing code write & command runs on your workspace terminal. Keep line active, Boss.
                          </span>
                        </div>
                      )}

                      {/* Final explanation from Gemini 3.1 Pro */}
                      {agentResponse && (
                        <div className="p-3 bg-[#001c24]/30 border border-cyan-500/20 rounded-xl flex flex-col gap-1.5 flex-shrink-0">
                          <h4 className="font-mono text-[8px] uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                            Analytical Directive Report:
                          </h4>
                          <p className="font-sans text-[9px] text-cyan-100/95 leading-relaxed whitespace-pre-wrap">
                            {agentResponse}
                          </p>
                        </div>
                      )}

                      {/* Log lists of steps taken */}
                      {agentLogs.length > 0 && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <span className="font-mono text-[7px] uppercase tracking-wider text-purple-400 font-bold">
                            Agent Sequence Steps Run:
                          </span>
                          <div className="flex flex-col gap-1 bg-black/40 border border-white/5 rounded-lg p-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                            {agentLogs.map((log, i) => (
                              <div key={i} className="text-[7.5px] font-mono text-slate-400 flex items-start gap-1.5">
                                <span className="text-purple-400 select-none">[{i+1}]</span>
                                <div>
                                  <span className="text-slate-200 font-semibold uppercase">{log.action}:</span> {log.detail}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* View 5: High-Thinking Multi-turn Code Chatbot Tab */}
            {activeOutputTab === "chatbot" && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 font-mono relative">
                
                {/* Chat Control Strip: Model, Persona, and Context Toggle */}
                <div className="p-2 bg-black/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-[8px] flex-shrink-0 z-10 select-none">
                  {/* Model Selection */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold uppercase">Brain Model:</span>
                    <select
                      value={chatModel}
                      onChange={(e: any) => setChatModel(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 font-mono text-[8px] text-cyan-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="gemini-3.5-flash">gemini-3.5-flash (General Core)</option>
                      <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Thinking: HIGH)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Express Line)</option>
                    </select>
                  </div>

                  {/* Persona Selection */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold uppercase">System Role:</span>
                    <select
                      value={chatPersona}
                      onChange={(e: any) => setChatPersona(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 font-mono text-[8px] text-purple-400 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="jeetvis">JEETVIS (Refined British)</option>
                      <option value="auditor">Code Auditor (Bug Spotter)</option>
                      <option value="designer">UI Architect (Visual/CSS)</option>
                      <option value="algo">Algorithmic (Big-O/Structures)</option>
                      <option value="companion">Companion (Encouraging)</option>
                    </select>
                  </div>

                  {/* Context Checkbox */}
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={chatIncludeContext}
                      onChange={(e) => setChatIncludeContext(e.target.checked)}
                      className="rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-0 focus:ring-offset-0 h-3 w-3 cursor-pointer"
                    />
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase">
                      Include active code context ({filename || "file.txt"})
                    </span>
                  </label>
                </div>

                {/* Scrollable Messages Thread */}
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-0 select-text selection:bg-cyan-500/20">
                  {chatMessages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={index}
                        className={`flex gap-2.5 max-w-[92%] ${
                          isUser ? "self-end flex-row-reverse" : "self-start"
                        }`}
                      >
                        {/* Avatar Indicator */}
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

                        {/* Message Bubble */}
                        <div
                          className={`p-2.5 rounded-xl border relative ${
                            isUser
                              ? "bg-cyan-950/40 border-cyan-500/20 text-right"
                              : "bg-white/5 border-white/5"
                          }`}
                        >
                          <div className={`font-mono text-[7px] uppercase tracking-wider text-slate-500 mb-1 select-none ${isUser ? "text-right" : "text-left"}`}>
                            {isUser ? "Commander / User" : `JEETVIS Node (${chatPersona.toUpperCase()})`}
                          </div>
                          <div className="text-left font-sans">
                            {renderMessageContent(msg.content)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Thinking state overlay/placeholder */}
                  {chatIsThinking && (
                    <div className="flex gap-2.5 max-w-[92%] self-start animate-pulse">
                      <div className="h-6 w-6 rounded-lg bg-cyan-950 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                        <Bot className="h-3 w-3 animate-bounce" />
                      </div>
                      <div className="p-2.5 rounded-xl border bg-white/5 border-white/5 flex flex-col gap-1">
                        <span className="font-mono text-[7px] uppercase tracking-wider text-cyan-400">
                          {chatModel === "gemini-3.1-pro-preview" ? "High Thinking Matrix Activating..." : "Processing response..."}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                          <span className="font-mono text-[8px] text-slate-500">
                            {chatPersona === "auditor" 
                              ? "Auditing core functions and logical structures..."
                              : chatPersona === "designer"
                              ? "Calibrating Tailwind visual classes..."
                              : chatPersona === "algo"
                              ? "Calculating structural complexity indices..."
                              : "Formulating elegant solution, Sir. Please keep line active."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
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
                        ? "JEETVIS thinking in progress..."
                        : `Ask ${chatPersona === "jeetvis" ? "JEETVIS" : chatPersona} to edit, format, or build...`
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
            )}

          </div>

          {/* Verbal holographic AI text response panel */}
          <AnimatePresence mode="wait">
            {verbalFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-[#001c24]/20 border border-cyan-500/20 rounded-xl relative flex items-start gap-2.5"
              >
                <div className="p-1 rounded bg-cyan-400/10 text-cyan-400 mt-0.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="font-mono text-[8px] uppercase tracking-widest font-bold text-cyan-400">JEETVIS Assessment:</h4>
                  <p className="font-sans text-[9px] text-cyan-100/90 leading-relaxed mt-1">{verbalFeedback}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
