"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { projectsApi } from "@/lib/api";
import { ActivityTab } from "@/components/projects/workspace/ActivityTab";
import { DeliverablesTab } from "@/components/projects/workspace/DeliverablesTab";
import { FilesTab } from "@/components/projects/workspace/FilesTab";
import { MessagesTab } from "@/components/projects/workspace/MessagesTab";
import { MilestonesTab } from "@/components/projects/workspace/MilestonesTab";
import { OverviewTab } from "@/components/projects/workspace/OverviewTab";
import { ProjectHeader } from "@/components/projects/workspace/ProjectHeader";
import { ProjectSidebar } from "@/components/projects/workspace/ProjectSidebar";
import type {
  ProjectDetail,
  ProjectListItem,
  WorkspaceTabKey,
} from "@/components/projects/workspace/types";

const VALID_TABS: WorkspaceTabKey[] = [
  "overview",
  "deliverables",
  "milestones",
  "messages",
  "files",
  "activity",
];

export default function ProjectWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-950 p-6 lg:p-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="h-16 rounded-2xl bg-white/5 animate-pulse motion-reduce:animate-none" />
            <div className="h-64 rounded-2xl bg-white/5 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      }
    >
      <ProjectWorkspaceInner />
    </Suspense>
  );
}

function ProjectWorkspaceInner() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const projectId = params.projectId;
  const initialTab = searchParams.get("tab") as WorkspaceTabKey | null;
  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : "overview",
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateDeliverable, setShowCreateDeliverable] = useState(false);
  const [completingProject, setCompletingProject] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState("");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as WorkspaceTabKey | null;
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const projectQuery = useQuery({
    queryKey: ["project-workspace", projectId],
    queryFn: async () => {
      const res = await projectsApi.get(projectId);
      return {
        project: res.data?.project as ProjectDetail,
        viewerRole: res.data?.viewerRole as "CLIENT" | "FREELANCER" | "ADMIN",
      };
    },
    enabled: Boolean(user && projectId),
    retry: false,
  });

  const viewerRole = projectQuery.data?.viewerRole;
  const project = projectQuery.data?.project;

  // Clients & Admins only: load project switcher list
  const clientProjectsQuery = useQuery({
    queryKey: ["projects-switcher-list"],
    queryFn: async () => {
      const res = await projectsApi.list();
      return (res.data?.projects || []) as ProjectListItem[];
    },
    enabled: Boolean(
      user && (viewerRole === "CLIENT" || viewerRole === "ADMIN"),
    ),
  });

  const filesCount = useMemo(() => {
    if (!project) return 0;
    return project.deliverables.reduce(
      (sum, d) => sum + (d.fileUrls?.length || 0),
      0,
    );
  }, [project]);

  async function refreshAll() {
    await projectQuery.refetch();
  }

  async function handleUpdateProject(payload: {
    status?: ProjectDetail["status"];
    maxRevisions?: number | null;
  }) {
    if (!project) return;
    setWorkspaceNotice("");
    await projectsApi.update(project.id, payload);
    await refreshAll();
  }

  async function handleCompleteProject() {
    if (!project) return;
    setWorkspaceNotice("");
    setCompletingProject(true);
    try {
      await projectsApi.update(project.id, { status: "COMPLETED" });
      await refreshAll();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to complete project yet.";
      setWorkspaceNotice(detail);
    } finally {
      setCompletingProject(false);
    }
  }

  function handleOpenSubmitDeliverable() {
    setActiveTab("deliverables");
    setShowCreateDeliverable(true);
  }

  if (projectQuery.isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-16 rounded-2xl bg-white/5 animate-pulse motion-reduce:animate-none" />
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="h-24 rounded-xl bg-white/5 animate-pulse motion-reduce:animate-none" />
            <div className="h-24 rounded-xl bg-white/5 animate-pulse motion-reduce:animate-none" />
            <div className="h-24 rounded-xl bg-white/5 animate-pulse motion-reduce:animate-none" />
            <div className="h-24 rounded-xl bg-white/5 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="h-64 rounded-2xl bg-white/5 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (projectQuery.isError || !project || !viewerRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4 text-surface-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-900 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-danger-400" />
          <h1 className="mt-3 font-heading text-lg font-bold text-white">
            Not authorized for this project
          </h1>
          <p className="mt-1.5 text-sm text-surface-400">
            This contract workspace is restricted to its assigned client and freelancer.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.replace("/dashboard")}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
            >
              Return to dashboard
            </button>
            <Link
              href="/projects"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-surface-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              Studio launcher
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-100 text-surface-900">
      <ProjectSidebar
        project={project}
        viewerRole={viewerRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        clientProjects={clientProjectsQuery.data || []}
        filesCount={filesCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectHeader
          project={project}
          viewerRole={viewerRole}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSubmitDeliverable={handleOpenSubmitDeliverable}
          onCompleteProject={handleCompleteProject}
          completingProject={completingProject}
        />

        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {workspaceNotice && (
            <div className="mb-5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
              {workspaceNotice}
            </div>
          )}

          {activeTab === "overview" && (
            <OverviewTab
              project={project}
              currentUserId={Number(user?.id || 0)}
              viewerRole={viewerRole}
              onSelectTab={setActiveTab}
              onOpenSubmitDeliverable={handleOpenSubmitDeliverable}
              onUpdateProject={handleUpdateProject}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === "deliverables" && (
            <DeliverablesTab
              project={project}
              viewerRole={viewerRole}
              showCreateForm={showCreateDeliverable}
              onToggleCreateForm={setShowCreateDeliverable}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === "milestones" && (
            <MilestonesTab
              project={project}
              viewerRole={viewerRole}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === "messages" && (
            <MessagesTab
              project={project}
              currentUserId={Number(user?.id || 0)}
              viewerRole={viewerRole}
            />
          )}

          {activeTab === "files" && <FilesTab project={project} />}

          {activeTab === "activity" && (
            <ActivityTab logs={project.activityLogs} />
          )}
        </main>
      </div>
    </div>
  );
}
