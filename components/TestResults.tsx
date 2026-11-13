"use client";

import { CheckCircle, XCircle, Loader, ShieldCheck, ShieldAlert, FileText } from "lucide-react";

interface TestResult {
  test: string;
  passed: boolean;
  expected: string;
  actual: string;
}

interface TestResultsProps {
  loading?: boolean;
  passedTests?: number;
  totalTests?: number;
  results?: TestResult[];
  message?: string;
  allPassed?: boolean;
  isProctoringFlagged?: boolean;
  proctoringTrustScore?: number;
  onViewProctoringReport?: () => void;
}

export function TestResults({
  loading = false,
  passedTests = 0,
  totalTests = 0,
  results = [],
  message = "",
  allPassed = false,
  isProctoringFlagged,
  proctoringTrustScore,
  onViewProctoringReport,
}: TestResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Test Results</h3>
        {loading && <Loader className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      {/* Proctoring Verification Stamp */}
      {proctoringTrustScore !== undefined && (
        <div
          className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
            isProctoringFlagged
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {isProctoringFlagged ? (
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">
              {isProctoringFlagged
                ? `Invigilation Flagged (Trust Score: ${proctoringTrustScore}%)`
                : `Invigilation Confirmed (Trust Score: ${proctoringTrustScore}%)`}
            </span>
          </div>

          {onViewProctoringReport && (
            <button
              onClick={onViewProctoringReport}
              className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
            >
              <FileText className="h-3 w-3" />
              View Audit
            </button>
          )}
        </div>
      )}

      {message && (
        <div
          className={`rounded px-3 py-2 text-sm font-medium ${
            allPassed
              ? isProctoringFlagged
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-4 flex items-center gap-4">
        <div className="text-sm">
          <span className="font-semibold text-slate-900">{passedTests}</span>
          <span className="text-slate-600">/{totalTests} tests passed</span>
        </div>
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${totalTests > 0 ? (passedTests / totalTests) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={`rounded border p-3 ${
              result.passed
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="mb-2 flex items-start gap-2">
              {result.passed ? (
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${result.passed ? "text-emerald-900" : "text-red-900"}`}>
                  {result.test}
                </p>
              </div>
            </div>

            {!result.passed && (
              <div className="space-y-1 text-xs">
                <div className="ml-6">
                  <p className="text-slate-600">
                    Expected: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{result.expected}</span>
                  </p>
                  <p className="text-slate-600">
                    Got: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{result.actual}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
