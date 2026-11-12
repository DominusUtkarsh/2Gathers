"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  FileCheck2,
  FolderOpen,
  Layers,
  LayoutGrid,
  Lock,
  MessageSquare,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import type {
  ProjectDetail,
  ProjectListItem,
  WorkspaceTabKey,
} from "./types";
import { getDisplayName } from "./types";
import { ProjectStatusBadge } from "./DeliverableStatusBadge";

type SidebarNavItem = {
  key: WorkspaceTabKey;
  label: string;
  icon: LucideIcon;
  count?: number;
};

type ProjectSidebarProps = {
  project: ProjectDetail;
  viewerRole: "CLIENT" | "FREELANCER" | "ADMIN";
  activeTab: WorkspaceTabKey;
  onSelectTab: (tab: WorkspaceTabKey) => void;
  clientProjects: ProjectListItem[];
  filesCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function ProjectSidebar({
  project,
  viewerRole,
  activeTab,
  onSelectTab,
  clientProjects,
  filesCount,
  mobileOpen,
  onCloseMobile,
}: ProjectSidebarProps) {
  const router = useRouter();
  const canSwitchProjects = viewerRole === "CLIENT" || viewerRole === "ADMIN";
  const pendingReviewCount = project.deliverables.filter((d) =>
    ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"].includes(d.status),
  ).length;
  const openMilestonesCount = project.milestones.filter(
    (m) => m.status !== "RELEASED",
  ).length;

  const navItems: SidebarNavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    {
      key: "deliverables",
      label: "Deliverables",
      icon: FileCheck2,
      count:
        pendingReviewCount > 0
          ? pendingReviewCount
          : project.deliverables.length || undefined,
    },
    {
      key: "milestones",
      label: "Milestones & Escrow",
      icon: Layers,
      count: openMilestonesCount > 0 ? openMilestonesCount : undefined,
    },
    { key: "messages", label: "Messages", icon: MessageSquare },
    {
      key: "files",
      label: "Files",
      icon: FolderOpen,
      count: filesCount > 0 ? filesCount : undefined,
    },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  const partnerUser =
    viewerRole === "FREELANCER" ? project.client : project.freelancer;
  const partnerRoleLabel =
    viewerRole === "FREELANCER" ? "Client" : "Assigned Freelancer";

  const sidebarBody = (
    <div className="flex h-full flex-col justify-between bg-surface-950 text-surface-100">
      <div>
        {/* Studio Brand & Exit */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 font-heading text-[11px] font-bold text-white">
              2G
            </span>
            <span className="font-heading text-sm font-bold text-white">
              2G Studio
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-surface-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Exit Studio</span>
            </Link>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close workspace navigation"
              className="rounded-md p-1 text-surface-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Project identity or Client-only switcher */}
        <div className="border-b border-white/10 px-4 py-4">
          {canSwitchProjects && clientProjects.length > 1 ? (
            <div>
              <label
                htmlFor="project-switcher"
                className="mb-1.5 block text-xs font-medium text-surface-400"
              >
                Active contract
              </label>
              <div className="relative">
                <select
                  id="project-switcher"
                  aria-label="Active contract"
                  value={project.id}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (nextId) {
                      router.push(`/projects/${nextId}`);
                    }
                  }}
                  className="w-full appearance-none rounded-lg border border-white/15 bg-surface-900 py-2 pl-3 pr-8 text-sm font-semibold text-white transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  {clientProjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.job.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-surface-400" />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-surface-400">
                <span className="tabular-nums">Room #{project.id}</span>
                <ProjectStatusBadge status={project.status} />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-primary-300">
                  <Lock className="h-3 w-3 text-primary-400" />
                  <span>Room #{project.id}</span>
                </span>
                <ProjectStatusBadge status={project.status} />
              </div>
              <p className="mt-2 line-clamp-2 font-heading text-sm font-semibold text-white">
                {project.job.title}
              </p>
            </div>
          )}

          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
            <p className="text-[11px] text-surface-400">{partnerRoleLabel}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-white">
              {getDisplayName(partnerUser)}
            </p>
          </div>
        </div>

        {/* Workspace tabs */}
        <nav className="space-y-1 p-3" aria-label="Project workspace sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:scale-[0.98] motion-reduce:transform-none ${
                  active
                    ? "bg-primary-600/20 text-white ring-1 ring-primary-500/40"
                    : "text-surface-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? "text-primary-400" : "text-surface-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                      active
                        ? "bg-primary-500/30 text-primary-200"
                        : "bg-white/10 text-surface-300"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom escrow telemetry + wallet shortcut */}
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl border border-white/10 bg-surface-900 p-3">
          <p className="text-[11px] font-medium text-surface-400">Escrow vault</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-heading text-sm font-bold tabular-nums text-white">
              {project.escrowSummary.fundedTokens} TOK locked
            </span>
            <span className="text-xs tabular-nums text-success-400">
              {project.escrowSummary.releasedTokens} released
            </span>
          </div>
          <Link
            href="/wallet"
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary-300 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Open token wallet</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed studio rail */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-surface-950 lg:block">
        <div className="sticky top-0 h-screen">{sidebarBody}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-72 border-r border-white/10 bg-surface-950 shadow-card-lg">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}
