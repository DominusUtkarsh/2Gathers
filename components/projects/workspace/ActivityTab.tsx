"use client";

import { Activity } from "lucide-react";

import {
  formatRelativeTime,
  getInitials,
  type ProjectActivityItem,
} from "./types";

const ACTIVITY_VERBS: Record<string, string> = {
  PROJECT_STARTED: "initiated the project workspace",
  PROJECT_COMPLETED: "marked the project as completed",
  PROJECT_STATUS_CHANGED: "updated contract status",
  PROJECT_SETTINGS_UPDATED: "updated contract revision settings",
  MILESTONE_CREATED: "created milestone",
  MILESTONE_CREATED_AND_FUNDED: "created & funded milestone",
  ESCROW_FUNDED: "locked escrow tokens for",
  ESCROW_RELEASED: "released milestone escrow for",
  DELIVERABLE_DRAFT_CREATED: "saved deliverable draft",
  DELIVERABLE_SUBMITTED: "submitted deliverable",
  DELIVERABLE_RESUBMITTED: "resubmitted deliverable",
  DELIVERABLE_IN_REVIEW: "started reviewing",
  REVISION_REQUESTED: "requested revisions on",
  DELIVERABLE_APPROVED: "approved deliverable",
  DELIVERABLE_COMMENTED: "commented on",
  FILE_SHARED: "shared a file in contract chat",
};

export function ActivityTab({ logs }: { logs: ProjectActivityItem[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-base font-semibold text-surface-900">
          Contract audit timeline
        </h2>
        <p className="text-xs text-surface-500">
          Chronological record of milestones, submissions, reviews, and escrow events.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center">
          <Activity className="mx-auto h-8 w-8 text-surface-300" />
          <p className="mt-2 font-heading text-sm font-semibold text-surface-900">
            No timeline events yet
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
          <ol className="space-y-5">
            {logs.map((entry, idx) => {
              const verb =
                ACTIVITY_VERBS[entry.type] ||
                entry.type.replaceAll("_", " ").toLowerCase();
              const metaTitle =
                typeof entry.metadata?.title === "string"
                  ? entry.metadata.title
                  : typeof entry.metadata?.fileName === "string"
                    ? entry.metadata.fileName
                    : typeof entry.metadata?.jobTitle === "string"
                      ? entry.metadata.jobTitle
                      : null;
              const metaFeedback =
                typeof entry.metadata?.feedback === "string"
                  ? entry.metadata.feedback
                  : null;
              const metaAmount =
                typeof entry.metadata?.amount === "number"
                  ? entry.metadata.amount
                  : null;

              return (
                <li key={entry.id} className="relative flex gap-3.5">
                  {idx < logs.length - 1 && (
                    <span
                      className="absolute left-3.5 top-8 h-[calc(100%+12px)] w-px bg-surface-200"
                      aria-hidden="true"
                    />
                  )}

                  <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-200 bg-surface-50 text-[11px] font-semibold text-surface-700">
                    {getInitials(entry.actor.name, entry.actor.username)}
                  </span>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <p className="text-surface-700">
                        <span className="font-semibold text-surface-900">
                          {entry.actor.name || entry.actor.username || "Member"}
                        </span>{" "}
                        <span>{verb}</span>{" "}
                        {metaTitle && (
                          <span className="font-semibold text-surface-900">
                            &ldquo;{metaTitle}&rdquo;
                          </span>
                        )}
                        {metaAmount !== null && (
                          <span className="ml-1.5 rounded bg-primary-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary-700">
                            {metaAmount} TOK
                          </span>
                        )}
                      </p>
                      <time className="shrink-0 text-xs tabular-nums text-surface-400">
                        {formatRelativeTime(entry.createdAt)}
                      </time>
                    </div>

                    {metaFeedback && (
                      <p className="mt-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-600">
                        {metaFeedback}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
