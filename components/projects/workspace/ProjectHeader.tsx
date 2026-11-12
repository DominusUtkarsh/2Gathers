"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Menu,
  Plus,
  Send,
} from "lucide-react";

import { ProjectStatusBadge } from "./DeliverableStatusBadge";
import {
  getDeadlineMeta,
  getDisplayName,
  getInitials,
  type ProjectDetail,
  type WorkspaceTabKey,
} from "./types";

type ProjectHeaderProps = {
  project: ProjectDetail;
  viewerRole: "CLIENT" | "FREELANCER" | "ADMIN";
  activeTab: WorkspaceTabKey;
  onSelectTab: (tab: WorkspaceTabKey) => void;
  onOpenMobileMenu: () => void;
  onOpenSubmitDeliverable: () => void;
  onCompleteProject: () => void;
  completingProject: boolean;
};

export function ProjectHeader({
  project,
  viewerRole,
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenSubmitDeliverable,
  onCompleteProject,
  completingProject,
}: ProjectHeaderProps) {
  const overdueDeliverables = project.deliverables.filter(
    (d) =>
      getDeadlineMeta(d.dueDate, d.status === "APPROVED").state === "OVERDUE",
  ).length;
  const overdueMilestones = project.milestones.filter(
    (m) =>
      getDeadlineMeta(m.dueDate, m.status === "RELEASED" || m.status === "COMPLETED")
        .state === "OVERDUE",
  ).length;
  const totalOverdue = overdueDeliverables + overdueMilestones;

  const awaitingReview = project.deliverables.find((d) =>
    ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"].includes(d.status),
  );

  const clientName = getDisplayName(project.client);
  const freelancerName = getDisplayName(project.freelancer);

  const tabs: Array<{ key: WorkspaceTabKey; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "deliverables", label: "Deliverables" },
    { key: "milestones", label: "Milestones" },
    { key: "messages", label: "Messages" },
    { key: "files", label: "Files" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-surface-900 text-white">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Open workspace navigation"
              className="rounded-lg border border-white/15 bg-white/5 p-2 text-surface-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded border border-primary-500/40 bg-primary-500/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary-200">
                  Contract #{project.id}
                </span>
                <h1 className="truncate font-heading text-lg font-bold tracking-tight text-white sm:text-xl">
                  {project.job.title}
                </h1>
                <ProjectStatusBadge status={project.status} />
                {totalOverdue > 0 && project.status !== "COMPLETED" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-danger-500/40 bg-danger-500/15 px-2.5 py-0.5 text-xs font-medium text-danger-200">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{totalOverdue} overdue</span>
                  </span>
                )}
              </div>

              {/* Paired Client + Freelancer avatars */}
              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-surface-400">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-white">
                    {getInitials(project.client.name, project.client.username)}
                  </span>
                  <span className="font-medium text-surface-200">
                    {clientName}
                  </span>
                  <span className="text-surface-500">Client</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-semibold text-white">
                    {getInitials(
                      project.freelancer.name,
                      project.freelancer.username,
                    )}
                  </span>
                  <span className="font-medium text-surface-200">
                    {freelancerName}
                  </span>
                  <span className="text-surface-500">Freelancer</span>
                </div>
                <span className="tabular-nums text-surface-300">
                  Budget {project.job.budget.toLocaleString()} INR
                </span>
              </div>
            </div>
          </div>

          {/* Primary contextual action above the fold */}
          <div className="flex items-center gap-2.5">
            {viewerRole === "FREELANCER" && project.status !== "COMPLETED" && (
              <button
                type="button"
                onClick={onOpenSubmitDeliverable}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:scale-[0.98] motion-reduce:transform-none"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit deliverable</span>
              </button>
            )}

            {viewerRole === "CLIENT" && awaitingReview && (
              <button
                type="button"
                onClick={() => onSelectTab("deliverables")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:scale-[0.98] motion-reduce:transform-none"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Review deliverable</span>
              </button>
            )}

            {viewerRole === "CLIENT" &&
              !awaitingReview &&
              project.status !== "COMPLETED" &&
              project.milestones.length === 0 && (
                <button
                  type="button"
                  onClick={() => onSelectTab("milestones")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:scale-[0.98] motion-reduce:transform-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add milestone</span>
                </button>
              )}

            {viewerRole === "CLIENT" &&
              project.status !== "COMPLETED" &&
              project.milestones.length > 0 &&
              project.escrowSummary.fundedTokens === 0 && (
                <button
                  type="button"
                  onClick={onCompleteProject}
                  disabled={completingProject}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-400" />
                  <span>
                    {completingProject ? "Completing…" : "Mark complete"}
                  </span>
                </button>
              )}
          </div>
        </div>

        {/* Horizontal tab strip for quick keyboard & mobile switching */}
        <div
          className="-mb-px flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Workspace tabs"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectTab(tab.key)}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                  active
                    ? "border-primary-400 text-white"
                    : "border-transparent text-surface-400 hover:border-white/30 hover:text-surface-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
