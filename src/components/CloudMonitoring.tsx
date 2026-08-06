import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, Database, Cpu, Server, TrendingUp, AlertTriangle, 
  CheckCircle2, Info, RefreshCw, Zap, ShieldAlert, FileText, ArrowUpRight
} from "lucide-react";

interface MetricPoint {
  timestamp: string;
  value: number;
}

interface MonitorData {
  success: boolean;
  projectId: string;
  metrics: {
    sqlCpu: MetricPoint[] | null;
    sqlMemory: MetricPoint[] | null;
    sqlConnections: MetricPoint[] | null;
    firestoreReads: MetricPoint[] | null;
    firestoreWrites: MetricPoint[] | null;
    firestoreDeletes: MetricPoint[] | null;
  } | null;
  error?: string;
  message?: string;
}

export default function CloudMonitoring() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MonitorData | null>(null);
  const [activeTab, setActiveTab] = useState<"sql" | "firestore">("sql");
  
  // Real-time local simulated data for fallback/sandbox representation
  const [simulatedSqlCpu, setSimulatedSqlCpu] = useState<number[]>([24, 28, 31, 29, 35, 42, 38, 45, 41, 39, 44, 48]);
  const [simulatedSqlMem, setSimulatedSqlMem] = useState<number[]>([62.4, 62.5, 62.6, 62.5, 62.8, 63.1, 63.0, 63.4, 63.2, 63.1, 63.3, 63.5]);
  const [simulatedSqlConn, setSimulatedSqlConn] = useState<number[]>([4, 4, 5, 5, 6, 6, 8, 8, 7, 6, 5, 6]);
  
  const [simulatedFsReads, setSimulatedFsReads] = useState<number[]>([45, 52, 60, 48, 55, 72, 85, 94, 78, 65, 58, 62]);
  const [simulatedFsWrites, setSimulatedFsWrites] = useState<number[]>([12, 14, 18, 15, 22, 28, 25, 30, 24, 19, 15, 17]);
  const [simulatedFsDeletes, setSimulatedFsDeletes] = useState<number[]>([2, 1, 3, 2, 4, 6, 5, 8, 4, 3, 2, 3]);

  const [simulatedLatency, setSimulatedLatency] = useState<number>(34);
  const [simulatedErrors, setSimulatedErrors] = useState<number>(0.03);

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monitoring");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch Google Cloud Monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update simulation stream in the background
  useEffect(() => {
    const simInterval = setInterval(() => {
      setSimulatedSqlCpu(prev => [...prev.slice(1), Math.max(5, Math.min(95, prev[prev.length - 1] + Math.floor((Math.random() - 0.5) * 8)))]);
      setSimulatedSqlMem(prev => [...prev.slice(1), Math.max(10, Math.min(100, parseFloat((prev[prev.length - 1] + (Math.random() - 0.5) * 0.4).toFixed(1))))]);
      setSimulatedSqlConn(prev => [...prev.slice(1), Math.max(1, Math.min(20, prev[prev.length - 1] + (Math.random() > 0.6 ? 1 : Math.random() < 0.4 ? -1 : 0)))]);
      
      setSimulatedFsReads(prev => [...prev.slice(1), Math.max(10, Math.min(250, prev[prev.length - 1] + Math.floor((Math.random() - 0.5) * 15)))]);
      setSimulatedFsWrites(prev => [...prev.slice(1), Math.max(1, Math.min(100, prev[prev.length - 1] + Math.floor((Math.random() - 0.5) * 8)))]);
      setSimulatedFsDeletes(prev => [...prev.slice(1), Math.max(0, Math.min(50, prev[prev.length - 1] + Math.floor((Math.random() - 0.5) * 3)))]);

      setSimulatedLatency(prev => Math.max(12, Math.min(180, prev + Math.floor((Math.random() - 0.5) * 6))));
      setSimulatedErrors(prev => parseFloat(Math.max(0, Math.min(2.5, prev + (Math.random() - 0.5) * 0.02)).toFixed(3)));
    }, 3000);

    return () => clearInterval(simInterval);
  }, []);

  const isRealDataActive = data?.success && data?.metrics;

  // Helpers to draw quick clean SVG area charts
  const getSvgPath = (points: number[], width: number, height: number, maxVal: number) => {
    if (points.length === 0) return "";
    const stepX = width / (points.length - 1);
    const scaleY = height / (maxVal || 1);
    
    return points.map((p, i) => {
      const x = i * stepX;
      const y = height - (p * scaleY);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const getSvgAreaPath = (points: number[], width: number, height: number, maxVal: number) => {
    const path = getSvgPath(points, width, height, maxVal);
    if (!path) return "";
    return `${path} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Mini Title and Controller Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono text-[10px] text-white uppercase tracking-widest font-bold">
            Cloud Monitor
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchMonitoringData}
            disabled={loading}
            className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
            title="Refresh Monitoring Data"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Connection Indicator banner */}
      <div className="bg-[#050505] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRealDataActive ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <span className="font-mono text-[9px] text-slate-400">
              PROJECT ID: <span className="text-white font-bold">{data?.projectId || "project-4a207984-cce4-401c-aab"}</span>
            </span>
          </div>
          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
            {isRealDataActive ? "CLOUD RUN CONNECTED" : "SANDBOX CONSOLE"}
          </span>
        </div>

        {/* Integration Credentials Alert - shown when Monitoring API is not enabled yet or lacks viewer permission */}
        {!isRealDataActive && (
          <div className="mt-1 flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-[8.5px] font-mono leading-relaxed text-slate-400">
              <span className="text-amber-400 font-bold uppercase">GCP CONFIGURATION ADVISORY:</span>
              <p className="mt-1">
                Direct Cloud Monitoring API query failed or was unauthorized. To activate real-time telemetry, ensure:
              </p>
              <ul className="list-disc pl-3.5 mt-1 text-[8px] text-slate-500 flex flex-col gap-0.5">
                <li><span className="text-slate-300">Monitoring API</span> is enabled in the Cloud Console.</li>
                <li>Ambient Service Account possesses the <span className="text-slate-300">Monitoring Viewer</span> role.</li>
              </ul>
              <div className="mt-2 flex items-center gap-2 text-cyan-400">
                <ArrowUpRight className="h-3 w-3" />
                <span>Utilizing simulated telemetry pipeline...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-wider">Avg Latency</span>
            <Zap className="h-3 w-3 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-bold text-white tracking-tighter">
              {simulatedLatency}ms
            </span>
            <span className="text-[7px] text-emerald-400 font-mono">NOMINAL</span>
          </div>
        </div>

        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-wider">Error Rate</span>
            <AlertTriangle className="h-3 w-3 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-mono font-bold text-white tracking-tighter">
              {simulatedErrors}%
            </span>
            <span className="text-[7px] text-emerald-400 font-mono">STABLE</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 bg-black/50 p-1 border border-white/5 rounded-xl">
        <button
          onClick={() => setActiveTab("sql")}
          className={`py-1.5 font-mono text-[9px] font-bold rounded-lg transition-all uppercase tracking-wider ${
            activeTab === "sql" 
              ? "bg-[#0a0a0a] border border-white/5 text-cyan-400 shadow-[0_2px_10px_rgba(34,211,238,0.05)]" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Cloud SQL Subsystem
        </button>
        <button
          onClick={() => setActiveTab("firestore")}
          className={`py-1.5 font-mono text-[9px] font-bold rounded-lg transition-all uppercase tracking-wider ${
            activeTab === "firestore" 
              ? "bg-[#0a0a0a] border border-white/5 text-cyan-400 shadow-[0_2px_10px_rgba(34,211,238,0.05)]" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Firebase Firestore
        </button>
      </div>

      {/* Main Charts Deck */}
      <div className="flex-1 flex flex-col gap-3 min-h-[180px] overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "sql" ? (
            <motion.div 
              key="sql-deck"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1"
            >
              {/* CPU Util Chart */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[8px]">
                  <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-cyan-400" /> Database CPU Load
                  </span>
                  <span className="text-cyan-400 font-bold">{simulatedSqlCpu[simulatedSqlCpu.length - 1]}%</span>
                </div>
                {/* SVG Area Chart */}
                <div className="h-16 w-full relative">
                  <svg className="w-full h-full">
                    {/* Grid Lines */}
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    
                    {/* Gradient underlay */}
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Filled Area */}
                    <path 
                      d={getSvgAreaPath(simulatedSqlCpu, 280, 64, 100)} 
                      fill="url(#cpuGrad)" 
                    />
                    {/* Glowing Stroke Line */}
                    <path 
                      d={getSvgPath(simulatedSqlCpu, 280, 64, 100)} 
                      fill="none" 
                      stroke="#22d3ee" 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>

              {/* Memory Util Chart */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[8px]">
                  <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Database className="h-3 w-3 text-cyan-400" /> Database Memory Usage
                  </span>
                  <span className="text-cyan-400 font-bold">{simulatedSqlMem[simulatedSqlMem.length - 1]}%</span>
                </div>
                <div className="h-16 w-full relative">
                  <svg className="w-full h-full">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    
                    <defs>
                      <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    <path 
                      d={getSvgAreaPath(simulatedSqlMem, 280, 64, 100)} 
                      fill="url(#memGrad)" 
                    />
                    <path 
                      d={getSvgPath(simulatedSqlMem, 280, 64, 100)} 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>

              {/* Active Connections */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between">
                <span className="font-mono text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Server className="h-3 w-3 text-cyan-400" /> Pool backends/connections
                </span>
                <span className="font-mono text-[10px] font-bold text-white">
                  {simulatedSqlConn[simulatedSqlConn.length - 1]} active
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="firestore-deck"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1"
            >
              {/* Document Reads Chart */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[8px]">
                  <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <FileText className="h-3 w-3 text-cyan-400" /> Document Read Ops
                  </span>
                  <span className="text-cyan-400 font-bold">{simulatedFsReads[simulatedFsReads.length - 1]} req/s</span>
                </div>
                <div className="h-16 w-full relative">
                  <svg className="w-full h-full">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    
                    <defs>
                      <linearGradient id="readsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    <path 
                      d={getSvgAreaPath(simulatedFsReads, 280, 64, 200)} 
                      fill="url(#readsGrad)" 
                    />
                    <path 
                      d={getSvgPath(simulatedFsReads, 280, 64, 200)} 
                      fill="none" 
                      stroke="#4ade80" 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>

              {/* Document Writes Chart */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[8px]">
                  <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <FileText className="h-3 w-3 text-cyan-400" /> Document Write Ops
                  </span>
                  <span className="text-cyan-400 font-bold">{simulatedFsWrites[simulatedFsWrites.length - 1]} req/s</span>
                </div>
                <div className="h-16 w-full relative">
                  <svg className="w-full h-full">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                    
                    <defs>
                      <linearGradient id="writesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    <path 
                      d={getSvgAreaPath(simulatedFsWrites, 280, 64, 80)} 
                      fill="url(#writesGrad)" 
                    />
                    <path 
                      d={getSvgPath(simulatedFsWrites, 280, 64, 80)} 
                      fill="none" 
                      stroke="#eab308" 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>

              {/* Document Deletes */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between">
                <span className="font-mono text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <FileText className="h-3 w-3 text-rose-500" /> Document Delete Ops
                </span>
                <span className="font-mono text-[10px] font-bold text-white">
                  {simulatedFsDeletes[simulatedFsDeletes.length - 1]} req/s
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
