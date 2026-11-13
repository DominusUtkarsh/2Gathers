"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Users,
  CopyX,
  Layers,
  ClipboardX,
  CameraOff,
} from "lucide-react";
import { ProctoringSubmissionPayload } from "@/lib/proctoring/types";

interface ProctoringReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ProctoringSubmissionPayload | null;
  taskTitle: string;
}

export function ProctoringReportModal({
  isOpen,
  onClose,
  report,
  taskTitle,
}: ProctoringReportModalProps) {
  if (!isOpen || !report) return null;

  const isPassed = !report.isDisqualified && report.trustScore >= 60 && !report.isFlagged;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  isPassed
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                {isPassed ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Invigilation & Integrity Audit</h2>
                <p className="text-xs text-slate-400">{taskTitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Result Banner */}
          <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
              isPassed
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                : "border-red-500/40 bg-red-950/30 text-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPassed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
                <span className="font-bold">
                  {isPassed ? "Session Verified • High Integrity" : "Session Flagged for Review"}
                </span>
              </div>
              <span className="font-mono text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-black/40">
                Score: {report.trustScore}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              {isPassed
                ? "The candidate maintained continuous single-person webcam presence without unpermitted external activity."
                : "Multiple suspicious events or strikes were recorded. Reward claim is marked for administrator verification."}
            </p>
          </div>

          {/* Photo Comparison (Baseline vs Final) */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-800/40 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Candidate Identity Verification (Start vs Submission)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-center">
                <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-lg border border-slate-700 bg-black">
                  {report.baselineSnapshot ? (
                    <img
                      src={report.baselineSnapshot}
                      alt="Baseline"
                      className="h-full w-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                      No photo
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
                    BASELINE CHECK-IN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Session Registered</p>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-lg border border-slate-700 bg-black">
                  {report.finalSnapshot ? (
                    <img
                      src={report.finalSnapshot}
                      alt="Final Submission"
                      className="h-full w-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                      No photo
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-mono text-blue-400">
                    AT SUBMISSION
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Final Verification</p>
              </div>
            </div>
          </div>

          {/* Metrics Matrix */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Eye className="h-3.5 w-3.5 text-blue-400" />
                <span>Face Left Frame</span>
              </div>
              <p className="mt-1 text-base font-bold font-mono text-white">
                {report.metrics.faceLostCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                <span>Multi-Person</span>
              </div>
              <p className="mt-1 text-base font-bold font-mono text-white">
                {report.metrics.multiFaceCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400">
                <CopyX className="h-3.5 w-3.5 text-amber-400" />
                <span>Tab Switches</span>
              </div>
              <p className="mt-1 text-base font-bold font-mono text-white">
                {report.metrics.tabSwitchCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ClipboardX className="h-3.5 w-3.5 text-rose-400" />
                <span>Copy Attempts</span>
              </div>
              <p className="mt-1 text-base font-bold font-mono text-white">
                {report.metrics.copyCount ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ClipboardX className="h-3.5 w-3.5 text-orange-400" />
                <span>Paste Attempts</span>
              </div>
              <p className="mt-1 text-base font-bold font-mono text-white">
                {report.metrics.pasteCount ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400">
                <CameraOff className="h-3.5 w-3.5 text-red-400" />
                <span>Screenshot Attempts</span>
              </div>
              <p className="mt-1 text-base font-bold font-mono text-white">
                {report.metrics.screenshotCount ?? 0}
              </p>
            </div>
          </div>

          {/* Incidents Timeline */}
          {report.violations && report.violations.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-xs">
              <h3 className="font-semibold text-slate-300 pb-2 border-b border-slate-800">
                Flagged Incidents Log ({report.violations.length})
              </h3>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                {report.violations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-start gap-3 rounded-lg bg-slate-900/80 p-2 border border-slate-800"
                  >
                    {v.snapshotUrl && (
                      <img
                        src={v.snapshotUrl}
                        alt="Violation snapshot"
                        className="h-10 w-10 rounded object-cover border border-red-500/50 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-red-400">{v.type}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(v.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{v.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-semibold text-white transition"
            >
              Close Report
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
