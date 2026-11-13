"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  History,
  AlertTriangle,
  UserCheck,
  UserX,
  Users,
  Camera,
  Activity,
} from "lucide-react";
import { ViolationRecord, ProctoringStatus } from "@/lib/proctoring/types";

interface ProctoringHUDProps {
  status: ProctoringStatus;
  isCameraActive: boolean;
  faceDetected: boolean;
  faceCount: number;
  isLookingAway: boolean;
  isObstructed: boolean;
  similarityScore: number;
  trustScore: number;
  strikes: number;
  maxStrikes: number;
  violations: ViolationRecord[];
  isFullscreen: boolean;
  durationSeconds: number;
  attachVideoElement: (el: HTMLVideoElement | null) => void;
  onRequestFullscreen: () => void;
}

export function ProctoringHUD({
  status,
  isCameraActive,
  faceDetected,
  faceCount,
  isLookingAway,
  isObstructed,
  similarityScore,
  trustScore,
  strikes,
  maxStrikes,
  violations,
  isFullscreen,
  durationSeconds,
  attachVideoElement,
  onRequestFullscreen,
}: ProctoringHUDProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLog, setShowLog] = useState(false);

  // Format timer HH:MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Determine status color & label
  let statusBadge = {
    color: "bg-emerald-500",
    text: "Verified Candidate",
    border: "border-emerald-500/40",
    icon: <UserCheck className="h-3 w-3 text-emerald-400" />,
  };

  if (!isCameraActive) {
    statusBadge = {
      color: "bg-red-500",
      text: "Camera Inactive",
      border: "border-red-500/40",
      icon: <UserX className="h-3 w-3 text-red-400" />,
    };
  } else if (isObstructed) {
    statusBadge = {
      color: "bg-red-500 animate-pulse",
      text: "Pitch Black / Covered",
      border: "border-red-500/80 ring-2 ring-red-500/40",
      icon: <AlertTriangle className="h-3 w-3 text-red-400" />,
    };
  } else if (!faceDetected || faceCount === 0) {
    statusBadge = {
      color: "bg-red-500 animate-pulse",
      text: "No Face Detected",
      border: "border-red-500/60",
      icon: <UserX className="h-3 w-3 text-red-400" />,
    };
  } else if (faceCount > 1) {
    statusBadge = {
      color: "bg-purple-500 animate-pulse",
      text: "Multiple People Detected",
      border: "border-purple-500/60",
      icon: <Users className="h-3 w-3 text-purple-400" />,
    };
  } else if (similarityScore < 0.72) {
    statusBadge = {
      color: "bg-red-500 animate-pulse",
      text: "Identity Mismatch",
      border: "border-red-500/60",
      icon: <ShieldAlert className="h-3 w-3 text-red-400" />,
    };
  } else if (isLookingAway) {
    statusBadge = {
      color: "bg-amber-500",
      text: "Looking Away",
      border: "border-amber-500/40",
      icon: <AlertTriangle className="h-3 w-3 text-amber-400" />,
    };
  }

  // Trust score color
  const trustColor =
    trustScore >= 80 ? "text-emerald-400" : trustScore >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs w-full select-none">
      <motion.div
        layout
        className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-md"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/60 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusBadge.color}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${statusBadge.color}`} />
            </span>
            <span className="font-semibold text-slate-200">Invigilation HUD</span>
            <span className="rounded bg-slate-700/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              {formatTime(durationSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowLog(!showLog)}
              title="Violation Log"
              className={`rounded p-1 transition ${
                showLog ? "bg-blue-600/30 text-blue-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onRequestFullscreen}
              title="Toggle Fullscreen"
              className="rounded p-1 text-slate-400 hover:text-white transition"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
              className="rounded p-1 text-slate-400 hover:text-white transition"
            >
              {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Minimized Pill View */}
        {isMinimized ? (
          <div className="flex items-center justify-between p-2.5 text-xs">
            <div className="flex items-center gap-2">
              {statusBadge.icon}
              <span className="font-medium text-slate-300">{statusBadge.text}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-400">
                Strikes: <span className={strikes > 0 ? "text-red-400" : "text-slate-200"}>{strikes}/{maxStrikes}</span>
              </span>
              <span className={`font-bold font-mono ${trustColor}`}>{trustScore}%</span>
            </div>
          </div>
        ) : (
          /* Expanded Body */
          <div className="p-3 space-y-2.5">
            {/* Live Video Pip */}
            <div className={`relative h-32 w-full overflow-hidden rounded-xl border-2 bg-black shadow-inner ${statusBadge.border}`}>
              <video
                ref={attachVideoElement}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />

              {/* Bounding Box / Scan Reticle Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={`h-24 w-20 rounded-lg border border-dashed transition-all duration-200 ${
                    faceDetected && faceCount === 1
                      ? "border-emerald-400/80 bg-emerald-500/5"
                      : "border-red-400/80 bg-red-500/10"
                  }`}
                />
              </div>

              {/* Status pill over video */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-black/75 px-2 py-0.5 text-[10px] backdrop-blur-sm">
                {statusBadge.icon}
                <span className="font-medium text-slate-200">{statusBadge.text}</span>
              </div>

              {similarityScore > 0 && faceDetected && faceCount === 1 && (
                <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                  ID Match: {Math.round(similarityScore * 100)}%
                </div>
              )}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Trust Score */}
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-700/50">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Trust Score</span>
                  <Activity className="h-3 w-3" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-lg font-bold font-mono ${trustColor}`}>{trustScore}%</span>
                  <span className="text-[10px] text-slate-400">integrity</span>
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      trustScore >= 80 ? "bg-emerald-500" : trustScore >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${trustScore}%` }}
                  />
                </div>
              </div>

              {/* Strikes Counter */}
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-700/50">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Violations</span>
                  <ShieldAlert className="h-3 w-3" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-lg font-bold font-mono ${strikes > 0 ? "text-red-400" : "text-slate-200"}`}>
                    {strikes}
                  </span>
                  <span className="text-[10px] text-slate-400">/ {maxStrikes} max</span>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {Array.from({ length: maxStrikes }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < strikes ? "bg-red-500" : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Expandable Violations Log Drawer */}
            <AnimatePresence>
              {showLog && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="rounded-xl border border-slate-700/60 bg-black/40 p-2 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-300 pb-1 border-b border-slate-800">
                    <span>Incident Audit Log</span>
                    <span className="text-[10px] text-slate-400">{violations.length} logged</span>
                  </div>

                  <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                    {violations.length === 0 ? (
                      <p className="text-[11px] text-slate-500 py-2 text-center">No violations recorded yet.</p>
                    ) : (
                      violations.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-start gap-2 rounded bg-slate-800/70 p-1.5 text-[11px]"
                        >
                          {v.snapshotUrl && (
                            <img
                              src={v.snapshotUrl}
                              alt="Violation"
                              className="h-8 w-8 rounded object-cover border border-red-500/40 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-red-400 truncate">{v.type}</span>
                              <span className="text-[9px] text-slate-400">
                                {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[10px] truncate">{v.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
