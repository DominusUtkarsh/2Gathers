"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  FolderKanban,
  Layers,
  Lock,
  ShieldAlert,
  Terminal,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { projectsApi } from "@/lib/api";
import { ProjectStatusBadge } from "@/components/projects/workspace/DeliverableStatusBadge";
import {
  formatRelativeTime,
  getDisplayName,
  type ProjectListItem,
} from "@/components/projects/workspace/types";

export default function ProjectsDirectoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const projectsQuery = useQuery({
    queryKey: ["studio-projects-list"],
    queryFn: async () => {
      const res = await projectsApi.list();
      return (res.data?.projects || []) as ProjectListItem[];
    },
    enabled: Boolean(user),
    retry: false,
  });

  const projects = projectsQuery.data || [];
  const isFreelancer = user?.role === "FREELANCER";

  // Freelancers with one accepted project enter their isolated room directly.
  useEffect(() => {
    if (isFreelancer && !projectsQuery.isLoading && projects.length === 1) {
      router.replace(`/projects/${projects[0].id}`);
    }
  }, [isFreelancer, projectsQuery.isLoading, projects, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-950 text-surface-100">
        <div className="mx-auto max-w-6xl px-6 py-10 space-y-4">
          <div className="h-12 w-64 rounded-xl bg-white/5 animate-pulse motion-reduce:animate-none" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-44 rounded-2xl bg-white/5 animate-pulse motion-reduce:animate-none" />
            <div className="h-44 rounded-2xl bg-white/5 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-950 text-surface-100">
        <StudioTopBar roleLabel="Guest" />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-900 p-8 text-center">
            <Lock className="mx-auto h-9 w-9 text-primary-400" />
            <h1 className="mt-4 font-heading text-lg font-bold text-white">
              Authentication required for 2G Studio
            </h1>
            <p className="mt-2 text-sm text-surface-400">
              Sign in with an account attached to an accepted contract to open a delivery workspace.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Sign in
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Back to 2Gathers
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100">
      <StudioTopBar roleLabel={user.role} username={user.username || user.email} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Studio command header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-300">
              <Terminal className="h-3.5 w-3.5" />
              <span>Dedicated Delivery Environment</span>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {isFreelancer ? "Accepted Contract Rooms" : "Client Studio Console"}
            </h1>
            <p className="mt-1 text-sm text-surface-400">
              {isFreelancer
                ? "Each accepted proposal opens in an isolated contract workspace for drafts, reviews, and escrow milestones."
                : "Select a contract room to review drafts, run milestone escrow releases, and message your freelancer."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-right">
              <p className="text-xs text-surface-400">Active rooms</p>
              <p className="font-heading text-lg font-bold tabular-nums text-white">
                {projects.length}
              </p>
            </div>
          </div>
        </div>

        {projectsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-44 rounded-2xl border border-white/10 bg-white/5 animate-pulse motion-reduce:animate-none" />
            <div className="h-44 rounded-2xl border border-white/10 bg-white/5 animate-pulse motion-reduce:animate-none" />
          </div>
        ) : projectsQuery.isError ? (
          <div className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-6 text-sm text-danger-200">
            Unable to load contract workspaces right now. Refresh or return to your dashboard.
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface-900 p-10 text-center">
            {isFreelancer ? (
              <ShieldAlert className="mx-auto h-10 w-10 text-warning-400" />
            ) : (
              <FolderKanban className="mx-auto h-10 w-10 text-primary-400" />
            )}
            <h2 className="mt-4 font-heading text-lg font-bold text-white">
              {isFreelancer
                ? "Workspace requires an accepted proposal"
                : "No contract rooms provisioned yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-surface-400">
              {isFreelancer
                ? "Pre-acceptance messaging and draft studios are disabled. Apply to open contracts on 2Gathers; once a client accepts your proposal, your isolated workspace appears here."
                : "Accept a freelancer proposal on one of your posted jobs to initialize its milestone, deliverable, and messaging workspace."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={isFreelancer ? "/freelancer/jobs" : "/client/post-job"}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {isFreelancer ? "Browse open contracts" : "Post a job"}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Return to 2Gathers
              </Link>
            </div>
          </div>
        ) : isFreelancer && projects.length === 1 ? (
          <div className="rounded-2xl border border-white/10 bg-surface-900 p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success-400" />
            <p className="mt-3 text-sm font-medium text-white">
              Entering Contract Room #{projects[0].id}
            </p>
            <Link
              href={`/projects/${projects[0].id}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <span>Launch workspace</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const partner = isFreelancer ? project.client : project.freelancer;
              const partnerName = getDisplayName(partner);

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-surface-900 p-6 transition-colors hover:border-primary-400/60 hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-medium tabular-nums text-primary-300">
                          Room #{project.id}
                        </span>
                        <h2 className="mt-1 font-heading text-lg font-bold text-white group-hover:text-primary-200">
                          {project.job.title}
                        </h2>
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>

                    <p className="mt-2 text-xs text-surface-400">
                      {isFreelancer ? "Client: " : "Freelancer: "}
                      <span className="font-medium text-surface-200">
                        {partnerName}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-surface-400">
                    <div className="flex flex-wrap items-center gap-4 tabular-nums">
                      <span className="inline-flex items-center gap-1 text-surface-200">
                        <FileCheck2 className="h-3.5 w-3.5 text-primary-400" />
                        {project._count.deliverables} deliverables
                      </span>
                      <span className="inline-flex items-center gap-1 text-surface-200">
                        <Layers className="h-3.5 w-3.5 text-success-400" />
                        {project._count.milestones} milestones
                      </span>
                      <span>
                        ₹{project.job.budget.toLocaleString()}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-semibold text-primary-300 group-hover:text-white">
                      <span>{isFreelancer ? "Enter room" : "Open studio"}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-surface-500">
                    Updated {formatRelativeTime(project.updatedAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StudioTopBar({
  roleLabel,
  username,
}: {
  roleLabel: string;
  username?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-surface-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 font-heading text-xs font-bold text-white">
              2G
            </span>
            <span className="font-heading text-sm font-bold text-white">
              2G Studio
            </span>
          </div>
          <span className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-surface-300 sm:inline-block">
            Contract Workspace
          </span>
        </div>

        <div className="flex items-center gap-3">
          {username && (
            <span className="hidden text-xs text-surface-400 sm:inline-block">
              {username} ({roleLabel})
            </span>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-surface-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Exit to 2Gathers</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
