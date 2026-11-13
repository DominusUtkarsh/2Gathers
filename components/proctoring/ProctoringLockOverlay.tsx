"use client";

import { useEffect, useState } from "react";
import { Camera, AlertOctagon, RefreshCw, ShieldOff, Lock, Maximize } from "lucide-react";
import { ProctoringStatus } from "@/lib/proctoring/types";

interface ProctoringLockOverlayProps {
  status: ProctoringStatus;
  isCameraActive: boolean;
  isFullscreen?: boolean;
  enforceFullscreen?: boolean;
  strikes: number;
  maxStrikes: number;
  onOpenSetup: () => void;
  onRestartCamera: () => void;
  onRequestFullscreen?: () => void;
}

function checkLiveFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as unknown as {
    fullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export function ProctoringLockOverlay({
  status,
  isCameraActive,
  isFullscreen = true,
  enforceFullscreen = true,
  strikes,
  maxStrikes,
  onOpenSetup,
  onRestartCamera,
  onRequestFullscreen,
}: ProctoringLockOverlayProps) {
  const [liveFullscreen, setLiveFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    function handleFsChange() {
      setLiveFullscreen(checkLiveFullscreen());
    }

    setLiveFullscreen(checkLiveFullscreen());
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, []);

  const isDisqualified = status === "disqualified" || strikes >= maxStrikes;
  const isCameraLost = (status === "active" || status === "ready") && !isCameraActive;

  // Real-time synchronization check against both props and live DOM fullscreen state
  const effectiveFullscreen =
    isFullscreen ||
    liveFullscreen ||
    (typeof document !== "undefined" ? checkLiveFullscreen() : false);
  const isExitFullscreen = status === "active" && enforceFullscreen && !effectiveFullscreen;

  // If session is active and camera is running and in fullscreen, do not lock
  if ((status === "active" || status === "ready") && isCameraActive && !isExitFullscreen && !isDisqualified) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 text-center text-white">
      {isDisqualified ? (
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-500 border border-red-500/30">
            <ShieldOff className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-red-400">Task Session Disqualified</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            This task has been disqualified because the invigilation limit was exceeded ({strikes}/{maxStrikes} strikes).
            Anti-cheating violations were logged and reported for this session.
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page to Reset
            </button>
          </div>
        </div>
      ) : isExitFullscreen ? (
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
            <Maximize className="h-8 w-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-amber-400">Fullscreen Mode Required</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            You exited fullscreen mode or minimized the window. This was recorded as an invigilation violation and your trust score was penalized.
          </p>
          <p className="text-xs text-amber-300 font-medium">
            To prevent switching tabs or accessing external aid, the editor is locked until you return to fullscreen mode.
          </p>
          <div className="pt-2">
            <button
              onClick={onRequestFullscreen}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/30 transition hover:scale-105 active:scale-95"
            >
              <Maximize className="h-4 w-4" />
              Return to Fullscreen & Resume
            </button>
          </div>
        </div>
      ) : isCameraLost ? (
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
            <AlertOctagon className="h-8 w-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-amber-400">Webcam Feed Interrupted</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            The code editor has been locked because your camera feed was lost or disconnected.
            To prevent cheating, video invigilation must remain uninterrupted.
          </p>
          <div className="pt-2">
            <button
              onClick={onRestartCamera}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/30 transition"
            >
              <Camera className="h-4 w-4" />
              Reconnect Webcam
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Camera Invigilation Required</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            To ensure assessment integrity and verify that you are performing this task yourself without assistance,
            you must complete the quick camera check before starting.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenSetup}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 active:scale-95"
            >
              <Camera className="h-4 w-4" />
              Open Camera & Start Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
