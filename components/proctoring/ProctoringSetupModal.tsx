"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  Users,
  CopyX,
  Sparkles,
  RefreshCw,
  X,
  UserCheck,
  UserX,
  Maximize,
} from "lucide-react";
import { AccountBiometricFace } from "@/hooks/useProctoring";

interface ProctoringSetupModalProps {
  isOpen: boolean;
  isCameraActive: boolean;
  cameraError: string | null;
  faceDetected: boolean;
  faceCount: number;
  isObstructed: boolean;
  baselineSnapshot: string | null;
  accountVerifiedFace?: AccountBiometricFace | null;
  attachVideoElement: (el: HTMLVideoElement | null) => void;
  onStartCamera: () => Promise<boolean>;
  onCalibrate: () => Promise<{ success: boolean; error?: string }>;
  onConfirmStart: () => Promise<boolean>;
  onClose?: () => void;
}

export function ProctoringSetupModal({
  isOpen,
  isCameraActive,
  cameraError,
  faceDetected,
  faceCount,
  isObstructed,
  baselineSnapshot,
  accountVerifiedFace,
  attachVideoElement,
  onStartCamera,
  onCalibrate,
  onConfirmStart,
  onClose,
}: ProctoringSetupModalProps) {
  const [step, setStep] = useState<"camera" | "rules" | "ready">("camera");
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const cameraRequestedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isCameraActive && !cameraRequestedRef.current) {
      cameraRequestedRef.current = true;
      onStartCamera();
    }
  }, [isOpen, isCameraActive, onStartCamera]);

  useEffect(() => {
    if (!isOpen) {
      cameraRequestedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleCaptureBaseline() {
    setCalibrating(true);
    setCalibrationError(null);
    try {
      const res = await onCalibrate();
      if (res.success) {
        setStep("rules");
      } else {
        setCalibrationError(res.error || "Calibration failed. Please adjust your position.");
      }
    } catch {
      setCalibrationError("An unexpected error occurred during calibration.");
    } finally {
      setCalibrating(false);
    }
  }

  async function handleFinalStart() {
    if (!agreed) return;
    setStarting(true);
    try {
      // Trigger fullscreen synchronously with the click event before any async operations
      if (typeof document !== "undefined" && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (fsErr) {
          console.warn("Fullscreen auto-request notice:", fsErr);
        }
      }
      await onConfirmStart();
    } finally {
      setStarting(false);
    }
  }

  const hasAccountPhoto = Boolean(accountVerifiedFace?.facePhoto);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Invigilated Task Environment</h2>
                <p className="text-xs text-slate-400">
                  {hasAccountPhoto
                    ? `Verifying identity against registered account (${accountVerifiedFace?.candidateName || "candidate"})`
                    : "Registering official candidate face & activity monitoring"}
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Stepper Content */}
          {step === "camera" && (
            <div className="mt-5 space-y-4">
              {/* Account Registration Banner */}
              {hasAccountPhoto ? (
                <div className="flex items-center gap-3 rounded-xl border border-blue-500/40 bg-blue-950/30 p-3 text-xs">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-blue-400/50 shrink-0">
                    <img
                      src={accountVerifiedFace?.facePhoto || ""}
                      alt="Registered"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" />
                      Official Identity Registered ({accountVerifiedFace?.candidateName})
                    </p>
                    <p className="text-slate-300 mt-0.5">
                      Your live camera must match this registered photo. Proxy test-taking by friends or peers is strictly blocked.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-purple-500/40 bg-purple-950/20 p-3 text-xs">
                  <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-purple-300">
                      First-Time Biometric Registration
                    </p>
                    <p className="text-slate-300 mt-0.5">
                      The face you register now will be permanently locked to your 2Gathers profile for all future tasks and milestones. Only you will be able to take assessments.
                    </p>
                  </div>
                </div>
              )}

              {/* Video Preview Box */}
              <div className="relative mx-auto h-64 w-full max-w-md overflow-hidden rounded-xl border-2 border-slate-700 bg-black shadow-inner">
                <video
                  ref={attachVideoElement}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />

                {/* Face Alignment Oval Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className={`h-48 w-36 rounded-[50%] border-2 border-dashed transition-all duration-300 ${
                      faceDetected && faceCount === 1 && !isObstructed
                        ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                        : "border-amber-400/80 bg-amber-500/5 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                    }`}
                  />
                </div>

                {/* Status Badge Over Video */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-black/75 px-3 py-1.5 backdrop-blur-sm text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isCameraActive && faceDetected && faceCount === 1 && !isObstructed
                          ? "bg-emerald-400 animate-pulse"
                          : "bg-amber-400"
                      }`}
                    />
                    <span className="font-medium text-slate-200">
                      {!isCameraActive
                        ? "Connecting camera..."
                        : isObstructed
                        ? "⚠️ Room too dark / camera covered"
                        : !faceDetected
                        ? "No face detected in frame"
                        : faceCount > 1
                        ? "⚠️ Multiple faces detected"
                        : "✓ Face aligned and verified"}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono">Live Webcam</span>
                </div>
              </div>

              {cameraError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{cameraError}. Please grant camera permissions in your browser.</span>
                  <button
                    onClick={onStartCamera}
                    className="ml-auto underline font-semibold hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              )}

              {calibrationError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
                  <UserX className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{calibrationError}</span>
                </div>
              )}

              <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-3 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Instructions:
                </p>
                <p>1. Center your face inside the dashed oval frame.</p>
                <p>2. Keep room well lit (avoid turning off lights or sitting in complete darkness).</p>
                <p>3. Look directly into the webcam and click capture.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCaptureBaseline}
                  disabled={!isCameraActive || calibrating || !faceDetected || faceCount !== 1 || isObstructed}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition"
                >
                  {calibrating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Verifying Face...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      {hasAccountPhoto ? "Verify & Continue" : "Register Identity & Continue"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "rules" && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                {baselineSnapshot && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-emerald-500/40 shrink-0">
                    <img
                      src={baselineSnapshot}
                      alt="Baseline"
                      className="h-full w-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[9px] font-bold text-center text-white py-0.5">
                      CONFIRMED
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white">Candidate Identity Verified</h4>
                  <p className="text-xs text-slate-400">
                    Your baseline facial signature is locked for this session. Maintain continuous camera presence throughout the task.
                  </p>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Invigilation Protocol:
                </p>

                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-800/30 p-2.5">
                    <Eye className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">Continuous Camera Presence</p>
                      <p className="text-slate-400 mt-0.5">Do not leave the desk or turn off room lights.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-800/30 p-2.5">
                    <Users className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">No Secondary Assistance</p>
                      <p className="text-slate-400 mt-0.5">No second person is allowed in the camera frame.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-800/30 p-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">Identity Lock</p>
                      <p className="text-slate-400 mt-0.5">You must do the task yourself; substitutions are automatically flagged.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-950/20 p-2.5">
                    <Maximize className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">Mandatory Fullscreen & No Tab Switch</p>
                      <p className="text-slate-400 mt-0.5">Launches in fullscreen automatically. Exiting, minimizing, or switching tabs locks the editor and incurs strikes.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-950/20 p-3 text-xs cursor-pointer hover:bg-blue-950/30 transition">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-300">
                  I confirm that I am the registered candidate, will perform this task independently without external aid,
                  and consent to automated video and browser monitoring.
                </span>
              </label>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("camera")}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  ← Recalibrate Camera
                </button>

                <button
                  onClick={handleFinalStart}
                  disabled={!agreed || starting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition"
                >
                  {starting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Launching Invigilation...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Start Monitored Task
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
