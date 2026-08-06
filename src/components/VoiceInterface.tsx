import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, X, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { useJeetvis } from "../context/JeetvisContext";
import { auth, getAccessToken } from "../lib/workspaceAuth";

interface VoiceInterfaceProps {
  onClose: () => void;
}

export default function VoiceInterface({ onClose }: VoiceInterfaceProps) {
  const { 
    addTerminalLog, 
    addChatMessage, 
    chatHistory,
    setActivePanel,
    setDashboardLayout,
    setActivePhotoUrl,
    setActiveFileName
  } = useJeetvis();
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "ready" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [realTimeTranscript, setRealTimeTranscript] = useState("");
  const [conversation, setConversation] = useState<{role: "user" | "model", text: string, id: string}[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDetected, setIsDetected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const drawVisualizer = () => {
    if (!analyzerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyzerRef.current?.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        const opacity = (dataArray[i] / 255);
        ctx.fillStyle = `rgba(6, 182, 212, ${opacity * 0.8})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const playBeep = (freq: number, duration: number) => {
    try {
      const ctx = audioContextOutRef.current || new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Could not play beep", e);
    }
  };

  const startConversation = async () => {
    try {
      setStatus("connecting");
      addTerminalLog("[LIVE] Initializing neural voice link...");

      // Initialize Web Speech Recognition for real-time feedback
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              // Final results handled by Gemini
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (interimTranscript) {
            setRealTimeTranscript(interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // WebSocket setup
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      ws.onopen = async () => {
        // Send previous context and userId if available
        const contextSummary = chatHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n");
        const user = auth ? auth.currentUser : null;
        const accessToken = await getAccessToken();
        ws.send(JSON.stringify({ 
          type: "setup", 
          voice: "Zephyr",
          history: contextSummary,
          userId: user?.uid,
          accessToken
        }));
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "ready") {
          setStatus("ready");
          setIsActive(true);
          addTerminalLog("[LIVE] Neural link established. System listening, Boss.");
          playBeep(880, 0.1); // High pitch short beep
          startMic();
        } else if (msg.type === "audio") {
          setRealTimeTranscript(""); // Clear any lingering user interim results
          playAudioChunk(msg.data);
        } else if (msg.type === "transcript") {
          setTranscript(msg.text);
          setRealTimeTranscript(""); // Clear interim when final arrives
          const role = msg.role || "model";
          
          if (role === "user") {
            setIsDetected(true);
            setTimeout(() => setIsDetected(false), 2000);
          }

          setConversation(prev => {
            // Update the last message if it's from the same role and within a short time, or add new
            const last = prev[prev.length - 1];
            if (last && last.role === role && last.text === msg.text) return prev;
            
            return [...prev, { role, text: msg.text, id: Math.random().toString(36).substring(7) }];
          });
          
          if (role === "model") {
            addChatMessage("model", msg.text);
          }
        } else if (msg.type === "interrupted") {
          // Clear output queue on interruption
          nextStartTimeRef.current = audioContextOutRef.current?.currentTime || 0;
        } else if (msg.type === "ui_action") {
          const { action, payload } = msg;
          if (action === "open_terminal") {
            setActivePanel("ide");
            setDashboardLayout("developer");
          } else if (action === "show_photo" && payload) {
            setActivePhotoUrl(payload);
          } else if (action === "open_file" && payload) {
            setActivePanel("ide");
            setActiveFileName(payload);
          }
        } else if (msg.type === "error") {
          setStatus("error");
          addTerminalLog(`[ERROR] Live API Error: ${msg.message}`);
        }
      };

      ws.onclose = () => {
        setIsActive(false);
        if (status !== "error") setStatus("idle");
      };

      ws.onerror = () => {
        setStatus("error");
        addTerminalLog("[ERROR] WebSocket connection failed.");
      };

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      addTerminalLog(`[ERROR] Failed to start voice link: ${err.message}`);
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContextIn = new AudioContext({ sampleRate: 16000 });
      audioContextInRef.current = audioContextIn;

      const analyzer = audioContextIn.createAnalyser();
      analyzer.fftSize = 64;
      analyzerRef.current = analyzer;

      const audioContextOut = new AudioContext({ sampleRate: 24000 });
      audioContextOutRef.current = audioContextOut;
      nextStartTimeRef.current = audioContextOut.currentTime;

      const source = audioContextIn.createMediaStreamSource(stream);
      const processor = audioContextIn.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(analyzer);
      source.connect(processor);
      processor.connect(audioContextIn.destination);

      drawVisualizer();

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64Audio = pcmToBase64(inputData);
          wsRef.current.send(JSON.stringify({ type: "audio", data: base64Audio }));
        }
      };
    } catch (err: any) {
      console.error("Mic error:", err);
      addTerminalLog(`[ERROR] Mic access denied: ${err.message}`);
      stopConversation();
    }
  };

  const playAudioChunk = async (base64Data: string) => {
    if (!audioContextOutRef.current) return;

    const binary = atob(base64Data);
    const buffer = new Int16Array(binary.length / 2);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = (binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8));
    }

    const floatData = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      floatData[i] = buffer[i] / 32768;
    }

    const audioBuffer = audioContextOutRef.current.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);

    const source = audioContextOutRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextOutRef.current.destination);

    const startTime = Math.max(audioContextOutRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
  };

  const pcmToBase64 = (float32Array: Float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 0x7FFF;
    }
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  const stopConversation = () => {
    setIsActive(false);
    setStatus("idle");
    setTranscript("");
    setConversation([]);
    setIsDetected(false);

    wsRef.current?.close();
    wsRef.current = null;

    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRealTimeTranscript("");

    processorRef.current?.disconnect();
    processorRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;

    audioContextInRef.current?.close();
    audioContextInRef.current = null;

    audioContextOutRef.current?.close();
    audioContextOutRef.current = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    return () => stopConversation();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_-12px_rgba(6,182,212,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]' : 'bg-zinc-700'}`} />
            <h2 className="text-xl font-medium text-white tracking-tight">Neural Voice Link</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center gap-8">
          {/* Visualizer */}
          <div className="relative w-full h-24 flex items-end justify-center overflow-hidden rounded-lg bg-zinc-950/30">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={100} 
              className="w-full h-full opacity-50"
            />
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <motion.div
              animate={isActive ? {
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 180, 360]
              } : {}}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className={`absolute inset-0 rounded-full border-2 border-cyan-500/20 ${isActive ? 'block' : 'hidden'}`}
            />
            <motion.div
              animate={isActive ? {
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`absolute inset-4 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 blur-xl ${isActive ? 'block' : 'hidden'}`}
            />
            
            <button
              onClick={isActive ? stopConversation : startConversation}
              disabled={status === "connecting"}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                isActive 
                ? 'bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105' 
                : 'bg-zinc-800 text-cyan-400 hover:bg-zinc-700'
              }`}
            >
              {status === "connecting" ? (
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isActive ? (
                <Mic className="w-10 h-10" />
              ) : (
                <MicOff className="w-10 h-10" />
              )}
            </button>
          </div>

          {/* Real-time Transcript Overlay */}
          <div className="h-8 flex items-center justify-center -mt-6">
            <AnimatePresence>
              {realTimeTranscript && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
                  className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-400/30 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-md"
                >
                  <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,211,238,1)]" />
                    {realTimeTranscript}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-white flex items-center justify-center gap-2">
              {status === "idle" && "System ready for voice command, Sir."}
              {status === "connecting" && "Initializing neural link..."}
              {status === "ready" && (
                <>
                  {isDetected ? (
                    <motion.span 
                      animate={{ opacity: [1, 0.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-cyan-400"
                    >
                      Neural Pattern Detected...
                    </motion.span>
                  ) : (
                    "Interface active. Speak now, Boss."
                  )}
                </>
              )}
              {status === "error" && "Neural link failure."}
            </p>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              Real-time low-latency voice interaction powered by Gemini Live API.
            </p>
          </div>

          {/* Transcript Area */}
          <div className="w-full max-h-48 overflow-y-auto space-y-3 custom-scrollbar px-2">
            <AnimatePresence mode="popLayout">
              {conversation.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3 rounded-xl flex gap-3 ${
                    msg.role === 'user' 
                    ? 'bg-cyan-500/10 border border-cyan-500/20 ml-8' 
                    : 'bg-zinc-800/50 border border-white/5 mr-8'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <Mic className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                  )}
                  <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-cyan-100 font-medium' : 'text-zinc-300 italic'}`}>
                    {msg.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            {conversation.length === 0 && isActive && (
              <div className="text-center py-4">
                <span className="text-zinc-600 text-xs font-mono uppercase tracking-[0.2em] animate-pulse">
                  Listening for bio-signatures...
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-xl border transition-all ${
                isMuted 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <button
              onClick={isActive ? stopConversation : startConversation}
              className={`px-8 rounded-xl font-medium transition-all ${
                isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {isActive ? "Terminate Link" : "Initialize Link"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
