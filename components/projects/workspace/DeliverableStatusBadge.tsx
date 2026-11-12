"use client";

import {
  CheckCircle2,
  Clock,
  FileEdit,
  Eye,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";

const DELIVERABLE_STYLES: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  DRAFT: {
    label: "Draft",
    className: "border-surface-200 bg-surface-100 text-surface-700",
    icon: FileEdit,
  },
  SUBMITTED: {
    label: "Submitted",
    className: "border-primary-200 bg-primary-50 text-primary-700",
    icon: Clock,
  },
  IN_REVIEW: {
    label: "In review",
    className: "border-warning-200 bg-warning-50 text-warning-700",
    icon: Eye,
  },
  REVISION_REQUESTED: {
    label: "Revision requested",
    className: "border-danger-200 bg-danger-50 text-danger-700",
    icon: RotateCcw,
  },
  RESUBMITTED: {
    label: "Resubmitted",
    className: "border-primary-200 bg-primary-50 text-primary-700",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    className: "border-success-200 bg-success-50 text-success-700",
    icon: CheckCircle2,
  },
};

const PROJECT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "border-primary-200 bg-primary-50 text-primary-700",
  },
  IN_REVIEW: {
    label: "In review",
    className: "border-warning-200 bg-warning-50 text-warning-700",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-success-200 bg-success-50 text-success-700",
  },
  DISPUTED: {
    label: "Disputed",
    className: "border-danger-200 bg-danger-50 text-danger-700",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-surface-200 bg-surface-100 text-surface-600",
  },
};

const ESCROW_STYLES: Record<
  string,
  { label: string; className: string; icon: typeof Lock }
> = {
  UNFUNDED: {
    label: "Unfunded",
    className: "border-surface-200 bg-surface-50 text-surface-600",
    icon: AlertTriangle,
  },
  FUNDED: {
    label: "Escrow locked",
    className: "border-primary-200 bg-primary-50 text-primary-700",
    icon: Lock,
  },
  RELEASED: {
    label: "Released",
    className: "border-success-200 bg-success-50 text-success-700",
    icon: ShieldCheck,
  },
};

export function DeliverableStatusBadge({ status }: { status: string }) {
  const cfg = DELIVERABLE_STYLES[status] ?? DELIVERABLE_STYLES.DRAFT;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const cfg = PROJECT_STATUS_STYLES[status] ?? PROJECT_STATUS_STYLES.ACTIVE;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function EscrowStatusBadge({ status }: { status: string }) {
  const cfg = ESCROW_STYLES[status] ?? ESCROW_STYLES.UNFUNDED;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}
