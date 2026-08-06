import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useJeetvis } from "../context/JeetvisContext";
import { 
  FileText, 
  FileSpreadsheet, 
  FileBox, 
  Folder, 
  File, 
  Search, 
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Clock,
  Home
} from "lucide-react";
import { GoogleDriveFile } from "../types";
import { fetchFolderContent } from "../lib/workspaceAuth";

export default function DriveExplorer() {
  const { 
    driveFiles, 
    isWorkspaceLoading, 
    refreshWorkspaceData, 
    openDriveFile,
    workspaceToken
  } = useJeetvis();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentFolder, setCurrentFolder] = useState<{id: string, name: string} | null>(null);
  const [folderStack, setFolderStack] = useState<{id: string, name: string}[]>([]);
  const [folderFiles, setFolderFiles] = useState<GoogleDriveFile[]>([]);
  const [isFolderLoading, setIsFolderLoading] = useState(false);

  const navigateToFolder = async (folder: {id: string, name: string}) => {
    if (!workspaceToken) return;
    setIsFolderLoading(true);
    try {
      const files = await fetchFolderContent(workspaceToken, folder.id);
      setFolderFiles(files);
      setFolderStack(prev => [...prev, folder]);
      setCurrentFolder(folder);
      setSearchTerm("");
    } catch (err) {
      console.error("Navigation failed:", err);
    } finally {
      setIsFolderLoading(false);
    }
  };

  const navigateBack = () => {
    const newStack = [...folderStack];
    newStack.pop();
    setFolderStack(newStack);
    if (newStack.length === 0) {
      setCurrentFolder(null);
      setFolderFiles([]);
    } else {
      const parent = newStack[newStack.length - 1];
      setCurrentFolder(parent);
      loadFolder(parent.id);
    }
  };

  const loadFolder = async (id: string) => {
    if (!workspaceToken) return;
    setIsFolderLoading(true);
    try {
      const files = await fetchFolderContent(workspaceToken, id);
      setFolderFiles(files);
    } catch (err) {
      console.error("Reload failed:", err);
    } finally {
      setIsFolderLoading(false);
    }
  };

  const resetToRoot = () => {
    setFolderStack([]);
    setCurrentFolder(null);
    setFolderFiles([]);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") return <Folder className="h-4 w-4 text-amber-400" />;
    if (mimeType === "application/vnd.google-apps.document") return <FileText className="h-4 w-4 text-blue-400" />;
    if (mimeType === "application/vnd.google-apps.spreadsheet") return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
    if (mimeType === "application/vnd.google-apps.presentation") return <FileBox className="h-4 w-4 text-orange-400" />;
    return <File className="h-4 w-4 text-slate-400" />;
  };

  const displayFiles = currentFolder ? folderFiles : driveFiles;
  const filteredFiles = displayFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileClick = (file: GoogleDriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      navigateToFolder({id: file.id, name: file.name});
    } else {
      openDriveFile(file);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  };

  if (!workspaceToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black/20 rounded-xl border border-white/5">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
           <Search className="h-6 w-6 text-cyan-400/50" />
        </div>
        <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
          Workspace authentication required<br/>for remote Drive synchronization.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050505]/60 border border-white/5 rounded-2xl backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="p-4 border-b border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-[10px] text-white uppercase tracking-widest font-bold">Drive Explorer</span>
          </div>
          <div className="flex items-center gap-2">
            {currentFolder && (
              <button 
                onClick={resetToRoot}
                className="text-slate-500 hover:text-cyan-400 transition-colors"
                title="Root View"
              >
                <Home className="h-3 w-3" />
              </button>
            )}
            <button 
              onClick={() => currentFolder ? loadFolder(currentFolder.id) : refreshWorkspaceData()}
              disabled={isWorkspaceLoading || isFolderLoading}
              className="text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${(isWorkspaceLoading || isFolderLoading) ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {currentFolder && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button 
              onClick={resetToRoot}
              className="shrink-0 font-mono text-[8px] text-slate-500 hover:text-cyan-400 uppercase tracking-widest"
            >
              RECENT
            </button>
            <ChevronRight className="h-2 w-2 text-slate-700 shrink-0" />
            <div className="flex items-center gap-1.5">
              <button 
                onClick={navigateBack}
                className="shrink-0 p-0.5 hover:bg-white/5 rounded text-slate-400"
              >
                <ChevronLeft className="h-2.5 w-2.5" />
              </button>
              <span className="font-mono text-[8px] text-cyan-400 uppercase tracking-widest truncate max-w-[150px]">
                {currentFolder.name}
              </span>
            </div>
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            placeholder={currentFolder ? `SEARCH IN ${currentFolder.name.toUpperCase()}...` : "FILTER RECENT BUFFER..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded px-3 py-1.5 font-mono text-[9px] text-slate-300 focus:outline-none focus:border-cyan-500/30 transition-all uppercase tracking-wider"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="flex flex-col gap-1">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="group w-full flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-all duration-200 text-left border border-transparent hover:border-white/5"
              >
                <div className="shrink-0">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-300 truncate group-hover:text-cyan-400 transition-colors">
                      {file.name}
                    </span>
                    <ChevronRight className="h-2.5 w-2.5 text-slate-700 group-hover:text-cyan-400/50 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[8px] text-slate-600 uppercase tracking-tighter">
                      {formatDate(file.modifiedTime)}
                    </span>
                    <span className="text-slate-800">•</span>
                    <span className="font-mono text-[8px] text-slate-600 uppercase tracking-tighter">
                      {file.mimeType === "application/vnd.google-apps.folder" ? "FOLDER" : file.mimeType.split('.').pop()?.toUpperCase() || "FILE"}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="py-20 text-center">
               <Clock className="h-8 w-8 text-slate-800 mx-auto mb-3 opacity-20" />
               <p className="font-mono text-[9px] text-slate-600 italic uppercase tracking-widest">
                 {isFolderLoading || isWorkspaceLoading ? "RE-ESTABLISHING NEURAL LINK..." : "No artifacts detected, Sir."}
               </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-black/20 border-t border-white/5">
        <div className="flex items-center justify-between font-mono text-[8px] text-slate-600 uppercase tracking-widest">
           <span>Total Buffers: {filteredFiles.length}</span>
           <span className="animate-pulse">Active Sync: {isWorkspaceLoading ? "BUSY" : "IDLE"}</span>
        </div>
      </div>
    </div>
  );
}
