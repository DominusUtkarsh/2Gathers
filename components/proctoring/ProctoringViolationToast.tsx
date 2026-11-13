"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { ViolationRecord } from "@/lib/proctoring/types";

interface ProctoringViolationToastProps {
  violation: ViolationRecord | null;
  strikes: number;
  maxStrikes: number;
  onDismiss: () => void;
}

export function ProctoringViolationToast({
  violation,
  strikes,
  maxStrikes,
  onDismiss,
}: ProctoringViolationToastProps) {
  if (!violation) return null;

  const isCritical = violation.severity === "critical" || violation.severity === "high";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-20 left-1/2 z-50 -translate-x-1/2 w-full max-w-lg px-4"
      >
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md ${
            isCritical
              ? "border-red-500/50 bg-red-950/90 text-red-100 ring-2 ring-red-500/30"
              : "border-amber-500/50 bg-amber-950/90 text-amber-100 ring-2 ring-amber-500/30"
          }`}
        >
          <div
            className={`rounded-lg p-2 ${
              isCritical ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {isCritical ? <ShieldAlert className="h-6 w-6 animate-pulse" /> : <AlertTriangle className="h-6 w-6" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Invigilation Warning • Strike {strikes} of {maxStrikes}
              </span>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-white transition"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h4 className="mt-1 text-sm font-semibold text-white">
              {violation.message}
            </h4>
            {violation.details && (
              <p className="mt-1 text-xs text-slate-300 font-mono bg-black/40 px-2 py-1 rounded truncate">
                {violation.details}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Please maintain focus on the task. Exceeding {maxStrikes} strikes will invalidate this session.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
