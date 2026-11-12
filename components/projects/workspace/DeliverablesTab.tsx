"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Upload,
} from "lucide-react";

import { projectsApi } from "@/lib/api";
import { DeliverableStatusBadge } from "./DeliverableStatusBadge";
import {
  extractFileName,
  formatRelativeTime,
  getDeadlineMeta,
  type ProjectDeliverableSummary,
  type ProjectDetail,
} from "./types";

type DeliverablesTabProps = {
  project: ProjectDetail;
  viewerRole: "CLIENT" | "FREELANCER" | "ADMIN";
  showCreateForm: boolean;
  onToggleCreateForm: (open: boolean) => void;
  onRefresh: () => Promise<void>;
};

export function DeliverablesTab({
  project,
  viewerRole,
  showCreateForm,
  onToggleCreateForm,
  onRefresh,
}: DeliverablesTabProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Revision / action state per deliverable
  const [revisionTargetId, setRevisionTargetId] = useState<number | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const filtered = project.deliverables.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "AWAITING_REVIEW") {
      return ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"].includes(item.status);
    }
    return item.status === filter;
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFormError("");
    setUploadingFile(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const res = await projectsApi.uploadFile(project.id, file);
        if (res.data?.url) {
          uploadedUrls.push(res.data.url);
        }
      }
      setFileUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "File upload failed.";
      setFormError(detail);
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  }

  function handleAddExternalLink() {
    const trimmed = externalUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setFormError("External link must start with http:// or https://");
      return;
    }
    setFormError("");
    setFileUrls((prev) => [...prev, trimmed]);
    setExternalUrl("");
  }

  async function handleCreateDeliverable(submitNow: boolean) {
    if (title.trim().length < 2) {
      setFormError("Deliverable title must be at least 2 characters.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await projectsApi.deliverables.create(project.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        milestoneId: milestoneId ? Number(milestoneId) : null,
        dueDate: dueDate || null,
        fileUrls,
        submitNow,
      });
      setTitle("");
      setDescription("");
      setMilestoneId("");
      setDueDate("");
      setFileUrls([]);
      onToggleCreateForm(false);
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to save deliverable.";
      setFormError(detail);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusTransition(
    item: ProjectDeliverableSummary,
    nextStatus:
      | "SUBMITTED"
      | "IN_REVIEW"
      | "REVISION_REQUESTED"
      | "RESUBMITTED"
      | "APPROVED",
    feedback?: string,
  ) {
    setActionError("");
    setActionBusyId(item.id);
    try {
      await projectsApi.deliverables.update(project.id, item.id, {
        status: nextStatus,
        ...(feedback ? { feedback } : {}),
      });
      setRevisionTargetId(null);
      setRevisionFeedback("");
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Action failed.";
      setActionError(detail);
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleDeleteDraft(deliverableId: number) {
    setActionError("");
    setActionBusyId(deliverableId);
    try {
      await projectsApi.deliverables.remove(project.id, deliverableId);
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to delete draft.";
      setActionError(detail);
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "All" },
            { key: "AWAITING_REVIEW", label: "Awaiting review" },
            { key: "REVISION_REQUESTED", label: "Revisions" },
            { key: "APPROVED", label: "Approved" },
            { key: "DRAFT", label: "Drafts" },
          ].map((pill) => {
            const active = filter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setFilter(pill.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  active
                    ? "bg-surface-900 text-white"
                    : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {viewerRole === "FREELANCER" && project.status !== "COMPLETED" && (
          <button
            type="button"
            onClick={() => onToggleCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] motion-reduce:transform-none"
          >
            <Plus className="h-4 w-4" />
            <span>{showCreateForm ? "Close form" : "New deliverable"}</span>
          </button>
        )}
      </div>

      {/* Freelancer Submit Deliverable Form */}
      {viewerRole === "FREELANCER" && showCreateForm && (
        <section className="rounded-2xl border border-primary-200 bg-white p-5 shadow-card-sm">
          <h2 className="font-heading text-base font-semibold text-surface-900">
            Prepare work submission
          </h2>
          <p className="mt-0.5 text-xs text-surface-500">
            Attach files or links (Figma, GitHub PR, staging URL) and submit for client review.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="deliverable-title"
                className="mb-1 block text-xs font-medium text-surface-600"
              >
                Deliverable title
              </label>
              <input
                id="deliverable-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Auth API + Dashboard wireframe V2"
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="deliverable-milestone"
                className="mb-1 block text-xs font-medium text-surface-600"
              >
                Link to milestone (optional)
              </label>
              <select
                id="deliverable-milestone"
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="">Unassigned to milestone</option>
                {project.milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.amount} TOK)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="deliverable-due"
                className="mb-1 block text-xs font-medium text-surface-600"
              >
                Target due date (optional)
              </label>
              <input
                id="deliverable-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="deliverable-notes"
                className="mb-1 block text-xs font-medium text-surface-600"
              >
                Submission notes
              </label>
              <textarea
                id="deliverable-notes"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize what changed, test instructions, or review notes..."
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>

            {/* File upload + link attachment */}
            <div className="sm:col-span-2 space-y-2.5">
              <p className="text-xs font-medium text-surface-600">
                Attachments ({fileUrls.length})
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-100 focus-within:ring-2 focus-within:ring-primary-500">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingFile ? "Uploading..." : "Upload file"}</span>
                  <input
                    type="file"
                    multiple
                    disabled={uploadingFile}
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>

                <div className="flex flex-1 min-w-[220px] items-center gap-2">
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://github.com/... or Figma URL"
                    aria-label="External artifact link"
                    className="min-w-0 flex-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-900 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalLink}
                    className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Add link</span>
                  </button>
                </div>
              </div>

              {fileUrls.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {fileUrls.map((url, idx) => (
                    <li
                      key={`${url}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs text-surface-700"
                    >
                      <Paperclip className="h-3 w-3 text-surface-400" />
                      <span className="max-w-[180px] truncate">
                        {extractFileName(url)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFileUrls((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label="Remove attachment"
                        className="text-surface-400 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-xs font-medium text-danger-600">
              {formError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 border-t border-surface-100 pt-4">
            <button
              type="button"
              disabled={submitting || uploadingFile}
              onClick={() => handleCreateDeliverable(false)}
              className="rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-xs font-semibold text-surface-700 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
            >
              Save as draft
            </button>
            <button
              type="button"
              disabled={submitting || uploadingFile}
              onClick={() => handleCreateDeliverable(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? "Submitting..." : "Submit for review"}</span>
            </button>
          </div>
        </section>
      )}

      {actionError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-xs font-medium text-danger-700">
          {actionError}
        </div>
      )}

      {/* Deliverables List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-surface-300" />
          <p className="mt-2 font-heading text-sm font-semibold text-surface-900">
            No deliverables match this view
          </p>
          <p className="mt-1 text-xs text-surface-500">
            {viewerRole === "FREELANCER"
              ? "Create your first deliverable draft or submit completed work to kick off client review."
              : "Deliverables submitted by your freelancer will appear here for review and approval."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const deadline = getDeadlineMeta(
              item.dueDate,
              item.status === "APPROVED",
            );
            const busy = actionBusyId === item.id;
            const revLimitReached =
              typeof project.maxRevisions === "number" &&
              item.revisionCount >= project.maxRevisions;

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm transition-colors hover:border-surface-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/projects/${project.id}/deliverables/${item.id}`}
                        className="font-heading text-base font-semibold text-surface-900 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                      >
                        {item.title}
                      </Link>
                      <DeliverableStatusBadge status={item.status} />
                      {deadline.label && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${deadline.className}`}
                        >
                          {deadline.label}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="line-clamp-2 text-sm text-surface-600">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-surface-500">
                      {item.milestone && (
                        <span className="rounded-md bg-surface-100 px-2 py-0.5 font-medium text-surface-700">
                          Milestone: {item.milestone.title}
                        </span>
                      )}
                      <span className="tabular-nums">
                        Revisions: {item.revisionCount}
                        {project.maxRevisions !== null
                          ? ` / ${project.maxRevisions}`
                          : ""}
                      </span>
                      <span className="tabular-nums">
                        {item.fileUrls.length}{" "}
                        {item.fileUrls.length === 1 ? "file" : "files"}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{item._count?.comments ?? 0} comments</span>
                      </span>
                      {item.submittedAt && (
                        <span>
                          Submitted {formatRelativeTime(item.submittedAt)}
                        </span>
                      )}
                    </div>

                    {item.fileUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {item.fileUrls.map((url, idx) => (
                          <a
                            key={`${url}-${idx}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs font-medium text-surface-700 hover:border-surface-300 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          >
                            <Paperclip className="h-3 w-3 text-surface-400" />
                            <span className="max-w-[160px] truncate">
                              {extractFileName(url)}
                            </span>
                            <ExternalLink className="h-3 w-3 text-surface-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Role-aware right-aligned actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {viewerRole === "CLIENT" &&
                      ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"].includes(
                        item.status,
                      ) && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleStatusTransition(item, "APPROVED")
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>

                          {!revLimitReached && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setRevisionTargetId(
                                  revisionTargetId === item.id ? null : item.id,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-700 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Request revision</span>
                            </button>
                          )}
                        </>
                      )}

                    {viewerRole === "FREELANCER" && item.status === "DRAFT" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleStatusTransition(item, "SUBMITTED")
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Submit</span>
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDeleteDraft(item.id)}
                          aria-label={`Delete draft ${item.title}`}
                          className="rounded-lg border border-surface-200 p-1.5 text-surface-500 hover:border-danger-200 hover:bg-danger-50 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    {viewerRole === "FREELANCER" &&
                      item.status === "REVISION_REQUESTED" && (
                        <Link
                          href={`/projects/${project.id}/deliverables/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Revise & resubmit</span>
                        </Link>
                      )}

                    <Link
                      href={`/projects/${project.id}/deliverables/${item.id}`}
                      className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Open thread
                    </Link>
                  </div>
                </div>

                {/* Inline Client Revision Request Box */}
                {viewerRole === "CLIENT" && revisionTargetId === item.id && (
                  <div className="mt-4 border-t border-surface-100 pt-3">
                    <label
                      htmlFor={`revision-note-${item.id}`}
                      className="mb-1 block text-xs font-medium text-surface-600"
                    >
                      Specify requested changes for the freelancer
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        id={`revision-note-${item.id}`}
                        type="text"
                        value={revisionFeedback}
                        onChange={(e) => setRevisionFeedback(e.target.value)}
                        placeholder="e.g., Please update header contrast and attach mobile screen recording..."
                        className="min-w-[240px] flex-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      />
                      <button
                        type="button"
                        disabled={busy || !revisionFeedback.trim()}
                        onClick={() =>
                          handleStatusTransition(
                            item,
                            "REVISION_REQUESTED",
                            revisionFeedback.trim(),
                          )
                        }
                        className="rounded-lg bg-danger-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Send revision request
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
