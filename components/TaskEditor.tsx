"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircle, RefreshCw, ShieldCheck } from "lucide-react";
import Editor from "@monaco-editor/react";
import { TestResults } from "./TestResults";
import { useAuth } from "@/context/AuthContext";
import { ProctoringStatus, ProctoringSubmissionPayload } from "@/lib/proctoring/types";
import { ProctoringLockOverlay } from "@/components/proctoring/ProctoringLockOverlay";

interface TaskEditorProps {
  taskId: string;
  starterCode: string;
  language: string;
  supportedLanguages: string[];
  onLanguageChange: (language: string) => void;
  timeLimit?: number;

  // Invigilation / Proctoring props
  proctoringStatus?: ProctoringStatus;
  isCameraActive?: boolean;
  isFullscreen?: boolean;
  enforceFullscreen?: boolean;
  strikes?: number;
  maxStrikes?: number;
  trustScore?: number;
  onOpenSetup?: () => void;
  onRestartCamera?: () => void;
  onRequestFullscreen?: () => void;
  onPasteAttempt?: (text: string) => void;
  onCopyAttempt?: (reason?: string) => void;
  getProctoringPayload?: () => ProctoringSubmissionPayload;
  onViewProctoringReport?: () => void;
}

interface SubmissionResponse {
  success: boolean;
  data?: {
    testResults: { test: string; passed: boolean; expected: string; actual: string }[];
    passedTests: number;
    totalTests: number;
    allPassed: boolean;
    tokensEarned: number;
    alreadyRewarded?: boolean;
    mode?: "run" | "submit";
    message: string;
    isProctoringFlagged?: boolean;
    proctoringTrustScore?: number;
  };
  error?: string;
}

export function TaskEditor({
  taskId,
  starterCode,
  language,
  supportedLanguages,
  onLanguageChange,
  timeLimit,
  proctoringStatus,
  isCameraActive,
  isFullscreen = true,
  enforceFullscreen = true,
  strikes = 0,
  maxStrikes = 5,
  trustScore = 100,
  onOpenSetup,
  onRestartCamera,
  onRequestFullscreen,
  onPasteAttempt,
  onCopyAttempt,
  getProctoringPayload,
  onViewProctoringReport,
}: TaskEditorProps) {
  const { token } = useAuth();
  const [code, setCode] = useState(starterCode);
  const [runningTests, setRunningTests] = useState(false);
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [results, setResults] = useState<SubmissionResponse | null>(null);
  const [useFallbackEditor, setUseFallbackEditor] = useState(false);
  const monacoReadyRef = useRef(false);

  useEffect(() => {
    setCode(starterCode);
  }, [starterCode]);

  useEffect(() => {
    monacoReadyRef.current = false;
    setUseFallbackEditor(false);

    const timer = setTimeout(() => {
      if (!monacoReadyRef.current) {
        setUseFallbackEditor(true);
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [language, starterCode]);

  const loading = runningTests || submittingSolution;

  async function submitAttempt(finalSubmit: boolean) {
    if (finalSubmit) {
      setSubmittingSolution(true);
    } else {
      setRunningTests(true);
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Check camera invigilation on final submit
      let proctoringData: ProctoringSubmissionPayload | undefined = undefined;
      if (finalSubmit && getProctoringPayload) {
        proctoringData = getProctoringPayload();
        if (!proctoringData || proctoringStatus !== "active") {
          setResults({
            success: false,
            error: "Camera invigilation must be active to submit your solution.",
          });
          return;
        }
      }

      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code,
          taskId,
          language,
          finalSubmit,
          proctoringData,
        }),
      });

      const data: SubmissionResponse = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Submission failed",
      });
    } finally {
      if (finalSubmit) {
        setSubmittingSolution(false);
      } else {
        setRunningTests(false);
      }
    }
  }

  async function handleRunTests() {
    await submitAttempt(false);
  }

  async function handleFinalSubmit() {
    await submitAttempt(true);
  }

  function handleReset() {
    setCode(starterCode);
    setResults(null);
  }

  function handleLanguageChange(nextLanguage: string) {
    setResults(null);
    onLanguageChange(nextLanguage);
  }

  const monacoLanguageMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
  };

  return (
    <div className="space-y-4">
      {/* Editor Box with Lock Overlay */}
      <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-900 shadow-md">
        {/* Proctoring Lock Overlay */}
        {proctoringStatus !== undefined && (
          <ProctoringLockOverlay
            status={proctoringStatus}
            isCameraActive={Boolean(isCameraActive)}
            isFullscreen={isFullscreen}
            enforceFullscreen={enforceFullscreen}
            strikes={strikes}
            maxStrikes={maxStrikes}
            onOpenSetup={onOpenSetup || (() => {})}
            onRestartCamera={onRestartCamera || (() => {})}
            onRequestFullscreen={onRequestFullscreen}
          />
        )}

        {/* Editor Controls Bar */}
        <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase">Language</span>
              <select
                value={language}
                onChange={(event) => handleLanguageChange(event.target.value)}
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
              >
                {supportedLanguages.map((supportedLanguage) => (
                  <option key={supportedLanguage} value={supportedLanguage}>
                    {supportedLanguage}
                  </option>
                ))}
              </select>
            </div>

            {proctoringStatus === "active" && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" />
                Invigilated Mode
              </span>
            )}
          </div>

          {timeLimit && <span className="text-xs text-slate-400">Time limit: {timeLimit} min</span>}
        </div>

        {/* Monaco Editor or Fallback Textarea */}
        {useFallbackEditor ? (
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onPaste={(event) => {
              event.preventDefault();
              const text = event.clipboardData.getData("text");
              onPasteAttempt?.(text || "Pasting is restricted");
            }}
            onCopy={(event) => {
              event.preventDefault();
              onCopyAttempt?.("Code copying is restricted");
            }}
            onCut={(event) => {
              event.preventDefault();
              onCopyAttempt?.("Code cutting is restricted");
            }}
            onContextMenu={(event) => {
              event.preventDefault();
            }}
            className="h-[420px] w-full resize-none border-0 bg-slate-900 p-4 font-mono text-sm text-slate-100 outline-none select-none"
            spellCheck={false}
          />
        ) : (
          <Editor
            height="420px"
            language={monacoLanguageMap[language] || "javascript"}
            value={code}
            onMount={(editor) => {
              monacoReadyRef.current = true;

              // Restrict copy, cut, and paste commands inside Monaco
              editor.onKeyDown((e) => {
                const isCmdOrCtrl = e.ctrlKey || e.metaKey;
                // Monaco KeyCodes: KeyC = 33, KeyX = 54, KeyV = 52, Insert = 19
                if (isCmdOrCtrl && e.keyCode === 33 /* KeyC */) {
                  e.preventDefault();
                  e.stopPropagation();
                  onCopyAttempt?.("Code copy shortcut (Ctrl/Cmd+C) blocked");
                } else if (isCmdOrCtrl && e.keyCode === 54 /* KeyX */) {
                  e.preventDefault();
                  e.stopPropagation();
                  onCopyAttempt?.("Code cut shortcut (Ctrl/Cmd+X) blocked");
                } else if (isCmdOrCtrl && e.keyCode === 52 /* KeyV */) {
                  e.preventDefault();
                  e.stopPropagation();
                  onPasteAttempt?.("Code paste shortcut (Ctrl/Cmd+V) blocked");
                } else if (e.shiftKey && e.keyCode === 19 /* Insert */) {
                  e.preventDefault();
                  e.stopPropagation();
                  onPasteAttempt?.("Shift+Insert paste blocked");
                } else if (isCmdOrCtrl && e.keyCode === 19 /* Insert */) {
                  e.preventDefault();
                  e.stopPropagation();
                  onCopyAttempt?.("Ctrl+Insert copy blocked");
                }
              });

              // If any paste operation slips through, undo it immediately and log violation
              editor.onDidPaste(() => {
                editor.trigger("proctoring", "undo", null);
                onPasteAttempt?.("Pasting into editor is disabled");
              });
            }}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            loading={<div className="p-4 text-sm text-slate-300">Loading editor...</div>}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'Fira Code', monospace",
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              contextmenu: false,
              copyWithSyntaxHighlighting: false,
              emptySelectionClipboard: false,
            }}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={handleRunTests}
            disabled={loading || proctoringStatus !== "active"}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {runningTests ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Run Tests
              </>
            )}
          </button>

          <button
            onClick={handleFinalSubmit}
            disabled={loading || proctoringStatus !== "active"}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {submittingSolution ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Submit Solution
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>

        {onViewProctoringReport && (
          <button
            type="button"
            onClick={onViewProctoringReport}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
          >
            View Live Invigilation Report
          </button>
        )}
      </div>

      {/* Test Results Output */}
      {results?.success && results.data && (
        <TestResults
          loading={loading}
          passedTests={results.data.passedTests}
          totalTests={results.data.totalTests}
          results={results.data.testResults}
          message={results.data.message}
          allPassed={results.data.allPassed}
          isProctoringFlagged={results.data.isProctoringFlagged}
          proctoringTrustScore={results.data.proctoringTrustScore}
          onViewProctoringReport={onViewProctoringReport}
        />
      )}

      {results?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Error</p>
          <p>{results.error}</p>
        </div>
      )}
    </div>
  );
}
