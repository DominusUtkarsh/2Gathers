"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  Layers,
  Lock,
  Send,
  Settings2,
  Star,
} from "lucide-react";

import { reviewsApi } from "@/lib/api";
import { TOKEN_PRICE_INR } from "@/lib/tokenomics";
import { MilestoneProgressBar } from "./MilestoneProgressBar";
import { EscrowStatusBadge, ProjectStatusBadge } from "./DeliverableStatusBadge";
import {
  formatRelativeTime,
  getDeadlineMeta,
  getDisplayName,
  type ProjectDetail,
  type WorkspaceTabKey,
} from "./types";

type OverviewTabProps = {
  project: ProjectDetail;
  currentUserId: number;
  viewerRole: "CLIENT" | "FREELANCER" | "ADMIN";
  onSelectTab: (tab: WorkspaceTabKey) => void;
  onOpenSubmitDeliverable: () => void;
  onUpdateProject: (payload: {
    status?: ProjectDetail["status"];
    maxRevisions?: number | null;
  }) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function OverviewTab({
  project,
  currentUserId,
  viewerRole,
  onSelectTab,
  onOpenSubmitDeliverable,
  onUpdateProject,
  onRefresh,
}: OverviewTabProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  const approvedDeliverables = project.deliverables.filter(
    (d) => d.status === "APPROVED",
  ).length;
  const awaitingReview = project.deliverables.filter((d) =>
    ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"].includes(d.status),
  );
  const revisionsNeeded = project.deliverables.filter(
    (d) => d.status === "REVISION_REQUESTED",
  );
  const releasedMilestones = project.milestones.filter(
    (m) => m.status === "RELEASED",
  ).length;

  const overdueItems = [
    ...project.deliverables.filter(
      (d) =>
        getDeadlineMeta(d.dueDate, d.status === "APPROVED").state === "OVERDUE",
    ),
    ...project.milestones.filter(
      (m) =>
        getDeadlineMeta(
          m.dueDate,
          m.status === "RELEASED" || m.status === "COMPLETED",
        ).state === "OVERDUE",
    ),
  ];

  const myReview = project.reviews.find((r) => r.authorId === currentUserId);
  const canLeaveReview =
    project.status === "COMPLETED" &&
    viewerRole !== "ADMIN" &&
    !myReview;

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (comment.trim().length < 3) {
      setReviewError("Please write at least 3 characters for your review.");
      return;
    }
    setReviewError("");
    setSubmittingReview(true);
    try {
      await reviewsApi.create({
        jobId: project.jobId,
        rating,
        comment: comment.trim(),
      });
      setComment("");
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to submit review.";
      setReviewError(detail);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleRevisionCapChange(nextVal: string) {
    setSettingsError("");
    setSavingSettings(true);
    try {
      await onUpdateProject({
        maxRevisions: nextVal === "UNLIMITED" ? null : Number(nextVal),
      });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to update revision cap.";
      setSettingsError(detail);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleStatusChange(nextStatus: ProjectDetail["status"]) {
    setSettingsError("");
    setSavingSettings(true);
    try {
      await onUpdateProject({ status: nextStatus });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to update project status.";
      setSettingsError(detail);
    } finally {
      setSavingSettings(false);
    }
  }

  // Determine the single clearest Next Action for the viewer
  let nextActionTitle = "Workspace up to date";
  let nextActionBody =
    "Review recent milestones and coordinate with your partner in Messages.";
  let nextActionButton: { label: string; onClick: () => void } | null = null;

  if (project.status === "COMPLETED") {
    nextActionTitle = myReview
      ? "Contract completed and reviewed"
      : "Contract completed — leave a review";
    nextActionBody = myReview
      ? "All milestones and reviews for this contract are finalized."
      : "Share your experience working together to update marketplace reputation.";
  } else if (viewerRole === "CLIENT") {
    if (awaitingReview.length > 0) {
      nextActionTitle = `${awaitingReview.length} deliverable awaiting your review`;
      nextActionBody = `Inspect \"${awaitingReview[0].title}\" to approve or request changes.`;
      nextActionButton = {
        label: "Review deliverables",
        onClick: () => onSelectTab("deliverables"),
      };
    } else if (project.milestones.length === 0) {
      nextActionTitle = "Set up your first milestone";
      nextActionBody =
        "Break the contract scope into clear deliverables with token escrow protection.";
      nextActionButton = {
        label: "Create milestone",
        onClick: () => onSelectTab("milestones"),
      };
    } else {
      const readyToRelease = project.milestones.find(
        (m) => m.status === "COMPLETED" && m.escrowStatus !== "RELEASED",
      );
      if (readyToRelease) {
        nextActionTitle = `Ready to release escrow for \"${readyToRelease.title}\"`;
        nextActionBody =
          "All deliverables attached to this milestone are approved.";
        nextActionButton = {
          label: "Go to escrow release",
          onClick: () => onSelectTab("milestones"),
        };
      }
    }
  } else if (viewerRole === "FREELANCER") {
    if (revisionsNeeded.length > 0) {
      nextActionTitle = `${revisionsNeeded.length} deliverable needs revision`;
      nextActionBody = `Check feedback on \"${revisionsNeeded[0].title}\" and submit an updated version.`;
      nextActionButton = {
        label: "Open deliverables",
        onClick: () => onSelectTab("deliverables"),
      };
    } else if (awaitingReview.length > 0) {
      nextActionTitle = "Deliverable awaiting client review";
      nextActionBody = `\"${awaitingReview[0].title}\" has been submitted. Use Messages if the client asks questions.`;
      nextActionButton = {
        label: "View status",
        onClick: () => onSelectTab("deliverables"),
      };
    } else {
      nextActionTitle = "Ready to submit your next draft";
      nextActionBody =
        "Upload work files or staging links so your client can review against milestones.";
      nextActionButton = {
        label: "Submit deliverable",
        onClick: onOpenSubmitDeliverable,
      };
    }
  }

  return (
    <div className="space-y-6">
      {/* Persistent project health / deadline warning banner */}
      {overdueItems.length > 0 && project.status !== "COMPLETED" && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger-600" />
            <span>
              <strong className="font-semibold">{overdueItems.length}</strong>{" "}
              {overdueItems.length === 1 ? "item is" : "items are"} past due.
              Review milestone dates or send an update in Messages.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("milestones")}
            className="text-xs font-semibold text-danger-800 underline hover:text-danger-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 rounded"
          >
            Inspect schedule
          </button>
        </div>
      )}

      {/* Next Action Banner */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary-200/80 bg-white p-5 shadow-card-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-primary-700">
              <Send className="h-3.5 w-3.5" />
            </span>
            <h2 className="font-heading text-base font-semibold text-surface-900">
              {nextActionTitle}
            </h2>
          </div>
          <p className="text-sm text-surface-600">{nextActionBody}</p>
        </div>
        {nextActionButton && (
          <button
            type="button"
            onClick={nextActionButton.onClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] motion-reduce:transform-none"
          >
            <span>{nextActionButton.label}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </section>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card-sm">
          <p className="text-xs font-medium text-surface-500">Contract budget</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-surface-900">
            ₹{project.job.budget.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-surface-500">
            {project.milestones.length} milestones structured
          </p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card-sm">
          <p className="text-xs font-medium text-surface-500">
            Milestones released
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-surface-900">
            {releasedMilestones} / {project.milestones.length}
          </p>
          <p className="mt-1 text-xs text-success-700 tabular-nums">
            {project.escrowSummary.releasedTokens} TOK disbursed
          </p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card-sm">
          <p className="text-xs font-medium text-surface-500">
            Deliverables approved
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-surface-900">
            {approvedDeliverables} / {project.deliverables.length}
          </p>
          <p className="mt-1 text-xs text-surface-500">
            {awaitingReview.length} awaiting review
          </p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card-sm">
          <p className="text-xs font-medium text-surface-500">Escrow locked</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-surface-900">
            {project.escrowSummary.fundedTokens} TOK
          </p>
          <p className="mt-1 text-xs text-surface-500 tabular-nums">
            Approx. ₹
            {(
              project.escrowSummary.fundedTokens * TOKEN_PRICE_INR
            ).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Two-column body: Milestones & Scope left, Activity & Settings right */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {/* Milestones overview */}
          <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-600" />
                <h2 className="font-heading text-base font-semibold text-surface-900">
                  Milestones progress
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("milestones")}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                Manage milestones
              </button>
            </div>

            {project.milestones.length === 0 ? (
              <p className="rounded-xl border border-dashed border-surface-200 bg-surface-50 px-4 py-6 text-center text-sm text-surface-500">
                No milestones defined yet.{" "}
                {viewerRole === "CLIENT"
                  ? "Create milestones to break down deliverables and fund escrow."
                  : "The client has not created milestones yet; you can still submit drafts in Deliverables."}
              </p>
            ) : (
              <div className="space-y-3">
                {project.milestones.map((m) => {
                  const approvedCount = m.deliverables.filter(
                    (d) => d.status === "APPROVED",
                  ).length;
                  const deadline = getDeadlineMeta(
                    m.dueDate,
                    m.status === "RELEASED" || m.status === "COMPLETED",
                  );
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-surface-200 bg-surface-50/50 p-3.5"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-sm text-surface-900">
                          {m.title}
                        </span>
                        <div className="flex items-center gap-2">
                          {deadline.label && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${deadline.className}`}
                            >
                              {deadline.label}
                            </span>
                          )}
                          <EscrowStatusBadge status={m.escrowStatus} />
                          <span className="text-xs font-semibold tabular-nums text-surface-800">
                            {m.amount} TOK
                          </span>
                        </div>
                      </div>
                      <MilestoneProgressBar
                        approved={approvedCount}
                        total={m.deliverables.length}
                        released={m.status === "RELEASED"}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Contract Scope */}
          <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary-600" />
              <h2 className="font-heading text-base font-semibold text-surface-900">
                Contract brief
              </h2>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-surface-600">
              {project.job.description}
            </p>
          </section>

          {/* End-of-project Review & Rating Panel */}
          <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning-500" />
                <h2 className="font-heading text-base font-semibold text-surface-900">
                  Contract reviews
                </h2>
              </div>
              <ProjectStatusBadge status={project.status} />
            </div>

            {project.status !== "COMPLETED" ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-600">
                <Lock className="h-4 w-4 shrink-0 text-surface-400" />
                <span>
                  Reviews become available once the client marks the contract as Completed.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {project.reviews.length > 0 && (
                  <div className="space-y-2.5">
                    {project.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border border-surface-200 bg-surface-50 p-3.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-surface-900">
                            {rev.author.name || rev.author.username} (
                            {rev.author.role.toLowerCase()})
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-warning-700 tabular-nums">
                            <span>{rev.rating} / 5</span>
                            <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-surface-700">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {canLeaveReview && (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-surface-600">
                        Rating
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            aria-label={`Rate ${value} out of 5`}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:opacity-50 motion-reduce:transform-none ${
                              rating >= value
                                ? "border-warning-300 bg-warning-50 text-warning-700"
                                : "border-surface-200 bg-white text-surface-500"
                            }`}
                          >
                            <span>{value}</span>
                            <Star
                              className={`h-3 w-3 ${
                                rating >= value ? "fill-warning-500 text-warning-500" : ""
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contract-review-comment"
                        className="mb-1 block text-xs font-medium text-surface-600"
                      >
                        Feedback for{" "}
                        {viewerRole === "CLIENT"
                          ? getDisplayName(project.freelancer)
                          : getDisplayName(project.client)}
                      </label>
                      <textarea
                        id="contract-review-comment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Summarize delivery quality, communication, and adherence to milestones..."
                        className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      />
                    </div>

                    {reviewError && (
                      <p className="text-xs font-medium text-danger-600">
                        {reviewError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {submittingReview ? "Submitting..." : "Publish review"}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Recent Activity & Client Settings */}
        <div className="space-y-6 lg:col-span-5">
          {viewerRole === "CLIENT" && (
            <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary-600" />
                <h2 className="font-heading text-base font-semibold text-surface-900">
                  Client contract controls
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="project-status-select"
                    className="mb-1 block text-xs font-medium text-surface-600"
                  >
                    Contract status
                  </label>
                  <select
                    id="project-status-select"
                    value={project.status}
                    disabled={savingSettings}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target.value as ProjectDetail["status"],
                      )
                    }
                    className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="IN_REVIEW">In review</option>
                    <option value="COMPLETED">Completed (finalizes contract)</option>
                    <option value="DISPUTED">Disputed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="project-revision-cap"
                    className="mb-1 block text-xs font-medium text-surface-600"
                  >
                    Revision cap per deliverable
                  </label>
                  <select
                    id="project-revision-cap"
                    value={
                      project.maxRevisions === null
                        ? "UNLIMITED"
                        : String(project.maxRevisions)
                    }
                    disabled={savingSettings}
                    onChange={(e) => handleRevisionCapChange(e.target.value)}
                    className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="UNLIMITED">Unlimited revisions</option>
                    <option value="2">2 revisions max</option>
                    <option value="3">3 revisions max</option>
                    <option value="5">5 revisions max</option>
                  </select>
                  <p className="mt-1 text-xs text-surface-500">
                    Prevents endless revision cycles once the cap is reached.
                  </p>
                </div>

                {settingsError && (
                  <p className="text-xs font-medium text-danger-600">
                    {settingsError}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Recent Activity Feed Preview */}
          <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-600" />
                <h2 className="font-heading text-base font-semibold text-surface-900">
                  Recent activity
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("activity")}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                Full log
              </button>
            </div>

            {project.activityLogs.length === 0 ? (
              <p className="text-sm text-surface-500">No events recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {project.activityLogs.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b border-surface-100 pb-2.5 text-xs last:border-none last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-surface-800">
                        {item.actor.name || item.actor.username || "Member"}{" "}
                        <span className="font-normal text-surface-600">
                          {item.type.replaceAll("_", " ").toLowerCase()}
                        </span>
                      </p>
                      {typeof item.metadata?.title === "string" && (
                        <p className="truncate text-surface-500">
                          {item.metadata.title}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 tabular-nums text-surface-400">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-surface-100 pt-3">
              <Link
                href="/support"
                className="text-xs font-medium text-surface-500 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                Need help with this contract? Open support
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
