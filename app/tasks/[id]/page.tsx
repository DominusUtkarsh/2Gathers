"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Zap, Shield, ShieldCheck, Camera } from "lucide-react";
import { TaskEditor } from "@/components/TaskEditor";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useProctoring, AccountBiometricFace } from "@/hooks/useProctoring";
import { ProctoringSetupModal } from "@/components/proctoring/ProctoringSetupModal";
import { ProctoringHUD } from "@/components/proctoring/ProctoringHUD";
import { ProctoringViolationToast } from "@/components/proctoring/ProctoringViolationToast";
import { ProctoringReportModal } from "@/components/proctoring/ProctoringReportModal";
import { ProctoringSubmissionPayload } from "@/lib/proctoring/types";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
  rewardTokens: number;
  timeLimit?: number;
  functionName: string;
  starterCode: string;
  language: string;
  supportedLanguages: string[];
  testCases: { input: string; expectedOutput: string; description: string }[];
}

const difficultyColor = {
  BEGINNER: "bg-emerald-100 text-emerald-800",
  INTERMEDIATE: "bg-blue-100 text-blue-800",
  ADVANCED: "bg-amber-100 text-amber-800",
  EXPERT: "bg-red-100 text-red-800",
};

export default function TaskDetailPage({ params: paramsProm }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = use(paramsProm);
  const { token, user } = useAuth();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<ProctoringSubmissionPayload | null>(null);
  const [accountFace, setAccountFace] = useState<AccountBiometricFace | null>(null);

  const hasPromptedSetupRef = useRef(false);

  // Fetch official registered biometric identity for this account
  useEffect(() => {
    if (!token) return;
    let isActive = true;

    async function fetchBiometricProfile() {
      try {
        const res = await fetch("/api/users/biometric-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (isActive && json.success && json.data.hasRegisteredFace) {
          setAccountFace({
            facePhoto: json.data.facePhoto,
            signature: json.data.signature,
            candidateName: json.data.candidateName || user?.username,
          });
        }
      } catch (err) {
        console.warn("Could not load account biometric profile:", err);
      }
    }

    fetchBiometricProfile();

    return () => {
      isActive = false;
    };
  }, [token, user?.username]);

  const handleDisqualified = useCallback((reason: string) => {
    console.warn("Disqualified from task:", reason);
  }, []);

  // Invigilation Engine with account identity verification and mandatory fullscreen
  const proctoring = useProctoring({
    taskId,
    maxStrikes: 5,
    enforceFullscreen: true,
    accountVerifiedFace: accountFace,
    onDisqualified: handleDisqualified,
  });

  // Fetch task definition
  useEffect(() => {
    if (!taskId) return;
    let isActive = true;

    async function loadTask() {
      setLoading(true);
      try {
        const response = await fetch(`/api/tasks/${taskId}?language=${encodeURIComponent(selectedLanguage)}`);
        const data = await response.json();

        if (isActive && data.success) {
          setTask(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch task:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      isActive = false;
    };
  }, [taskId, selectedLanguage]);

  // Prompt setup modal once on initial load
  useEffect(() => {
    if (task && proctoring.status === "uninitialized" && !hasPromptedSetupRef.current) {
      hasPromptedSetupRef.current = true;
      setShowSetupModal(true);
    }
  }, [task, proctoring.status]);

  const handleOpenReport = useCallback(() => {
    setReportData(proctoring.getSubmissionPayload());
    setShowReportModal(true);
  }, [proctoring]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-slate-600">Task not found</p>
        <Link href="/tasks" className="text-blue-600 hover:underline">
          Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 proctoring-protected select-none">
      {/* Anti-cheat CSS: suppress print / PDF export and text selection */}
      <style jsx global>{`
        @media print {
          html, body {
            display: none !important;
            visibility: hidden !important;
          }
        }
        .proctoring-protected, .proctoring-protected * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
      `}</style>

      {/* Background Watermark for proctored anti-screen capture / leakage tracking */}
      {proctoring.status === "active" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden opacity-[0.035] flex flex-wrap content-start items-center justify-around gap-16 p-8 text-xs font-mono font-bold uppercase tracking-widest text-slate-900 rotate-[-20deg]"
        >
          {Array.from({ length: 32 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap">
              {user?.username || "CANDIDATE"} • 2GATHERS PROCTORED • ID:{taskId}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 text-blue-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Link>

          {/* Invigilation Quick Status Pill */}
          <div className="flex items-center gap-2">
            {proctoring.status === "active" ? (
              <button
                type="button"
                onClick={handleOpenReport}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Invigilation Active (Trust: {proctoring.trustScore}%)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSetupModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
              >
                <Camera className="h-3.5 w-3.5 text-blue-600" />
                <span>Enable Camera for Assessment</span>
              </button>
            )}
          </div>
        </div>

        {/* Task Details Banner */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 mb-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  <Shield className="h-3 w-3" />
                  PROCTORED TASK
                </span>
                <span className="text-xs text-slate-500">
                  {accountFace?.facePhoto
                    ? `Verified candidate lock active for ${accountFace.candidateName || user?.username}`
                    : "Continuous identity & anti-cheat monitoring enabled"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
              <p className="mt-2 text-slate-600">{task.description}</p>
            </div>

            <span
              className={cn(
                "inline-block rounded px-3 py-1 text-sm font-semibold self-start",
                difficultyColor[task.difficulty]
              )}
            >
              {task.difficulty}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1">
                {task.category}
              </span>
            </div>
            {task.timeLimit && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="h-4 w-4" />
                <span>{task.timeLimit} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-600">+{task.rewardTokens} tokens</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Sidebars & Right Code Editor */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Task Info & Rules */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Invigilation Protocol Reminder */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 select-none">
                <div className="flex items-center gap-2 font-semibold text-blue-900 mb-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <h3>Invigilation Rules</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-blue-800">
                  <li>• Keep camera turned on & room well lit.</li>
                  <li>• Stay centered in front of the camera frame.</li>
                  <li>• No second person allowed in frame.</li>
                  <li>• Fullscreen locked: tab switch / minimize restricted.</li>
                  <li>• <strong>Copying questions or answers is blocked.</strong></li>
                  <li>• <strong>Pasting code or text into editor is blocked.</strong></li>
                  <li>• <strong>Screenshots & screen captures are restricted.</strong></li>
                  <li>• Identity strictly matched to registered candidate.</li>
                </ul>
              </div>

              {/* Test Cases */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Test Cases</h3>
                <div className="space-y-3">
                  {task.testCases.map((testCase, idx) => (
                    <div key={idx} className="rounded bg-slate-50 p-3 text-xs">
                      <p className="mb-1 font-medium text-slate-700">{testCase.description}</p>
                      <p className="text-slate-600">
                        Input: <span className="font-mono bg-white px-1">{testCase.input}</span>
                      </p>
                      <p className="text-slate-600">
                        Output: <span className="font-mono bg-white px-1">{testCase.expectedOutput}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Tips</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>• Read the problem carefully</li>
                  <li>• Test with edge cases</li>
                  <li>• All tests must pass</li>
                  <li>• Earn tokens on success</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            <TaskEditor
              taskId={task.id}
              starterCode={task.starterCode}
              language={task.language}
              supportedLanguages={task.supportedLanguages}
              onLanguageChange={setSelectedLanguage}
              timeLimit={task.timeLimit}
              proctoringStatus={proctoring.status}
              isCameraActive={proctoring.isCameraActive}
              isFullscreen={proctoring.isFullscreen}
              enforceFullscreen={true}
              strikes={proctoring.strikes}
              maxStrikes={proctoring.maxStrikes}
              trustScore={proctoring.trustScore}
              onOpenSetup={() => setShowSetupModal(true)}
              onRestartCamera={proctoring.startCamera}
              onRequestFullscreen={proctoring.requestFullscreen}
              onPasteAttempt={proctoring.handlePasteAttempt}
              onCopyAttempt={proctoring.handleCopyAttempt}
              getProctoringPayload={proctoring.getSubmissionPayload}
              onViewProctoringReport={handleOpenReport}
            />
          </div>
        </div>
      </div>

      {/* Proctoring Modals & HUD */}
      <ProctoringSetupModal
        isOpen={showSetupModal}
        isCameraActive={proctoring.isCameraActive}
        cameraError={proctoring.cameraError}
        faceDetected={proctoring.faceDetected}
        faceCount={proctoring.faceCount}
        isObstructed={proctoring.isObstructed}
        baselineSnapshot={proctoring.baselineSnapshot}
        accountVerifiedFace={accountFace}
        attachVideoElement={proctoring.attachVideoElement}
        onStartCamera={proctoring.startCamera}
        onCalibrate={proctoring.calibrateBaseline}
        onConfirmStart={async () => {
          const ok = await proctoring.startSession();
          if (ok) {
            setShowSetupModal(false);
            // Save face registration if first-time
            if (!accountFace?.facePhoto && proctoring.baselineSnapshot && token) {
              fetch("/api/users/biometric-profile", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  facePhoto: proctoring.baselineSnapshot,
                  signature: proctoring.baselineSignature || [],
                }),
              }).catch(() => undefined);
            }
          }
          return ok;
        }}
        onClose={() => setShowSetupModal(false)}
      />

      {/* Floating HUD Widget during active session */}
      {proctoring.status === "active" && (
        <ProctoringHUD
          status={proctoring.status}
          isCameraActive={proctoring.isCameraActive}
          faceDetected={proctoring.faceDetected}
          faceCount={proctoring.faceCount}
          isLookingAway={proctoring.isLookingAway}
          isObstructed={proctoring.isObstructed}
          similarityScore={proctoring.similarityScore}
          trustScore={proctoring.trustScore}
          strikes={proctoring.strikes}
          maxStrikes={proctoring.maxStrikes}
          violations={proctoring.violations}
          isFullscreen={proctoring.isFullscreen}
          durationSeconds={proctoring.durationSeconds}
          attachVideoElement={proctoring.attachVideoElement}
          onRequestFullscreen={proctoring.requestFullscreen}
        />
      )}

      {/* Real-time Violation Toast */}
      <ProctoringViolationToast
        violation={proctoring.activeViolation}
        strikes={proctoring.strikes}
        maxStrikes={proctoring.maxStrikes}
        onDismiss={proctoring.dismissActiveViolation}
      />

      {/* Detailed Post-Submission / Audit Report Modal */}
      <ProctoringReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        report={reportData}
        taskTitle={task.title}
      />
    </div>
  );
}
