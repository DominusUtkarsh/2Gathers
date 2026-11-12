"use client";

import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  MessageSquare,
  Wallet,
  Clock,
  Edit3,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  ArrowRight,
  LifeBuoy,
  Bot,
  Bell,
  CheckCheck,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  authApi,
  freelancerProfileApi,
  jobsApi,
  messagesApi,
  notificationsApi,
  proposalsApi,
  savedJobsApi,
} from "@/lib/api";
import { TOKEN_PRICE_INR } from "@/lib/tokenomics";
import { FreelancerSidebar, FreelancerViewTab } from "./FreelancerSidebar";
import { FreelancerHeader } from "./FreelancerHeader";

const FreelancerAnalytics = dynamic(
  () =>
    import("@/features/dashboard/components/FreelancerAnalytics").then(
      (mod) => mod.FreelancerAnalytics
    ),
  {
    ssr: false,
    loading: () => <div className="skeleton-card h-64" />,
  }
);

type JobItem = {
  id: number;
  title: string;
  description: string;
  budget: number;
  applicationTokenCost?: number;
  status: "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
  client?: {
    id: number;
    username: string | null;
    name: string;
    email?: string;
  };
  _count?: {
    proposals: number;
  };
};

type ProposalItem = {
  id: number;
  status: "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  coverLetter: string;
  createdAt: string;
  updatedAt?: string;
  job?: JobItem;
  freelancer: {
    id: number;
    username: string | null;
    name: string;
    email: string;
  };
};

type FreelancerProfile = {
  professionalTitle: string;
  bio: string;
  skills: string;
  experienceLevel: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  hourlyRateUsd: number;
  country: string;
  city: string;
  phone?: string | null;
  languages: string;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  education?: string | null;
  certifications?: string | null;
  availability: "FULL_TIME" | "PART_TIME" | "AS_NEEDED";
  preferredWorkingHours?: string | null;
  responseTime: "WITHIN_HOUR" | "WITHIN_DAY" | "WITHIN_2_DAYS";
};

type RecentMessagePreview = {
  proposalId: number;
  jobTitle: string;
  senderName: string;
  preview: string;
  timestamp: string;
  hasMessages: boolean;
};

const AVAILABILITY_LABELS: Record<string, string> = {
  FULL_TIME: "Available · Full-time",
  PART_TIME: "Available · Part-time",
  AS_NEEDED: "Available · As needed",
};

const JOB_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-primary-50 text-primary-700 border-primary-200",
  },
  ACCEPTED: {
    label: "In Review",
    className: "bg-warning-50 text-warning-700 border-warning-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-success-50 text-success-700 border-success-200",
  },
  OPEN: {
    label: "Pending",
    className: "bg-surface-100 text-surface-700 border-surface-200",
  },
};

const PROPOSAL_STATUS_BADGE: Record<string, string> = {
  ACCEPTED: "bg-success-50 text-success-700 border-success-200",
  SHORTLISTED: "bg-warning-50 text-warning-700 border-warning-200",
  REJECTED: "bg-danger-50 text-danger-700 border-danger-200",
  SUBMITTED: "bg-surface-100 text-surface-700 border-surface-200",
};

export function FreelancerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const userId = Number(user?.id || "0");

  const [activeTab, setActiveTab] = useState<FreelancerViewTab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [proposalFilter, setProposalFilter] = useState<"ALL" | "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED">("ALL");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else if (hour >= 17) {
      setGreeting("Good evening");
    } else {
      setGreeting("Good morning");
    }
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ["freelancer-dash-wallet"],
    queryFn: async () => {
      const response = await authApi.dashboard();
      return response.data as { walletBalance: number };
    },
    enabled: userId > 0,
  });

  const profileQuery = useQuery({
    queryKey: ["freelancer-dash-profile"],
    queryFn: async () => {
      const response = await freelancerProfileApi.me();
      return (response.data?.profile as FreelancerProfile | null) || null;
    },
    enabled: userId > 0,
  });

  const proposalsQuery = useQuery({
    queryKey: ["freelancer-dash-proposals", userId],
    queryFn: async () => {
      const response = await proposalsApi.inbox();
      return (response.data?.proposals as ProposalItem[]) || [];
    },
    enabled: userId > 0,
    refetchInterval: 7000,
  });

  const jobsQuery = useQuery({
    queryKey: ["freelancer-dash-jobs"],
    queryFn: async () => {
      const response = await jobsApi.list();
      return (response.data?.jobs as JobItem[]) || [];
    },
    enabled: userId > 0,
  });

  const savedJobsQuery = useQuery({
    queryKey: ["freelancer-dash-saved-jobs", userId],
    queryFn: async () => {
      const response = await savedJobsApi.list();
      return (response.data?.saved || []) as Array<{ jobId: number }>;
    },
    enabled: userId > 0,
  });

  const toggleSaveJobMutation = useMutation({
    mutationFn: async (jobId: number) => savedJobsApi.toggle(jobId),
    onSuccess: async () => {
      await savedJobsQuery.refetch();
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ["freelancer-dash-notifications"],
    queryFn: async () => {
      const response = await notificationsApi.list(20);
      return {
        notifications: (response.data?.notifications || []) as Array<{
          id: number;
          title: string;
          body: string;
          link?: string | null;
          isRead: boolean;
          createdAt: string;
        }>,
        unreadCount: Number(response.data?.unreadCount || 0),
      };
    },
    enabled: userId > 0,
    refetchInterval: 6000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      await notificationsQuery.refetch();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await notificationsQuery.refetch();
    },
  });

  const topThreadIds = useMemo(
    () =>
      (proposalsQuery.data || [])
        .filter((p) => p.status === "ACCEPTED")
        .slice(0, 4)
        .map((p) => p.id),
    [proposalsQuery.data]
  );

  const recentMessagesQuery = useQuery({
    queryKey: ["freelancer-dash-recent-messages", topThreadIds],
    queryFn: async (): Promise<RecentMessagePreview[]> => {
      const proposals = (proposalsQuery.data || [])
        .filter((p) => p.status === "ACCEPTED")
        .slice(0, 4);
      if (!proposals.length) return [];

      const results = await Promise.all(
        proposals.map(async (prop) => {
          try {
            const res = await messagesApi.listByProposal(prop.id);
            const msgs = (res.data?.messages || []) as Array<{
              id: number;
              body: string;
              createdAt: string;
              sender?: { username?: string | null; name?: string | null };
            }>;
            const latest = msgs[msgs.length - 1];
            const clientLabel =
              prop.job?.client?.username || prop.job?.client?.name || "Client";

            if (latest) {
              return {
                proposalId: prop.id,
                jobTitle: prop.job?.title || "Contract",
                senderName:
                  latest.sender?.username || latest.sender?.name || clientLabel,
                preview: latest.body,
                timestamp: latest.createdAt,
                hasMessages: true,
              };
            }

            return {
              proposalId: prop.id,
              jobTitle: prop.job?.title || "Contract",
              senderName: clientLabel,
              preview: "Proposal accepted — open Project Workspace to message client",
              timestamp: prop.updatedAt || prop.createdAt,
              hasMessages: false,
            };
          } catch {
            return null;
          }
        })
      );

      return results.filter((item): item is RecentMessagePreview => item !== null);
    },
    enabled: topThreadIds.length > 0,
  });

  const walletBalance = dashboardQuery.data?.walletBalance ?? user?.tokens ?? 0;
  const proposals = proposalsQuery.data || [];
  const appliedJobIds = useMemo(
    () => new Set(proposals.map((p) => p.job?.id).filter(Boolean)),
    [proposals]
  );
  const savedJobIds = useMemo(
    () => new Set((savedJobsQuery.data || []).map((s) => s.jobId)),
    [savedJobsQuery.data]
  );

  // Active & completed project collections derived strictly from accepted proposals
  const projectProposals = useMemo(
    () => proposals.filter((p) => p.status === "ACCEPTED" && p.job),
    [proposals]
  );
  const activeProjects = useMemo(
    () => projectProposals.filter((p) => p.job?.status !== "COMPLETED"),
    [projectProposals]
  );
  const completedProjects = useMemo(
    () => projectProposals.filter((p) => p.job?.status === "COMPLETED"),
    [projectProposals]
  );
  const shortlistedCount = useMemo(
    () => proposals.filter((p) => p.status === "SHORTLISTED").length,
    [proposals]
  );

  // Freelancer skills list for matching open jobs
  const userSkills = useMemo(() => {
    const raw = profileQuery.data?.skills || "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [profileQuery.data?.skills]);

  // Recommended Open Jobs (filtered by header search & scored by skill overlap)
  const recommendedJobs = useMemo(() => {
    const allOpen = (jobsQuery.data || []).filter((j) => j.status === "OPEN");
    const q = searchQuery.trim().toLowerCase();

    const filtered = q
      ? allOpen.filter(
          (job) =>
            job.title.toLowerCase().includes(q) ||
            job.description.toLowerCase().includes(q) ||
            (job.client?.username || job.client?.name || "").toLowerCase().includes(q)
        )
      : allOpen;

    return filtered
      .map((job) => {
        const text = `${job.title} ${job.description}`.toLowerCase();
        const matchedSkills = userSkills.filter((skill) =>
          text.includes(skill.toLowerCase())
        );
        const alreadyApplied = appliedJobIds.has(job.id);
        const score = matchedSkills.length * 10 - (alreadyApplied ? 5 : 0);
        return { job, matchedSkills, alreadyApplied, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [jobsQuery.data, searchQuery, userSkills, appliedJobIds]);

  // Profile Completeness Calculation across actual schema fields
  const profileCompleteness = useMemo(() => {
    const p = profileQuery.data;
    const checks = [
      { label: "Add professional title", ok: Boolean(p?.professionalTitle?.trim()) },
      { label: "Write detailed bio (80+ chars)", ok: Boolean(p?.bio && p.bio.trim().length >= 80) },
      { label: "List core skills", ok: Boolean(p?.skills?.trim()) },
      { label: "Set hourly rate & location", ok: Boolean(p?.hourlyRateUsd && p?.country && p?.city) },
      { label: "Add languages", ok: Boolean(p?.languages?.trim()) },
      { label: "Add portfolio link", ok: Boolean(p?.portfolioUrl?.trim()) },
      { label: "Add GitHub or LinkedIn URL", ok: Boolean(p?.githubUrl?.trim() || p?.linkedinUrl?.trim()) },
      { label: "Add education or certifications", ok: Boolean(p?.education?.trim() || p?.certifications?.trim()) },
    ];
    const done = checks.filter((c) => c.ok).length;
    const percentage = Math.round((done / checks.length) * 100);
    const missing = checks.filter((c) => !c.ok).map((c) => c.label);
    return { percentage, missing };
  }, [profileQuery.data]);

  // Actionable To-do queue from real data
  const todoItems = useMemo(() => {
    const items: Array<{ id: string; label: string; meta: string; href?: string; onClick?: () => void }> = [];
    if (!profileQuery.data) {
      items.push({
        id: "create-profile",
        label: "Create your freelancer profile",
        meta: "Required for client discovery",
        href: "/onboarding/freelancer",
      });
    } else if (profileCompleteness.missing.length > 0) {
      items.push({
        id: "complete-profile",
        label: profileCompleteness.missing[0],
        meta: `${profileCompleteness.percentage}% profile strength`,
        href: "/onboarding/freelancer?edit=1",
      });
    }

    if (shortlistedCount > 0) {
      items.push({
        id: "shortlisted-replies",
        label: `Follow up on ${shortlistedCount} shortlisted proposal${shortlistedCount > 1 ? "s" : ""}`,
        meta: "High client interest",
        href: "/support",
      });
    }

    if ((notificationsQuery.data?.unreadCount || 0) > 0) {
      items.push({
        id: "unread-alerts",
        label: `Review ${notificationsQuery.data?.unreadCount} unread notification${(notificationsQuery.data?.unreadCount || 0) > 1 ? "s" : ""}`,
        meta: "Updates on jobs and messages",
        onClick: () => setActiveTab("notifications"),
      });
    }

    if (activeProjects.length > 0) {
      const lead = activeProjects[0];
      items.push({
        id: "active-contract",
        label: `Coordinate deliverables: ${lead.job?.title}`,
        meta: "Active contract",
        href: `/jobs/${lead.job?.id}`,
      });
    }

    items.push({
      id: "coding-tasks",
      label: "Complete verified coding challenges",
      meta: "Earn bonus TOK rewards",
      href: "/tasks",
    });

    return items.slice(0, 5);
  }, [
    profileQuery.data,
    profileCompleteness,
    shortlistedCount,
    notificationsQuery.data?.unreadCount,
    activeProjects,
  ]);

  const unreadNotifications = notificationsQuery.data?.unreadCount || 0;
  const recentMessages = recentMessagesQuery.data || [];
  const activeMessageThreads = recentMessages.filter((m) => m.hasMessages).length;

  const filteredProposals = useMemo(() => {
    if (proposalFilter === "ALL") return proposals;
    return proposals.filter((p) => p.status === proposalFilter);
  }, [proposals, proposalFilter]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-dvh bg-surface-50 text-surface-900">
      <FreelancerSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadNotifications={unreadNotifications}
        unreadMessages={activeMessageThreads}
        profilePercent={profileCompleteness.percentage}
        missingCount={profileCompleteness.missing.length}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <FreelancerHeader
          username={user?.username || "Freelancer"}
          email={user?.email}
          walletBalance={walletBalance}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notifications={notificationsQuery.data?.notifications || []}
          unreadCount={unreadNotifications}
          onMarkAllRead={() => markAllReadMutation.mutate()}
          onMarkRead={async (id) => {
            await markReadMutation.mutateAsync(id);
          }}
          markAllPending={markAllReadMutation.isPending}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* ═══════ C. WELCOME SECTION ═══════ */}
          <section className="mb-6 flex flex-col justify-between gap-4 border-b border-surface-200 pb-6 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
                {greeting}, {user?.username || "Freelancer"}
              </h1>
              <p className="mt-1 text-sm text-surface-500">
                Here&apos;s your freelance workspace at a glance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700">
                <Clock className="h-3.5 w-3.5 text-success-600" />
                <span>
                  {profileQuery.data?.availability
                    ? AVAILABILITY_LABELS[profileQuery.data.availability] || "Available"
                    : "Availability not set"}
                </span>
              </span>

              <Link
                href="/onboarding/freelancer?edit=1"
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-surface-800 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.98]"
              >
                <Edit3 className="h-3.5 w-3.5 text-surface-500" />
                <span>{profileQuery.data ? "Edit Profile" : "Setup Profile"}</span>
              </Link>
            </div>
          </section>

          {/* ═══════ D. OVERVIEW METRICS ═══════ */}
          <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <article className="rounded-xl border border-surface-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-medium text-surface-500">
                <span>Active Projects</span>
                <Briefcase className="h-4 w-4 text-primary-600" />
              </div>
              <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-surface-900">
                {activeProjects.length}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-surface-500">
                <span>{completedProjects.length} completed</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("projects")}
                  className="font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded disabled:opacity-50"
                >
                  View
                </button>
              </div>
            </article>

            <article className="rounded-xl border border-surface-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-medium text-surface-500">
                <span>Proposals Sent</span>
                <FileText className="h-4 w-4 text-surface-500" />
              </div>
              <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-surface-900">
                {proposals.length}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-surface-500">
                <span>{shortlistedCount} shortlisted</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("proposals")}
                  className="font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded disabled:opacity-50"
                >
                  View
                </button>
              </div>
            </article>

            <article className="rounded-xl border border-surface-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-medium text-surface-500">
                <span>Unread Messages</span>
                <MessageSquare className="h-4 w-4 text-surface-500" />
              </div>
              <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-surface-900">
                {unreadNotifications}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-surface-500">
                <span>{activeMessageThreads} thread{activeMessageThreads === 1 ? "" : "s"}</span>
                <Link
                  href="/support"
                  className="font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                >
                  Inbox
                </Link>
              </div>
            </article>

            <article className="rounded-xl border border-surface-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-medium text-surface-500">
                <span>Wallet Balance</span>
                <Wallet className="h-4 w-4 text-success-600" />
              </div>
              <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-surface-900">
                {walletBalance.toLocaleString()} TOK
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-surface-500">
                <span className="tabular-nums">≈ ₹{(walletBalance * TOKEN_PRICE_INR).toLocaleString()}</span>
                <Link
                  href="/wallet"
                  className="font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                >
                  Wallet
                </Link>
              </div>
            </article>
          </section>

          {/* ═══════ TAB SWITCHED FOCUSED VIEWS OR OVERVIEW ═══════ */}
          {activeTab === "proposals" ? (
            <section className="rounded-xl border border-surface-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 pb-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-surface-900">
                    My Proposals
                  </h2>
                  <p className="text-xs text-surface-500">
                    Track submitted applications, shortlist statuses, and client responses.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
                  >
                    Back to overview
                  </button>
                  <Link
                    href="/freelancer/jobs"
                    className="btn-primary btn-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    Find new jobs
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {(["ALL", "SUBMITTED", "SHORTLISTED", "ACCEPTED", "REJECTED"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setProposalFilter(status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50 ${
                        proposalFilter === status
                          ? "bg-surface-900 text-white"
                          : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                      }`}
                    >
                      {status === "ALL"
                        ? `All (${proposals.length})`
                        : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 divide-y divide-surface-200 rounded-xl border border-surface-200">
                {filteredProposals.length === 0 ? (
                  <p className="p-8 text-center text-sm text-surface-500">
                    No proposals matching this filter.
                  </p>
                ) : (
                  filteredProposals.map((proposal) => (
                    <article
                      key={proposal.id}
                      className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={proposal.job?.id ? `/jobs/${proposal.job.id}` : "/jobs"}
                            className="font-heading text-sm font-semibold text-surface-900 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                          >
                            {proposal.job?.title || "Job contract"}
                          </Link>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                              PROPOSAL_STATUS_BADGE[proposal.status] ||
                              "bg-surface-100 text-surface-700 border-surface-200"
                            }`}
                          >
                            {proposal.status}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-surface-600">
                          {proposal.coverLetter}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-surface-500">
                          <span>
                            Client: {proposal.job?.client?.username || proposal.job?.client?.name || "Client"}
                          </span>
                          <span>Budget: ₹{(proposal.job?.budget || 0).toLocaleString()}</span>
                          <span>Submitted {new Date(proposal.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {proposal.status === "ACCEPTED" ? (
                          <Link
                            href="/projects"
                            className="rounded-lg bg-surface-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                          >
                            Open Workspace
                          </Link>
                        ) : null}
                        {proposal.job?.id ? (
                          <Link
                            href={`/jobs/${proposal.job.id}`}
                            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                          >
                            View job
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : activeTab === "projects" ? (
            <div className="space-y-6">
              <section className="rounded-xl border border-surface-200 bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-surface-900">
                      My Projects
                    </h2>
                    <p className="text-xs text-surface-500">
                      Active client contracts and completed deliverables.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
                  >
                    Back to overview
                  </button>
                </div>

                <ProjectsTable proposals={projectProposals} />
              </section>

              <FreelancerAnalytics />
            </div>
          ) : activeTab === "notifications" ? (
            <section className="rounded-xl border border-surface-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 pb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary-600" />
                  <h2 className="font-heading text-lg font-bold text-surface-900">
                    Notifications ({unreadNotifications} unread)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
                  >
                    Back to overview
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending || unreadNotifications === 0}
                    className="btn-secondary btn-sm inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 divide-y divide-surface-200 rounded-xl border border-surface-200">
                {(notificationsQuery.data?.notifications || []).length === 0 ? (
                  <p className="p-8 text-center text-sm text-surface-500">
                    You have no notifications.
                  </p>
                ) : (
                  (notificationsQuery.data?.notifications || []).map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-wrap items-start justify-between gap-3 p-4 ${
                        !item.isRead ? "bg-primary-50/30" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {!item.isRead ? (
                            <span className="h-2 w-2 rounded-full bg-primary-600" />
                          ) : null}
                          <p className="text-sm font-semibold text-surface-900">{item.title}</p>
                        </div>
                        <p className="mt-1 text-xs text-surface-600">{item.body}</p>
                        <p className="mt-1 text-[11px] text-surface-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {item.link ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!item.isRead) {
                              await markReadMutation.mutateAsync(item.id);
                            }
                            router.push(item.link!);
                          }}
                          className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
                        >
                          Open
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            /* ═══════ MAIN OVERVIEW 2-COLUMN WORKSPACE ═══════ */
            <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
              {/* Left Primary Column: Recommended Jobs + Active Projects */}
              <div className="min-w-0 space-y-6">
                {/* E. RECOMMENDED JOBS */}
                <section className="rounded-xl border border-surface-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 px-5 py-4">
                    <div>
                      <h2 className="font-heading text-base font-bold text-surface-900">
                        Recommended Jobs
                      </h2>
                      <p className="text-xs text-surface-500">
                        {searchQuery.trim()
                          ? `Showing open contracts matching "${searchQuery.trim()}"`
                          : "Open contracts matched to your verified skills and rate."}
                      </p>
                    </div>
                    <Link
                      href="/freelancer/jobs"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                    >
                      <span>View All Jobs</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {jobsQuery.isLoading ? (
                    <div className="space-y-3 p-5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-100 motion-reduce:animate-none" />
                      ))}
                    </div>
                  ) : recommendedJobs.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm font-medium text-surface-800">
                        No open jobs match your current search.
                      </p>
                      <p className="mt-1 text-xs text-surface-500">
                        Try clearing your search filter or browse the full marketplace board.
                      </p>
                      <Link
                        href="/jobs"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                      >
                        Browse all jobs
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-200">
                      {recommendedJobs.map(({ job, matchedSkills, alreadyApplied }) => {
                        const isSaved = savedJobIds.has(job.id);
                        const clientLabel =
                          job.client?.username || job.client?.name || "Client";

                        return (
                          <article
                            key={job.id}
                            className="p-5 transition-colors hover:bg-surface-50/70"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/jobs/${job.id}`}
                                    className="font-heading text-sm font-bold text-surface-900 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded sm:text-base"
                                  >
                                    {job.title}
                                  </Link>
                                  {alreadyApplied ? (
                                    <span className="rounded-md border border-primary-200 bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                                      Applied
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
                                  <span className="font-medium text-surface-700">
                                    {clientLabel}
                                  </span>
                                  {job.client?.email ? (
                                    <span className="inline-flex items-center gap-1 text-success-700">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Verified account
                                    </span>
                                  ) : null}
                                  <span>
                                    Posted {new Date(job.createdAt).toLocaleDateString()}
                                  </span>
                                  <span>
                                    {job._count?.proposals || 0} proposal{(job._count?.proposals || 0) === 1 ? "" : "s"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <div className="text-right">
                                  <p className="font-heading text-sm font-bold tabular-nums text-surface-900">
                                    ₹{job.budget.toLocaleString()}
                                  </p>
                                  <p className="text-[11px] tabular-nums text-surface-500">
                                    {job.applicationTokenCost ?? 5} TOK stake
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleSaveJobMutation.mutate(job.id)}
                                  disabled={toggleSaveJobMutation.isPending}
                                  aria-label={isSaved ? "Unsave job" : "Save job"}
                                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.96] disabled:opacity-50 ${
                                    isSaved
                                      ? "border-primary-200 bg-primary-50 text-primary-700"
                                      : "border-surface-200 bg-white text-surface-400 hover:border-surface-300 hover:text-surface-700"
                                  }`}
                                >
                                  {isSaved ? (
                                    <BookmarkCheck className="h-4 w-4" />
                                  ) : (
                                    <Bookmark className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-surface-600 sm:text-sm">
                              {job.description}
                            </p>

                            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {matchedSkills.length > 0 ? (
                                  matchedSkills.slice(0, 4).map((skill) => (
                                    <span
                                      key={skill}
                                      className="rounded-md border border-primary-200 bg-primary-50/70 px-2 py-0.5 text-[11px] font-medium text-primary-700"
                                    >
                                      {skill}
                                    </span>
                                  ))
                                ) : userSkills.length > 0 ? (
                                  userSkills.slice(0, 3).map((skill) => (
                                    <span
                                      key={skill}
                                      className="rounded-md border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] text-surface-600"
                                    >
                                      {skill}
                                    </span>
                                  ))
                                ) : (
                                  <span className="rounded-md border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] text-surface-600">
                                    Open scope
                                  </span>
                                )}
                              </div>

                              <Link
                                href={`/jobs/${job.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-800 transition-colors hover:border-primary-300 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                              >
                                <span>View Job</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* F. ACTIVE PROJECTS TABLE */}
                <section className="rounded-xl border border-surface-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 px-5 py-4">
                    <div>
                      <h2 className="font-heading text-base font-bold text-surface-900">
                        Active Projects
                      </h2>
                      <p className="text-xs text-surface-500">
                        Contracts in progress and verified milestones.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab("proposals")}
                        className="text-xs font-semibold text-surface-600 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded disabled:opacity-50"
                      >
                        Proposals ({proposals.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAnalytics((v) => !v)}
                        className="rounded-lg border border-surface-200 px-2.5 py-1 text-xs font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
                      >
                        {showAnalytics ? "Hide charts" : "Earnings charts"}
                      </button>
                    </div>
                  </div>

                  <ProjectsTable proposals={projectProposals} />
                </section>

                {showAnalytics ? (
                  <section className="rounded-xl border border-surface-200 bg-white p-5">
                    <FreelancerAnalytics />
                  </section>
                ) : null}
              </div>

              {/* Right Secondary Column: Profile Completeness, To-do, Recent Messages, Support */}
              <aside className="space-y-5">
                {/* 1. Profile Completeness */}
                <section className="rounded-xl border border-surface-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-sm font-bold text-surface-900">
                      Profile Completeness
                    </h2>
                    <span className="font-heading text-sm font-bold tabular-nums text-primary-700">
                      {profileCompleteness.percentage}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-100">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${profileCompleteness.percentage}%` }}
                    />
                  </div>

                  {profileCompleteness.missing.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {profileCompleteness.missing.slice(0, 3).map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-xs text-surface-600"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warning-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success-700">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>All profile criteria satisfied</span>
                    </p>
                  )}

                  <Link
                    href="/onboarding/freelancer?edit=1"
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-800 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    <span>
                      {profileCompleteness.missing.length > 0
                        ? "Complete Profile"
                        : "Review Profile"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </section>

                {/* 2. To-do */}
                <section className="rounded-xl border border-surface-200 bg-white p-5">
                  <h2 className="font-heading text-sm font-bold text-surface-900">
                    To-do
                  </h2>
                  <p className="mt-0.5 text-xs text-surface-500">
                    Pending actions across your proposals and profile.
                  </p>

                  <div className="mt-3.5 space-y-2.5">
                    {todoItems.map((todo) =>
                      todo.href ? (
                        <Link
                          key={todo.id}
                          href={todo.href}
                          className="flex items-start gap-2.5 rounded-lg border border-surface-200/80 p-2.5 transition-colors hover:border-surface-300 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        >
                          <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surface-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-surface-900">
                              {todo.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-surface-500">
                              {todo.meta}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <button
                          key={todo.id}
                          type="button"
                          onClick={todo.onClick}
                          className="flex w-full items-start gap-2.5 rounded-lg border border-surface-200/80 p-2.5 text-left transition-colors hover:border-surface-300 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] disabled:opacity-50"
                        >
                          <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surface-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-surface-900">
                              {todo.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-surface-500">
                              {todo.meta}
                            </p>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </section>

                {/* 3. Recent Messages */}
                <section className="rounded-xl border border-surface-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-sm font-bold text-surface-900">
                      Recent Messages
                    </h2>
                    <Link
                      href="/support"
                      className="text-xs font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                    >
                      Inbox
                    </Link>
                  </div>

                  {recentMessages.length === 0 ? (
                    <p className="mt-3 text-xs text-surface-500">
                      Messaging opens once a client accepts one of your proposals.
                    </p>
                  ) : (
                    <div className="mt-3.5 divide-y divide-surface-100">
                      {recentMessages.map((msg) => (
                        <div key={msg.proposalId} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-surface-900">
                              {msg.senderName}
                            </p>
                            <span className="shrink-0 text-[11px] text-surface-400">
                              {new Date(msg.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="truncate text-[11px] font-medium text-primary-700">
                            {msg.jobTitle}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-surface-500">
                            {msg.preview}
                          </p>
                          <Link
                            href="/projects"
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-surface-700 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                          >
                            <span>Open conversation</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 4. Support Shortcut */}
                <section className="rounded-xl border border-surface-200 bg-white p-5">
                  <h2 className="font-heading text-sm font-bold text-surface-900">
                    Help &amp; Assistance
                  </h2>
                  <p className="mt-1 text-xs text-surface-500">
                    Escrow support, message threads, or instant AI guidance.
                  </p>
                  <div className="mt-3.5 grid grid-cols-2 gap-2">
                    <Link
                      href="/support"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-800 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      <LifeBuoy className="h-3.5 w-3.5 text-primary-600" />
                      <span>Support</span>
                    </Link>
                    <Link
                      href="/chatbot"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-800 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      <Bot className="h-3.5 w-3.5 text-primary-600" />
                      <span>AI Help</span>
                    </Link>
                  </div>
                </section>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectsTable({ proposals }: { proposals: ProposalItem[] }) {
  if (proposals.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium text-surface-800">
          No active contracts yet.
        </p>
        <p className="mt-1 text-xs text-surface-500">
          Once a client accepts your proposal, your active project deliverables appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-600">
            <th className="px-5 py-3">Project</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {proposals.map((item) => {
            const job = item.job!;
            const badge = JOB_STATUS_BADGE[job.status] || JOB_STATUS_BADGE.OPEN;
            const dateStr = new Date(
              job.completedAt || item.updatedAt || item.createdAt
            ).toLocaleDateString();

            return (
              <tr key={item.id} className="transition-colors hover:bg-surface-50/70">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-semibold text-surface-900 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                  >
                    {job.title}
                  </Link>
                  <p className="text-xs tabular-nums text-surface-500">
                    ₹{(job.budget || 0).toLocaleString()}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-xs text-surface-700">
                  {job.client?.username || job.client?.name || "Client"}
                </td>
                <td className="px-4 py-3.5 text-xs tabular-nums text-surface-500">
                  {dateStr}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href="/projects"
                      className="rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      Open Workspace
                    </Link>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="rounded-md border border-surface-200 bg-white px-2.5 py-1 text-xs font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
