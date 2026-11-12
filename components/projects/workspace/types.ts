export type WorkspaceTabKey =
  | "overview"
  | "deliverables"
  | "milestones"
  | "messages"
  | "files"
  | "activity";

export type ProjectUserSummary = {
  id: number;
  name: string;
  username: string | null;
  email?: string;
  role?: string;
  clientProfile?: {
    displayName: string;
    companyName?: string | null;
    timezone?: string | null;
  } | null;
  freelancerProfile?: {
    professionalTitle: string;
    availability?: string;
    responseTime?: string;
  } | null;
};

export type ProjectMilestoneSummary = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  amount: number;
  dueDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "RELEASED";
  escrowStatus: "UNFUNDED" | "FUNDED" | "RELEASED";
  releasedAt: string | null;
  createdAt: string;
  deliverables: Array<{
    id: number;
    title: string;
    status: string;
    dueDate: string | null;
  }>;
};

export type ProjectDeliverableSummary = {
  id: number;
  projectId: number;
  milestoneId: number | null;
  title: string;
  description: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "IN_REVIEW"
    | "REVISION_REQUESTED"
    | "RESUBMITTED"
    | "APPROVED";
  revisionCount: number;
  fileUrls: string[];
  submittedAt: string | null;
  approvedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  milestone?: {
    id: number;
    title: string;
    status: string;
  } | null;
  _count?: {
    comments: number;
  };
};

export type ProjectActivityItem = {
  id: number;
  projectId: number;
  actorId: number;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: number;
    name: string;
    username: string | null;
    role: string;
  };
};

export type ProjectReviewItem = {
  id: number;
  jobId: number;
  authorId: number;
  targetUserId: number;
  rating: number;
  comment: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    username: string | null;
    role: string;
  };
};

export type ProjectEscrowTx = {
  id: number;
  txHash: string;
  type: string;
  tokenAmount: number;
  totalInr: number;
  status: string;
  network: string;
  createdAt: string;
  userId: number;
};

export type ProjectDetail = {
  id: number;
  jobId: number;
  proposalId: number;
  clientId: number;
  freelancerId: number;
  status: "ACTIVE" | "IN_REVIEW" | "COMPLETED" | "DISPUTED" | "CANCELLED";
  maxRevisions: number | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: number;
    title: string;
    description: string;
    budget: number;
    status: string;
    completedAt: string | null;
  };
  client: ProjectUserSummary;
  freelancer: ProjectUserSummary;
  milestones: ProjectMilestoneSummary[];
  deliverables: ProjectDeliverableSummary[];
  activityLogs: ProjectActivityItem[];
  reviews: ProjectReviewItem[];
  escrowTransactions: ProjectEscrowTx[];
  escrowSummary: {
    totalMilestoneAmount: number;
    fundedTokens: number;
    releasedTokens: number;
  };
};

export type ProjectListItem = {
  id: number;
  jobId: number;
  status: "ACTIVE" | "IN_REVIEW" | "COMPLETED" | "DISPUTED" | "CANCELLED";
  startedAt: string;
  updatedAt: string;
  job: {
    id: number;
    title: string;
    budget: number;
    status: string;
  };
  client: ProjectUserSummary;
  freelancer: ProjectUserSummary;
  milestones: Array<{
    id: number;
    status: string;
    escrowStatus: string;
    amount: number;
    dueDate: string | null;
  }>;
  deliverables: Array<{
    id: number;
    status: string;
    dueDate: string | null;
  }>;
  activityLogs: Array<{
    id: number;
    type: string;
    createdAt: string;
  }>;
  _count: {
    deliverables: number;
    milestones: number;
    projectMessages: number;
  };
};

export type ProjectMessageItem = {
  id: number;
  projectId: number;
  senderId: number;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    username: string | null;
    role: string;
  };
};

export function getInitials(name?: string | null, username?: string | null) {
  const source = (name || username || "2G").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function getDisplayName(user?: ProjectUserSummary | null) {
  if (!user) return "Member";
  return (
    user.clientProfile?.companyName ||
    user.clientProfile?.displayName ||
    user.name ||
    user.username ||
    "Member"
  );
}

export function getDeadlineMeta(dueDate: string | null | undefined, completed: boolean) {
  if (!dueDate || completed) {
    return { state: "NONE" as const, label: null, className: "" };
  }
  const dueMs = new Date(dueDate).getTime();
  if (!Number.isFinite(dueMs)) {
    return { state: "NONE" as const, label: null, className: "" };
  }
  const diffHours = (dueMs - Date.now()) / (1000 * 60 * 60);
  const formatted = new Date(dueMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (diffHours < 0) {
    return {
      state: "OVERDUE" as const,
      label: `Overdue (${formatted})`,
      className: "border-danger-200 bg-danger-50 text-danger-700",
    };
  }
  if (diffHours <= 48) {
    return {
      state: "DUE_SOON" as const,
      label: `Due soon (${formatted})`,
      className: "border-warning-200 bg-warning-50 text-warning-700",
    };
  }
  return {
    state: "ON_TRACK" as const,
    label: `Due ${formatted}`,
    className: "border-success-200 bg-success-50 text-success-700",
  };
}

export function extractFileName(url: string) {
  try {
    const clean = url.split("?")[0];
    const last = clean.split("/").pop() || url;
    const stripped = last.replace(/^\d+-[a-f0-9]+-/, "");
    return decodeURIComponent(stripped) || last;
  } catch {
    return url;
  }
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
