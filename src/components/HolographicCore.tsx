import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, Sparkles, Send, Play, Terminal, Sliders, Settings, Check, Activity, VolumeX, Zap } from "lucide-react";
import { useJeetvis } from "../context/JeetvisContext";
import { getAccessToken } from "../lib/workspaceAuth";

export default function HolographicCore() {
  const {
    addDialogLog,
    dialogLogs,
    isMuted,
    isVoiceEnabled,
    selectedVoice,
    voiceOptions,
    pomodoroActive,
    pomodoroTime,
    completedPomodoros,
    activePanel,
    setActivePanel,
    memories,
    addMemory,
    dashboardLayout,
    setDashboardLayout,
    setActivePhotoUrl,
    setActiveFileName,
    acknowledgeTrigger,
    isSimpleMode,
    suggestedFollowUps,
    setSuggestedFollowUps,
    getSpeechRate,
    addTerminalLog,
    addTask,
    setActiveTab
  } = useJeetvis();

  // Dynamic scaling based on dashboard layout
  const scale = dashboardLayout === "focus" ? 1.25 : dashboardLayout === "developer" ? 0.75 : 0.9;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textCommand, setTextCommand] = useState("");
  const [isShortcutPulsing, setIsShortcutPulsing] = useState(false);
  
  // Push-To-Talk Shift key states
  const [isShiftListening, setIsShiftListening] = useState(false);
  const isShiftListeningRef = useRef(false);
  
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startListeningAfterSpeakingRef = useRef(false);
  const serverTtsFailedUntilRef = useRef<number>(0);
  
  // Audio level state for sizing & fluid morphing [1.0, 2.0]
  const [audioLevel, setAudioLevel] = useState(1);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(16).fill(0));

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pulseIntervalRef = useRef<any>(null);

  // Synchronous response subtitle (the latest JEETVIS output)
  const currentResponse = dialogLogs[0]?.response || (isSimpleMode ? "Standing by! How can I help you today, friend?" : "Standing by, Sir. Systems fully calibrated.");
  const currentQuery = dialogLogs[0]?.query || "";

  // Dynamic Vocal Modulator states
  const [showConfig, setShowConfig] = useState(false);
  const [synthEffect, setSynthEffect] = useState<"none" | "telemetry" | "robotic" | "highpass" | "reverb">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jeetvis_synth_effect");
      if (!saved) {
        localStorage.setItem("jeetvis_synth_effect", "none");
        return "none";
      }
      return saved as any;
    }
    return "none";
  });
  const [carrierFreq, setCarrierFreq] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("jeetvis_synth_carrier_freq")) || 105;
    }
    return 105;
  });
  const [cutoffFreq, setCutoffFreq] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("jeetvis_synth_cutoff_freq")) || 1350;
    }
    return 1350;
  });
  const [squelchEnabled, setSquelchEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jeetvis_synth_squelch") !== "false";
    }
    return true;
  });
  const [effectIntensity, setEffectIntensity] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem("jeetvis_synth_intensity");
      return val !== null ? Number(val) : 0.45;
    }
    return 0.45;
  });

  const [lowLatencyMode, setLowLatencyMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jeetvis_low_latency") !== "false";
    }
    return true;
  });

  // Interactive 3D hover/tilt coordinate states for core orb
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Local storage sync
  useEffect(() => {
    localStorage.setItem("jeetvis_synth_effect", synthEffect);
  }, [synthEffect]);

  useEffect(() => {
    localStorage.setItem("jeetvis_synth_carrier_freq", carrierFreq.toString());
  }, [carrierFreq]);

  useEffect(() => {
    localStorage.setItem("jeetvis_synth_cutoff_freq", cutoffFreq.toString());
  }, [cutoffFreq]);

  useEffect(() => {
    localStorage.setItem("jeetvis_synth_squelch", squelchEnabled.toString());
  }, [squelchEnabled]);

  useEffect(() => {
    localStorage.setItem("jeetvis_synth_intensity", effectIntensity.toString());
  }, [effectIntensity]);

  useEffect(() => {
    localStorage.setItem("jeetvis_low_latency", lowLatencyMode.toString());
  }, [lowLatencyMode]);

  // Web Audio synthetic voice refs
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const modOscRef = useRef<OscillatorNode | null>(null);
  const modulatorGainRef = useRef<GainNode | null>(null);
  const synthGainNodeRef = useRef<GainNode | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);

  // Web Audio Analyser and Animation Frame refs for real-time waveform tracking
  const synthAnalyserRef = useRef<AnalyserNode | null>(null);
  const synthAnimationFrameRef = useRef<number | null>(null);
  const [waveformPath, setWaveformPath] = useState<string>("");
  const [circularWaveformPath, setCircularWaveformPath] = useState<string>("");

  const updateWaveform = () => {
    if (!synthAnalyserRef.current) return;
    
    const analyser = synthAnalyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // 1. Sleek horizontal oscilloscope crossing the core center
    let path = "";
    const width = 180;
    const startX = 10;
    const centerY = 100;
    
    for (let i = 0; i < bufferLength; i++) {
      const x = startX + (i / (bufferLength - 1)) * width;
      // Normalize to range -1 to 1
      const v = (dataArray[i] - 128) / 128;
      // Edge windowing to fade waves smoothly at boundaries
      const edgeFactor = Math.sin((i / (bufferLength - 1)) * Math.PI);
      const y = centerY + v * 30 * edgeFactor * (audioLevel - 0.15); 
      
      if (i === 0) {
        path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    setWaveformPath(path);

    // 2. High-precision resonant circular frequency ring overlay
    let circPath = "";
    const center = 100;
    const baseRadius = 70; // Encapsulating the main core ring snugly
    const pointsCount = Math.min(bufferLength, 64);
    
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i * 2 * Math.PI) / pointsCount;
      const v = (dataArray[i] - 128) / 128;
      const modulation = v * 22 * effectIntensity * (audioLevel - 0.1);
      const r = baseRadius + modulation;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      
      if (i === 0) {
        circPath += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        circPath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    circPath += " Z";
    setCircularWaveformPath(circPath);

    synthAnimationFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      stopSynthSpeechAudio();
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      activeUtteranceRef.current = null;
    };
  }, []);

  // Web Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-GB";

        rec.onstart = () => {
          setIsListening(true);
          startMicAnalysis();
        };

        rec.onresult = (event: any) => {
          let resultText = "";
          for (let i = 0; i < event.results.length; i++) {
            resultText += event.results[i][0].transcript + " ";
          }
          resultText = resultText.trim();
          if (resultText) {
            handleSendCommand(resultText);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech Recognition Warning:", e);
          stopMicAnalysis();
          setIsListening(false);
          setIsShiftListening(false);
          isShiftListeningRef.current = false;
        };

        rec.onend = () => {
          setIsListening(false);
          setIsShiftListening(false);
          isShiftListeningRef.current = false;
          stopMicAnalysis();
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopMicAnalysis();
    };
  }, []);

  // Capture real microphone frequencies using Web Audio API
  const startMicAnalysis = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        // 1. Frequency data for blob morphing
        analyserRef.current.getByteFrequencyData(dataArray);
        const freqArray = Array.from(dataArray).slice(0, 16);
        setFrequencyData(freqArray);

        // 2. Audio level for master scale
        let sum = 0;
        const bufferLength = analyserRef.current.frequencyBinCount;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = 1 + (avg / 128) * 0.9;
        setAudioLevel(normalized);

        // 3. Time domain data for waveform rendering
        const timeData = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(timeData);

        // Horizontal Oscilloscope Path (Symmetric centered)
        let path = "";
        const width = 180;
        const startX = 10;
        const centerY = 100;
        const timeBufferLength = timeData.length;
        for (let i = 0; i < timeBufferLength; i++) {
          const x = startX + (i / (timeBufferLength - 1)) * width;
          const v = (timeData[i] - 128) / 128;
          const edgeFactor = Math.sin((i / (timeBufferLength - 1)) * Math.PI);
          const y = centerY + v * 35 * edgeFactor * (normalized - 0.15); 
          if (i === 0) path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          else path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        setWaveformPath(path);

        // Circular Frequency Resonant Ring Path
        let circPath = "";
        const center = 100;
        const baseRadius = 78;
        const pointsCount = 64;
        for (let i = 0; i < pointsCount; i++) {
          const angle = (i * 2 * Math.PI) / pointsCount;
          const bin = Math.floor((i / pointsCount) * dataArray.length);
          const v = dataArray[bin] / 255;
          const r = baseRadius + v * 25 * (normalized - 0.2);
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          if (i === 0) circPath += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          else circPath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        circPath += " Z";
        setCircularWaveformPath(circPath);

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn("Failed to acquire micro-frequency telemetry stream, Sir:", err);
    }
  };

  const stopMicAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(1);
    setFrequencyData(new Array(16).fill(0));
  };

  const playSquelchBeep = (isStart: boolean) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      filter.type = "highpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      const now = ctx.currentTime;

      if (isStart) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08 * effectIntensity, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04 * effectIntensity, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        osc.start(now);
        osc.stop(now + 0.07);
      }

      // Automatically terminate AudioContext after playback is complete to prevent memory leaks
      setTimeout(() => {
        if (ctx.state !== "closed") {
          ctx.close().catch(() => {});
        }
      }, 500);
    } catch (err) {
      console.warn("Squelch play error:", err);
    }
  };

  const startSynthSpeechAudio = (existingCtx?: AudioContext, existingAnalyser?: AnalyserNode) => {
    try {
      if (synthEffect === "none") return;

      const ctx = existingCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!existingCtx) {
        synthCtxRef.current = ctx;
      }

      const analyser = existingAnalyser || ctx.createAnalyser();
      if (!existingAnalyser) {
        analyser.fftSize = 128;
        synthAnalyserRef.current = analyser;
      }

      const carrier = ctx.createOscillator();
      carrierOscRef.current = carrier;

      if (synthEffect === "robotic") {
        carrier.type = "sawtooth";
      } else if (synthEffect === "telemetry") {
        carrier.type = "triangle";
      } else {
        carrier.type = "sine";
      }

      const freq = carrierFreq;
      carrier.frequency.setValueAtTime(freq, ctx.currentTime);

      const synthGain = ctx.createGain();
      synthGainNodeRef.current = synthGain;
      
      // Let the background hum have subtle presence that increases with intensity setting
      const humVolume = synthEffect === "telemetry" ? 0.04 * effectIntensity : 0.01 * effectIntensity;
      synthGain.gain.setValueAtTime(humVolume, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      biquadFilterRef.current = filter;
      filter.type = "highpass";
      filter.frequency.setValueAtTime(cutoffFreq, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);

      carrier.connect(filter);

      if (synthEffect === "robotic") {
        const modulator = ctx.createOscillator();
        modOscRef.current = modulator;
        modulator.type = "sine";
        modulator.frequency.setValueAtTime(55, ctx.currentTime);

        const modGain = ctx.createGain();
        modulatorGainRef.current = modGain;
        modGain.gain.setValueAtTime(45, ctx.currentTime);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        modulator.start();
      }

      filter.connect(synthGain);
      synthGain.connect(analyser);

      if (!existingCtx && !isMuted) {
        analyser.connect(ctx.destination);
      }

      carrier.start();

      if (!existingCtx) {
        if (synthAnimationFrameRef.current) {
          cancelAnimationFrame(synthAnimationFrameRef.current);
        }
        synthAnimationFrameRef.current = requestAnimationFrame(updateWaveform);
      }
    } catch (err) {
      console.warn("Failed to start vocal synthesizer nodes, Sir:", err);
    }
  };

  const stopSynthSpeechAudio = () => {
    try {
      if (synthAnimationFrameRef.current) {
        cancelAnimationFrame(synthAnimationFrameRef.current);
        synthAnimationFrameRef.current = null;
      }
      setWaveformPath("");
      setCircularWaveformPath("");

      if (carrierOscRef.current) {
        try { carrierOscRef.current.stop(); } catch (e) {}
        carrierOscRef.current.disconnect();
        carrierOscRef.current = null;
      }
      if (modOscRef.current) {
        try { modOscRef.current.stop(); } catch (e) {}
        modOscRef.current.disconnect();
        modOscRef.current = null;
      }
      if (modulatorGainRef.current) {
        modulatorGainRef.current.disconnect();
        modulatorGainRef.current = null;
      }
      if (synthGainNodeRef.current) {
        synthGainNodeRef.current.disconnect();
        synthGainNodeRef.current = null;
      }
      if (biquadFilterRef.current) {
        biquadFilterRef.current.disconnect();
        biquadFilterRef.current = null;
      }
      if (synthAnalyserRef.current) {
        synthAnalyserRef.current.disconnect();
        synthAnalyserRef.current = null;
      }
      if (synthCtxRef.current) {
        synthCtxRef.current.close().catch(() => {});
        synthCtxRef.current = null;
      }
    } catch (err) {
      console.warn("Cleanup synth audio warning:", err);
    }
  };

  const toggleListening = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      clearInterval(pulseIntervalRef.current);
      setAudioLevel(1);
      stopSynthSpeechAudio();
      if (squelchEnabled) {
        playSquelchBeep(false);
      }
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        const testCommand = prompt("Biometric transceiver unavailable. Enter directive, Sir:");
        if (testCommand) {
          handleSendCommand(testCommand);
        }
      }
    }
  };

  const matchBreakdown = (text: string): string | null => {
    const normalized = text.toLowerCase().trim();
    
    // Clean off "jeetvis", "hello jeet", "jeet", "hello jet", "hey jeet", "hi jeet", etc. plus optional punctuation
    let clean = normalized
      .replace(/^(hello\s+)?(jeetvis|jeet|jet|sheet|cheat|cheap|jeep|g|deck|yellow\s+jeet|hey\s+jeet|hi\s+jeet)([,\s\.\?!]+)?/, "")
      .trim();

    const prefixes = [
      "break down a task to",
      "break down the task to",
      "break down a task",
      "break down the task",
      "break down task to",
      "break down task",
      "break down",
      "decompose task to",
      "decompose task",
      "decompose",
      "segment task to",
      "segment task"
    ];

    for (const prefix of prefixes) {
      if (clean.startsWith(prefix)) {
        const taskPart = clean.slice(prefix.length).trim();
        if (taskPart) {
          const originalIndex = text.toLowerCase().indexOf(taskPart);
          if (originalIndex !== -1) {
            return text.slice(originalIndex).trim();
          }
          return taskPart.charAt(0).toUpperCase() + taskPart.slice(1);
        }
      }
    }

    // Also support regex
    const regex = /(?:jeetvis|jeet|jet|sheet|cheat|cheap|jeep|g|deck|system)?[,\s\.\?!]*break\s+down\s+(?:a\s+|the\s+)?task\s+(?:to\s+)?(.+)/i;
    const match = normalized.match(regex);
    if (match && match[1]) {
      const rawTask = match[1].trim();
      const originalIndex = text.toLowerCase().indexOf(rawTask);
      if (originalIndex !== -1) {
        return text.slice(originalIndex).trim();
      }
      return rawTask.charAt(0).toUpperCase() + rawTask.slice(1);
    }

    return null;
  };

  const THINKING_CUES = [
    "Analyzing your query now, Boss...",
    "Retrieving that information, sir...",
    "Accessing system mainframe, hold on...",
    "Scanning regional networks, Boss...",
    "Computing request details, sir...",
    "One moment, Boss, processing directive...",
    "Let me check that right away, sir...",
    "Running data collation, please standby..."
  ];

  const speakLocalDirect = (text: string) => {
    if (typeof window === "undefined" || isMuted) return;

    window.speechSynthesis.cancel();
    clearInterval(pulseIntervalRef.current);
    stopSynthSpeechAudio();

    let speechText = text;
    if (!speechText.toLowerCase().includes("sir") && !speechText.toLowerCase().includes("boss")) {
      speechText = `Sir, ${speechText}`;
    }

    const pacing = getSpeechRate(speechText);
    const utterance = new SpeechSynthesisUtterance(speechText);
    activeUtteranceRef.current = utterance;
    
    if (voiceOptions && voiceOptions.length > 0) {
      const activeVoice = voiceOptions.find(v => v.name === selectedVoice);
      if (activeVoice) {
        utterance.voice = activeVoice;
      }
    }
    utterance.rate = pacing.rate;
    utterance.pitch = pacing.pitch;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (squelchEnabled) {
        playSquelchBeep(true);
      }
      startSynthSpeechAudio();

      pulseIntervalRef.current = setInterval(() => {
        const level = 1 + Math.random() * 0.45;
        setAudioLevel(level);
        const randomFreqs = Array.from({ length: 16 }, () => Math.floor(Math.random() * 90) + 10);
        setFrequencyData(randomFreqs);
      }, 70);
    };

    utterance.onend = () => {
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
      clearInterval(pulseIntervalRef.current);
      setAudioLevel(1);
      setFrequencyData(new Array(16).fill(0));
      stopSynthSpeechAudio();
      if (squelchEnabled) {
        playSquelchBeep(false);
      }
    };

    utterance.onerror = () => {
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
      clearInterval(pulseIntervalRef.current);
      setAudioLevel(1);
      setFrequencyData(new Array(16).fill(0));
      stopSynthSpeechAudio();
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakNativeResponse = async (text: string) => {
    if (typeof window === "undefined" || isMuted) return;
    
    // Interrupt any existing local synthesis or neural playback to prevent overlapping voice signals
    window.speechSynthesis.cancel();
    clearInterval(pulseIntervalRef.current);
    stopSynthSpeechAudio();
    setIsSpeaking(false);
    setAudioLevel(1);

    const pacing = getSpeechRate(text);
    
    let speechText = text;
    if (!speechText.toLowerCase().includes("sir") && !speechText.toLowerCase().includes("boss")) {
      speechText = `Sir, ${speechText}`;
    }

    const now = Date.now();
    let usedServerTts = false;

    if (now > serverTtsFailedUntilRef.current) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: speechText, voice: "Zephyr" })
        });
        
        if (!res.ok) {
          throw new Error(`TTS server responded with status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.audio) throw new Error("TTS stream unavailable");

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        synthCtxRef.current = ctx;

        const binaryString = window.atob(data.audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        source.playbackRate.setValueAtTime(pacing.rate, ctx.currentTime);

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        synthAnalyserRef.current = analyser;

        const mainGain = ctx.createGain();
        synthGainNodeRef.current = mainGain;
        mainGain.gain.setValueAtTime(0.85, ctx.currentTime);

        let finalNode: AudioNode = source;

        if (synthEffect === "highpass") {
          const hpFilter = ctx.createBiquadFilter();
          hpFilter.type = "highpass";
          hpFilter.frequency.setValueAtTime(cutoffFreq, ctx.currentTime);
          hpFilter.Q.setValueAtTime(2.5, ctx.currentTime);
          
          source.connect(hpFilter);
          finalNode = hpFilter;
        } else if (synthEffect === "robotic") {
          // Adv. Ring Modulator: modulate sawtooth carrier with source stream amplitude
          const hpFilter = ctx.createBiquadFilter();
          hpFilter.type = "highpass";
          hpFilter.frequency.setValueAtTime(cutoffFreq, ctx.currentTime);
          hpFilter.Q.setValueAtTime(2.0, ctx.currentTime);

          const ringGain = ctx.createGain();
          ringGain.gain.setValueAtTime(0, ctx.currentTime);

          const carrierOsc = ctx.createOscillator();
          carrierOsc.type = "sawtooth";
          carrierOsc.frequency.setValueAtTime(carrierFreq, ctx.currentTime);
          carrierOscRef.current = carrierOsc;

          source.connect(ringGain.gain);
          carrierOsc.connect(ringGain);
          carrierOsc.start(0);

          ringGain.connect(hpFilter);

          // Connect direct raw path and ring-modulated path based on slider intensity
          const rawMixGain = ctx.createGain();
          const modMixGain = ctx.createGain();
          rawMixGain.gain.setValueAtTime(1 - effectIntensity * 0.75, ctx.currentTime);
          modMixGain.gain.setValueAtTime(effectIntensity * 1.6, ctx.currentTime);

          source.connect(rawMixGain);
          hpFilter.connect(modMixGain);

          const summer = ctx.createGain();
          rawMixGain.connect(summer);
          modMixGain.connect(summer);

          finalNode = summer;
        } else if (synthEffect === "telemetry") {
          // Normal voice with telemetry background hum
          const hpFilter = ctx.createBiquadFilter();
          hpFilter.type = "highpass";
          hpFilter.frequency.setValueAtTime(Math.min(cutoffFreq, 750), ctx.currentTime);
          
          source.connect(hpFilter);
          finalNode = hpFilter;

          // Wire background hum inside same context
          startSynthSpeechAudio(ctx, analyser);
        } else if (synthEffect === "reverb") {
          // Science fiction feedback delay line
          const delay = ctx.createDelay();
          delay.delayTime.setValueAtTime(0.18, ctx.currentTime);

          const feedback = ctx.createGain();
          feedback.gain.setValueAtTime(0.38 * effectIntensity, ctx.currentTime);

          delay.connect(feedback);
          feedback.connect(delay);

          const delayMix = ctx.createGain();
          delayMix.gain.setValueAtTime(effectIntensity * 0.55, ctx.currentTime);

          source.connect(delay);
          delay.connect(delayMix);

          const summer = ctx.createGain();
          source.connect(summer);
          delayMix.connect(summer);

          finalNode = summer;
        }

        finalNode.connect(mainGain);
        mainGain.connect(analyser);
        analyser.connect(ctx.destination);

        source.onended = () => {
          setIsSpeaking(false);
          clearInterval(pulseIntervalRef.current);
          setAudioLevel(1);
          setFrequencyData(new Array(16).fill(0));
          stopSynthSpeechAudio();
          if (squelchEnabled) {
            playSquelchBeep(false);
          }
        };

        setIsSpeaking(true);
        if (squelchEnabled) {
          playSquelchBeep(true);
        }
        
        if (synthEffect !== "telemetry" && synthEffect !== "none") {
          startSynthSpeechAudio(ctx, analyser);
        }
        
        if (synthAnimationFrameRef.current) {
          cancelAnimationFrame(synthAnimationFrameRef.current);
        }
        synthAnimationFrameRef.current = requestAnimationFrame(updateWaveform);

        source.start(0);

        pulseIntervalRef.current = setInterval(() => {
          const level = 1 + Math.random() * 0.45;
          setAudioLevel(level);
          const randomFreqs = Array.from({ length: 16 }, () => Math.floor(Math.random() * 90) + 10);
          setFrequencyData(randomFreqs);
        }, 70);

        usedServerTts = true;
        return;
      } catch (err: any) {
        console.warn("Advanced neural voice failed, falling back to local synthesis:", err);
        serverTtsFailedUntilRef.current = Date.now() + 5 * 60 * 1000;
        addTerminalLog(`[SYSTEM] Neural TTS channel offline/rate-limited: ${err.message || "429 Quota Exceeded"}. Routing audio output through local browser SpeechSynthesis engine.`);
      }
    } else {
      addTerminalLog("[SYSTEM] Neural TTS bypass active (cooldown). Utilizing local client speech synthesis.");
    }

    // FALLBACK: Local browser speech synthesis
    window.speechSynthesis.cancel();
    stopSynthSpeechAudio();

    const utterance = new SpeechSynthesisUtterance(speechText);
    activeUtteranceRef.current = utterance;
    
    if (voiceOptions && voiceOptions.length > 0) {
      const activeVoice = voiceOptions.find(v => v.name === selectedVoice);
      if (activeVoice) {
        utterance.voice = activeVoice;
      }
    }
    utterance.rate = pacing.rate; 
    utterance.pitch = pacing.pitch; 

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (squelchEnabled) {
        playSquelchBeep(true);
      }
      startSynthSpeechAudio();

      pulseIntervalRef.current = setInterval(() => {
        const level = 1 + Math.random() * 0.45;
        setAudioLevel(level);
        const randomFreqs = Array.from({ length: 16 }, () => Math.floor(Math.random() * 90) + 10);
        setFrequencyData(randomFreqs);
      }, 70);
    };

    utterance.onend = () => {
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
      clearInterval(pulseIntervalRef.current);
      setAudioLevel(1);
      setFrequencyData(new Array(16).fill(0));
      stopSynthSpeechAudio();
      if (squelchEnabled) {
        playSquelchBeep(false);
      }
    };

    utterance.onerror = () => {
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
      clearInterval(pulseIntervalRef.current);
      setAudioLevel(1);
      setFrequencyData(new Array(16).fill(0));
      stopSynthSpeechAudio();
    };

    window.speechSynthesis.speak(utterance);
  };

  const playHighTechChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1000, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.06 * effectIntensity, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      // Rising high-tech arpeggio chime
      playTone(880, now, 0.2, "sine"); // A5
      playTone(1046.5, now + 0.06, 0.25, "sine"); // C6
      playTone(1318.51, now + 0.12, 0.35, "sine"); // E6
      
      // Automatically terminate AudioContext to prevent context leaks
      setTimeout(() => {
        if (ctx.state !== "closed") {
          ctx.close().catch(() => {});
        }
      }, 1000);
      
    } catch (err) {
      console.warn("Chime play error:", err);
    }
  };

  const triggerActivationSequence = (sourceType: "shortcut" | "wakeword") => {
    setActivePanel("tasks_emails");
    setIsShortcutPulsing(true);
    playHighTechChime();
    
    const cues = [
      "Online, Sir.",
      "Awaiting instructions, Boss.",
      "Standing by, Sir.",
      "Core systems fully active, Sir."
    ];
    const chosenCue = cues[Math.floor(Math.random() * cues.length)];
    
    if (sourceType === "wakeword") {
      startListeningAfterSpeakingRef.current = true;
    }

    speakNativeResponse(chosenCue);
    addDialogLog(sourceType === "wakeword" ? "Voice Activation Wake Word" : "Voice Activation Shortcut", chosenCue);
    
    // Focus input after dock panel transition completes
    setTimeout(() => {
      inputRef.current?.focus();
      setIsShortcutPulsing(false);
    }, 350);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + Space or Cmd + Space
      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isTrigger = (isMac ? e.metaKey : e.ctrlKey) && e.code === "Space";
      
      if (isTrigger) {
        e.preventDefault();
        
        const targetPanel = activePanel === "none" ? "tasks_emails" : "none";
        
        if (targetPanel !== "none") {
          triggerActivationSequence("shortcut");
        } else {
          setActivePanel("none");
          if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            clearInterval(pulseIntervalRef.current);
            setAudioLevel(1);
            stopSynthSpeechAudio();
            if (squelchEnabled) {
              playSquelchBeep(false);
            }
          }
          if (isListening) {
            recognitionRef.current?.stop();
          }
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel, isMuted, isSpeaking, isListening, effectIntensity, squelchEnabled]);

  // Push-To-Talk Shift Key Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Shift" || e.repeat) return;

      // Ignore if user is currently typing in an input, textarea, or contenteditable
      const activeEl = document.activeElement;
      if (activeEl) {
        const isInput = 
          activeEl.tagName === "INPUT" || 
          activeEl.tagName === "TEXTAREA" || 
          activeEl.hasAttribute("contenteditable") ||
          activeEl.closest("[contenteditable]") ||
          activeEl.classList.contains("cm-content") ||
          activeEl.closest(".cm-editor");
        if (isInput) return;
      }

      // If we are currently speaking, cancel speaking
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        clearInterval(pulseIntervalRef.current);
        setAudioLevel(1);
        stopSynthSpeechAudio();
        if (squelchEnabled) {
          playSquelchBeep(false);
        }
      }

      // Engages listening
      const rec = recognitionRef.current;
      if (rec && !isShiftListeningRef.current && !isListening) {
        rec.continuous = true;
        try {
          // Open the logs panel so the user sees real-time reactions
          if (activePanel !== "tasks_emails") {
            setActivePanel("tasks_emails");
          }
          
          rec.start();
          isShiftListeningRef.current = true;
          setIsShiftListening(true);
          if (squelchEnabled) {
            playSquelchBeep(true);
          }
          addTerminalLog("[PTT] Push-To-Talk engaged. Hold Shift and speak, Boss...");
        } catch (err: any) {
          console.warn("PTT start error:", err);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Shift") return;

      if (isShiftListeningRef.current) {
        const rec = recognitionRef.current;
        if (rec) {
          try {
            rec.stop();
            // Reset continuous mode
            rec.continuous = false;
          } catch (err: any) {
            console.warn("PTT stop error:", err);
          }
        }
        if (squelchEnabled) {
          playSquelchBeep(false);
        }
        isShiftListeningRef.current = false;
        setIsShiftListening(false);
        addTerminalLog("[PTT] Push-To-Talk released. Synthesizing Boss's directive...");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpeaking, isListening, activePanel, squelchEnabled, effectIntensity]);

  // Background Wake Word Detection: "hello jeet"
  useEffect(() => {
    let active = true;
    let recInstance: any = null;

    const initWakeWord = () => {
      if (typeof window === "undefined" || isListening || isSpeaking) return;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-GB";

      rec.onresult = (event: any) => {
        if (!active) return;
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript.toLowerCase();

        // Direct task breakdown detection (e.g. "JEETVIS, break down a task to...")
        const matchedTask = matchBreakdown(transcript);
        if (matchedTask) {
          active = false;
          try {
            rec.abort();
          } catch (e) {}
          handleSendCommand(event.results[resultIndex][0].transcript);
          return;
        }

        // Flexible phonetic and wording detection for "hello jeet" wake word
        const isWakeWord = 
          transcript.includes("hello jeet") || 
          transcript.includes("hello jet") || 
          transcript.includes("hello sheet") || 
          transcript.includes("hello cheat") || 
          transcript.includes("hello g") || 
          transcript.includes("hello deck") || 
          transcript.includes("hello cheap") || 
          transcript.includes("hello jeep") || 
          transcript.includes("hey jeet") || 
          transcript.includes("hi jeet") ||
          transcript.includes("yellow jeet");

        if (isWakeWord) {
          active = false;
          try {
            rec.abort();
          } catch (e) {}
          
          triggerActivationSequence("wakeword");
        }
      };

      rec.onerror = (e: any) => {
        // Noisy room or aborted can throw errors, we log or ignore
      };

      rec.onend = () => {
        if (active && !isListening && !isSpeaking) {
          // Restart after a small delay to maintain background readiness
          setTimeout(() => {
            if (active && !isListening && !isSpeaking) {
              try {
                rec.start();
              } catch (e) {}
            }
          }, 800);
        }
      };

      recInstance = rec;
      try {
        rec.start();
      } catch (e) {}
    };

    // Only activate wake-word listening when the system is completely idle
    if (!isListening && !isSpeaking) {
      initWakeWord();
    }

    return () => {
      active = false;
      if (recInstance) {
        try {
          recInstance.abort();
        } catch (e) {}
      }
    };
  }, [isListening, isSpeaking, activePanel]);

  const handleSendCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    setLoading(true);

    const matchedTask = matchBreakdown(commandText);
    if (matchedTask) {
      try {
        const taskCue = `Understood, Boss. Initiating task breakdown engine for: ${matchedTask}. Segmenting milestones now.`;
        speakLocalDirect(taskCue);
        
        addTerminalLog(`[VOICE-ACTIVATION] Directive identified: Task Breakdown for "${matchedTask}".`);
        
        // Show tasks panel so the user can see the progress in real-time
        setActivePanel("tasks_emails");
        setActiveTab("tasks");
        
        // Add the task which automatically fetches the decomposition
        await addTask(matchedTask, "Voice Command");
      } catch (err) {
        console.error("Vocal task breakdown error:", err);
        addTerminalLog(`[ERROR] Vocal task breakdown failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
        setTextCommand("");
      }
      return;
    }

    // Speak immediate responsive cue so the user knows it's thinking and working
    const randomCue = THINKING_CUES[Math.floor(Math.random() * THINKING_CUES.length)];
    speakLocalDirect(randomCue);

    try {
      // Determine if Gemini needs Google Search grounding
      const triggers = ["search", "who is", "weather", "latest", "news", "current events", "google"];
      const isSearchNeeded = triggers.some(t => commandText.toLowerCase().includes(t));

      const accessToken = await getAccessToken();
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: commandText,
          useSearch: isSearchNeeded,
          memories: memories,
          isSimpleMode: isSimpleMode,
          lowLatencyMode: lowLatencyMode,
          accessToken
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      addDialogLog(commandText, data.text, data.sources);
      speakNativeResponse(data.text);

      if (data.suggestedFollowUps && Array.isArray(data.suggestedFollowUps)) {
        setSuggestedFollowUps(data.suggestedFollowUps);
      } else {
        setSuggestedFollowUps([]);
      }

      // Auto-extract and save any newly identified memory
      if (data.newMemory && data.newMemory.content) {
        await addMemory(data.newMemory.content, data.newMemory.category, data.newMemory.importance);
      }

      if (data.action) {
        const { type, payload } = data.action;
        if (type === "open_terminal") {
          setActivePanel("ide");
          setDashboardLayout("developer");
        } else if (type === "show_photo" && payload) {
          setActivePhotoUrl(payload);
        } else if (type === "open_file" && payload) {
          setActivePanel("ide");
          setActiveFileName(payload);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errResponse = isSimpleMode 
        ? "Oops, I'm having a little trouble connecting to the network right now. Please try again soon." 
        : "I experienced a connection disruption with my neural grid, Sir. Please inspect the main console.";
      addDialogLog(commandText, errResponse);
      speakNativeResponse(errResponse);
    } finally {
      setLoading(false);
      setTextCommand("");
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textCommand.trim()) {
      handleSendCommand(textCommand);
    }
  };

  // Speaks welcome sequence on load
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      const welcomeMsg = isSimpleMode 
        ? "Hello there! I am your smart companion. I'm here to help you manage your tasks, emails, and focus time."
        : "Tactical command center initialized, Sir. I am monitoring all micro-frequencies. Directives logged and ready.";
      speakNativeResponse(welcomeMsg);
    }, 1800);
    return () => clearTimeout(welcomeTimer);
  }, [isSimpleMode]);

  // Listener for custom command submission from external panels (like emails or tasks)
  useEffect(() => {
    const handleCustomSubmit = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        handleSendCommand(customEvent.detail);
      }
    };
    window.addEventListener("submit-command", handleCustomSubmit);
    return () => {
      window.removeEventListener("submit-command", handleCustomSubmit);
    };
  }, [memories, isSimpleMode]);

  // Helper to generate fluid blob path points modulated by Web Audio frequency bins
  const getBlobPath = () => {
    const baseRadius = 55;
    const center = 100;
    const points: {x: number, y: number}[] = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      // Extract frequency factor for this node
      const freqIndex = i % frequencyData.length;
      const val = frequencyData[freqIndex] || 0;
      const modulation = (val / 255) * 22 * (audioLevel - 0.15);
      
      const r = baseRadius + modulation;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      points.push({x, y});
    }

    // Generate smooth cubic bezier path for organic liquid morphing
    let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      d += ` Q ${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${midX.toFixed(2)},${midY.toFixed(2)}`;
    }
    d += " Z";
    return d;
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Elegant subtle 3D tilt limit
    const tiltX = -(y / (rect.height / 2)) * 14;
    const tiltY = (x / (rect.width / 2)) * 14;
    setRotateX(tiltX);
    setRotateY(tiltY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div 
      id="holographic-voice-core" 
      layout
      animate={{ scale }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-8 text-center select-none relative z-10"
    >
      
      {/* Background status overlay */}
      <div className="absolute -top-12 monochrome-text text-[8px] text-cyan-400/25 tracking-[0.25em] uppercase flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${isListening ? "bg-rose-500 animate-ping" : isSpeaking ? "bg-cyan-400 animate-pulse" : "bg-cyan-500/40"}`} />
        Telemetry Frequency: 457.90 MHz // {isListening ? "TRANSCEIVER GAIN ACTIVE" : "NOMINAL IDLE"}
      </div>

      {/* SVG Liquid Holographic Morphing Orb */}
      <div 
        className="h-64 w-64 relative flex items-center justify-center cursor-pointer select-none" 
        onClick={toggleListening}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: "transform 0.12s ease-out",
        }}
      >
        
        {/* Soft Radial Backglow */}
        <div 
          className={`absolute inset-0 rounded-full blur-[45px] transition-all duration-700 ${
            isShortcutPulsing
              ? "bg-cyan-400/40 shadow-[0_0_120px_rgba(34,211,238,0.7)] scale-115"
              : isShiftListening
              ? "bg-rose-500/25 shadow-[0_0_100px_rgba(239,68,68,0.35)] scale-105"
              : isListening 
              ? "bg-rose-500/10 shadow-[0_0_80px_rgba(239,68,68,0.15)]" 
              : isSpeaking 
              ? "bg-cyan-400/15 shadow-[0_0_80px_rgba(34,211,238,0.2)]" 
              : "bg-cyan-500/5 shadow-[0_0_60px_rgba(34,211,238,0.05)]"
          }`} 
        />

        {/* Orbit ring 1 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-cyan-400/10"
          style={{ scale: audioLevel * 1.04 }}
        />

        {/* Orbit ring 2 */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-dashed border-cyan-400/5"
          style={{ scale: audioLevel * 0.96 }}
        />

        {/* JARVIS Acknowledge Pulse */}
        <AnimatePresence>
          <motion.div
            key={`ack-${acknowledgeTrigger}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={acknowledgeTrigger > 0 ? { scale: [0.6, 1.4], opacity: [0, 0.6, 0] } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.5)] z-0 pointer-events-none"
          />
        </AnimatePresence>

        {/* Glowing holographic liquid core shape */}
        <svg 
          viewBox="0 0 200 200" 
          className="w-48 h-48 absolute z-10 overflow-visible drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          style={{
            transform: isListening || isShiftListening || isSpeaking ? `scale(${0.9 + (audioLevel - 1) * 0.75})` : undefined,
            transition: isListening || isShiftListening || isSpeaking ? "transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)" : "transform 1s ease-out",
            animation: !isListening && !isShiftListening && !isSpeaking ? "orb-ambient-breathe 4s ease-in-out infinite" : "none"
          }}
        >
          <defs>
            <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {isListening || isShiftListening ? (
                <>
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.85" />
                </>
              )}
            </linearGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Liquid fluid path */}
          <motion.path
            d={getBlobPath()}
            fill="url(#orbGradient)"
            filter="url(#glow)"
            className="transition-all duration-75 ease-out"
            animate={{
              scale: isShortcutPulsing ? 1.18 : (isListening || isShiftListening) ? 1.08 : isSpeaking ? 1.04 : 0.98,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
          />

          {/* Real-time Oscilloscope Waveform Overlay */}
          {(isSpeaking || isListening || isShiftListening) && waveformPath && (
            <motion.path
              d={waveformPath}
              fill="none"
              stroke={isListening || isShiftListening ? "#ef4444" : "#22d3ee"}
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] pointer-events-none"
            />
          )}

          {/* Real-time Circular Resonant Waveform Overlay */}
          {(isSpeaking || isListening || isShiftListening) && circularWaveformPath && (
            <motion.path
              d={circularWaveformPath}
              fill="none"
              stroke={isListening || isShiftListening ? "#f59e0b" : "#06b6d4"}
              strokeWidth="1"
              strokeDasharray="2 3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              className="drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] pointer-events-none"
            />
          )}
        </svg>

        {/* Floating internal icon */}
        <div className="absolute z-20 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {pomodoroActive ? (
              <motion.div 
                key="timer-view"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <span className="font-mono text-3xl font-extralight text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  {formatTimer(pomodoroTime)}
                </span>
                <span className="text-[7px] tracking-[0.3em] font-mono text-cyan-400/60 uppercase mt-1">
                  CHRONO STAGE ACTIVE
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="mic-view"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center justify-center"
              >
                {isListening || isShiftListening ? (
                  <Mic className="h-9 w-9 text-rose-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                ) : isSpeaking ? (
                  <Volume2 className="h-9 w-9 text-white animate-bounce" />
                ) : (
                  <Mic className="h-8 w-8 text-cyan-400/80 hover:text-white transition-colors duration-200" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Push-to-Talk HUD overlay floating right on the orb */}
        <AnimatePresence>
          {isShiftListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-rose-500/10 border border-rose-500/25 rounded-full backdrop-blur-md flex items-center gap-1.5 z-30 shadow-[0_0_15px_rgba(239,68,68,0.15)] whitespace-nowrap"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-[8px] text-rose-400 tracking-[0.15em] uppercase">
                PTT Mode // Release Shift to Respond
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Real-time Subtitles / Latest Command Reply */}
      <div className="mt-4 min-h-[64px] max-w-md px-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentResponse}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-1.5"
          >
            {currentQuery && (
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                DIRECTIVE: "{currentQuery}"
              </p>
            )}
            <p className="text-[13px] font-extralight tracking-wide leading-relaxed text-slate-200">
              {currentResponse}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Suggested Conversational Follow-up Buttons */}
      {suggestedFollowUps && suggestedFollowUps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-col items-center gap-1.5 w-full max-w-sm px-4 relative z-20"
        >
          <span className="font-mono text-[7px] text-slate-500 uppercase tracking-[0.2em] text-center">Suggested actions // Conversational flow</span>
          <div className="flex flex-wrap justify-center gap-1.5 mt-0.5">
            {suggestedFollowUps.slice(0, 3).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendCommand(q)}
                className={`font-mono text-[8px] px-2.5 py-1 rounded-full border bg-black/40 hover:bg-white/5 transition-all duration-300 cursor-pointer text-left ${
                  isSimpleMode 
                    ? "border-emerald-500/20 text-emerald-400 hover:border-emerald-400/40" 
                    : "border-cyan-500/20 text-cyan-400 hover:border-cyan-400/40"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Elegant, borderless single-line Command Console input */}
      <form onSubmit={handleTextSubmit} className="mt-8 w-full max-w-sm px-4 relative z-20">
        <div className="relative flex items-center justify-between border-b border-white/5 py-2 group hover:border-cyan-400/20 transition-all duration-300">
          <input
            ref={inputRef}
            type="text"
            value={textCommand}
            onChange={(e) => setTextCommand(e.target.value)}
            placeholder="Type directive for JEETVIS, Sir..."
            disabled={loading}
            className={`w-full bg-transparent text-xs font-mono font-light text-slate-200 placeholder-slate-600 outline-none tracking-wide transition-all ${
              lowLatencyMode ? "pr-16" : "pr-8"
            }`}
          />
          {lowLatencyMode && (
            <div className="absolute right-6 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[6px] font-mono tracking-wider uppercase mr-1 select-none">
              <Zap className="h-1.5 w-1.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Lite</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !textCommand.trim()}
            className="absolute right-0 text-slate-500 hover:text-cyan-400 transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:hover:text-slate-500"
          >
            {loading ? (
              <span className="flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-spin rounded-full h-3 w-3 border border-cyan-400 border-t-transparent" />
              </span>
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </form>

      {/* Vocal Modulator Configuration Trigger */}
      <button
        type="button"
        onClick={() => setShowConfig(!showConfig)}
        className="mt-6 font-mono text-[9px] uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1.5 cursor-pointer outline-none relative z-20"
      >
        <Sliders className="h-3 w-3" />
        <span>{showConfig ? "Hide" : "Calibrate"} Vocal Matrix</span>
      </button>

      {/* Collapsible Vocal Matrix Configuration HUD */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full max-w-sm border border-white/5 bg-[#050505]/65 backdrop-blur-md rounded-lg p-4 text-left overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.65)] relative z-20"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="font-mono text-[9px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="h-3 w-3 animate-spin" style={{ animationDuration: "12s" }} />
                Vocal Matrix Calibration
              </span>
              <span className="font-mono text-[8px] text-slate-600">JEETVIS V2.4</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Modulation Type selection */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">Synthetic Overlay Mode</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "none", label: "Pure Voice" },
                    { id: "telemetry", label: "Telemetry Hum" },
                    { id: "robotic", label: "Cybernetic Buzz" },
                    { id: "highpass", label: "Highpass Comms" },
                    { id: "reverb", label: "Echo Command" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSynthEffect(opt.id as any)}
                      className={`px-2 py-1.5 rounded font-mono text-[8px] uppercase tracking-wide border cursor-pointer text-center transition-all ${
                        synthEffect === opt.id
                          ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]"
                          : "bg-[#030303] border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                      } ${opt.id === "reverb" ? "col-span-2 sm:col-span-1" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Squelch and Beeps Toggle */}
              <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">Squelch Gate Beeps</span>
                <button
                  type="button"
                  onClick={() => setSquelchEnabled(!squelchEnabled)}
                  className={`px-3 py-1 rounded font-mono text-[8px] uppercase border tracking-wider transition-all cursor-pointer ${
                    squelchEnabled
                      ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {squelchEnabled ? "Enabled" : "Muted"}
                </button>
              </div>

              {/* Quantum Latency Bypass Toggle */}
              <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                <div className="flex flex-col">
                  <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">Quantum Latency Bypass</span>
                  <span className="font-mono text-[6px] text-slate-600 uppercase tracking-wider">Uses Gemini 3.1 Flash Lite</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLowLatencyMode(!lowLatencyMode)}
                  className={`px-3 py-1 rounded font-mono text-[8px] uppercase border tracking-wider transition-all cursor-pointer ${
                    lowLatencyMode
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                      : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                  }`}
                >
                  {lowLatencyMode ? "Active (Lite)" : "Standard (HD)"}
                </button>
              </div>

              {/* Sliders Container if Effect is active */}
              {synthEffect !== "none" && (
                <div className="flex flex-col gap-2.5 pt-1">
                  {/* Intensity Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase tracking-widest">
                      <span>Synthesizer Gain</span>
                      <span className="text-cyan-400 font-bold">{Math.round(effectIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={effectIntensity}
                      onChange={(e) => setEffectIntensity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-white/5 rounded-lg outline-none cursor-pointer"
                    />
                  </div>

                  {/* Carrier Frequency Slider */}
                  {synthEffect !== "highpass" && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase tracking-widest">
                        <span>Carrier Oscillator (Pitch)</span>
                        <span className="text-cyan-400 font-bold">{carrierFreq} Hz</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="220"
                        step="5"
                        value={carrierFreq}
                        onChange={(e) => setCarrierFreq(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 h-1 bg-white/5 rounded-lg outline-none cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Cutoff Frequency Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase tracking-widest">
                      <span>Highpass Cutoff Filter</span>
                      <span className="text-cyan-400 font-bold">{cutoffFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="2500"
                      step="50"
                      value={cutoffFreq}
                      onChange={(e) => setCutoffFreq(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-white/5 rounded-lg outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
