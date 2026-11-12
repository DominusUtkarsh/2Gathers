"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Link2,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  ShieldAlert,
  Upload,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { projectsApi } from "@/lib/api";
import { DeliverableStatusBadge } from "@/components/projects/workspace/DeliverableStatusBadge";
import {
  extractFileName,
  formatRelativeTime,
  getDeadlineMeta,
  getInitials,
} from "@/components/projects/workspace/types";

type DeliverableCommentItem = {
  id: number;
  body: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    username: string | null;
    role: string;
  };
};

type DeliverableFull = {
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
  milestone?: {
    id: number;
    title: string;
    amount: number;
    status: string;
    escrowStatus: string;
  } | null;
  comments: DeliverableCommentItem[];
};

type ProjectMeta = {
  id: number;
  maxRevisions: number | null;
  job: { id: number; title: string };
};

export default function DeliverableDetailPage() {
  const params = useParams<{ projectId: string; deliverableId: string }>();
  const { user } = useAuth();
  const { projectId, deliverableId } = params;

  const [commentBody, setCommentBody] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionBox, setShowRevisionBox] = useState(false);

  // Freelancer edit state when in DRAFT or REVISION_REQUESTED
  const [editNotes, setEditNotes] = useState("");
  const [editFiles, setEditFiles] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState("");

  const query = useQuery({
    queryKey: ["deliverable-detail", projectId, deliverableId],
    queryFn: async () => {
      const res = await projectsApi.deliverables.get(projectId, deliverableId);
      return {
        deliverable: res.data?.deliverable as DeliverableFull,
        project: res.data?.project as ProjectMeta,
        viewerRole: res.data?.viewerRole as "CLIENT" | "FREELANCER" | "ADMIN",
      };
    },
    enabled: Boolean(user && projectId && deliverableId),
    retry: false,
  });

  const deliverable = query.data?.deliverable;
  const project = query.data?.project;
  const viewerRole = query.data?.viewerRole;

  useEffect(() => {
    if (deliverable) {
      setEditNotes(deliverable.description || "");
      setEditFiles(deliverable.fileUrls || []);
    }
  }, [deliverable]);

  const commentMutation = useMutation({
    mutationFn: async () =>
      projectsApi.deliverables.comments.create(
        projectId,
        deliverableId,
        commentBody.trim(),
      ),
    onSuccess: async () => {
      setCommentBody("");
      await query.refetch();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: {
      status?: DeliverableFull["status"];
      description?: string;
      fileUrls?: string[];
      feedback?: string;
    }) => projectsApi.deliverables.update(projectId, deliverableId, payload),
    onSuccess: async () => {
      setActionError("");
      setShowRevisionBox(false);
      setRevisionNote("");
      await query.refetch();
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to update deliverable.";
      setActionError(detail);
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setActionError("");
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        const res = await projectsApi.uploadFile(projectId, file);
        if (res.data?.url) next.push(res.data.url);
      }
      setEditFiles((prev) => [...prev, ...next]);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Upload failed.";
      setActionError(detail);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleAddLink() {
    const clean = newLink.trim();
    if (!clean) return;
    if (!/^https?:\/\//i.test(clean)) {
      setActionError("Link URL must start with http:// or https://");
      return;
    }
    setActionError("");
    setEditFiles((prev) => [...prev, clean]);
    setNewLink("");
  }

  if (query.isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 p-6 lg:p-10">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-12 w-56 rounded-xl bg-white/5 animate-pulse motion-reduce:animate-none" />
          <div className="h-56 rounded-2xl bg-white/5 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (query.isError || !deliverable || !project || !viewerRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4 text-surface-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-900 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-danger-400" />
          <h1 className="mt-3 font-heading text-lg font-bold text-white">
            Deliverable unavailable
          </h1>
          <p className="mt-1.5 text-sm text-surface-400">
            You may not have access to this contract deliverable or it was removed.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const deadline = getDeadlineMeta(
    deliverable.dueDate,
    deliverable.status === "APPROVED",
  );
  const canFreelancerEdit =
    viewerRole === "FREELANCER" &&
    ["DRAFT", "REVISION_REQUESTED"].includes(deliverable.status);
  const canClientReview =
    viewerRole === "CLIENT" &&
    ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"].includes(deliverable.status);
  const revCapReached =
    typeof project.maxRevisions === "number" &&
    deliverable.revisionCount >= project.maxRevisions;

  return (
    <div className="min-h-screen bg-surface-100 text-surface-900">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-surface-950 text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 font-heading text-[11px] font-bold text-white">
              2G
            </span>
            <Link
              href={`/projects/${projectId}?tab=deliverables`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-surface-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Studio: {project.job.title}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tabular-nums text-primary-300">
              Room #{project.id}
            </span>
            <DeliverableStatusBadge status={deliverable.status} />
            {deadline.label && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${deadline.className}`}
              >
                {deadline.label}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        {actionError && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-xs font-medium text-danger-700">
            {actionError}
          </div>
        )}

        {/* Deliverable Summary & Action Card */}
        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-surface-900">
                {deliverable.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-500">
                {deliverable.milestone && (
                  <span className="rounded-md bg-surface-100 px-2.5 py-0.5 font-medium text-surface-700">
                    Milestone: {deliverable.milestone.title} (
                    {deliverable.milestone.amount} TOK)
                  </span>
                )}
                <span className="tabular-nums">
                  Revisions: {deliverable.revisionCount}
                  {project.maxRevisions !== null
                    ? ` / ${project.maxRevisions}`
                    : ""}
                </span>
                {deliverable.submittedAt && (
                  <span>
                    Submitted {formatRelativeTime(deliverable.submittedAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Client Review Actions */}
            {canClientReview && (
              <div className="flex flex-wrap items-center gap-2">
                {deliverable.status !== "IN_REVIEW" && (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({ status: "IN_REVIEW" })
                    }
                    className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    Mark in review
                  </button>
                )}

                {!revCapReached && (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => setShowRevisionBox((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Request revision</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ status: "APPROVED" })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-4 py-2 text-xs font-semibold text-white hover:bg-success-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500 active:scale-[0.98] motion-reduce:transform-none"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve deliverable</span>
                </button>
              </div>
            )}
          </div>

          {/* Client Revision Input */}
          {canClientReview && showRevisionBox && (
            <div className="mt-4 rounded-xl border border-danger-200 bg-danger-50/40 p-4">
              <label
                htmlFor="detail-revision-note"
                className="mb-1.5 block text-xs font-medium text-surface-700"
              >
                Describe required revisions
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="detail-revision-note"
                  type="text"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Be specific so the freelancer can resolve this in one iteration..."
                  className="min-w-[220px] flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
                <button
                  type="button"
                  disabled={!revisionNote.trim() || statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      status: "REVISION_REQUESTED",
                      feedback: revisionNote.trim(),
                    })
                  }
                  className="rounded-lg bg-danger-600 px-4 py-2 text-xs font-semibold text-white hover:bg-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 disabled:opacity-50"
                >
                  Send revision request
                </button>
              </div>
            </div>
          )}

          {/* Read-only view OR Freelancer Resubmit / Edit form */}
          {canFreelancerEdit ? (
            <div className="mt-5 space-y-4 border-t border-surface-100 pt-5">
              <div>
                <label
                  htmlFor="edit-deliverable-notes"
                  className="mb-1 block text-xs font-medium text-surface-600"
                >
                  Submission notes
                </label>
                <textarea
                  id="edit-deliverable-notes"
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-surface-600">
                  Attached files &amp; links ({editFiles.length})
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploading ? "Uploading..." : "Upload file"}</span>
                    <input
                      type="file"
                      multiple
                      disabled={uploading}
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://..."
                    aria-label="Add external link"
                    className="min-w-[200px] flex-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Add link</span>
                  </button>
                </div>

                {editFiles.length > 0 && (
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {editFiles.map((url, idx) => (
                      <li
                        key={`${url}-${idx}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs text-surface-700"
                      >
                        <Paperclip className="h-3 w-3 text-surface-400" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-[200px] truncate hover:underline"
                        >
                          {extractFileName(url)}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setEditFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          aria-label="Remove attachment"
                          className="text-surface-400 hover:text-danger-600"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={statusMutation.isPending || uploading}
                  onClick={() =>
                    statusMutation.mutate({
                      description: editNotes,
                      fileUrls: editFiles,
                    })
                  }
                  className="rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 disabled:opacity-50"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  disabled={statusMutation.isPending || uploading}
                  onClick={() =>
                    statusMutation.mutate({
                      description: editNotes,
                      fileUrls: editFiles,
                      status:
                        deliverable.status === "DRAFT"
                          ? "SUBMITTED"
                          : "RESUBMITTED",
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:opacity-50 motion-reduce:transform-none"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {deliverable.status === "DRAFT"
                      ? "Submit for review"
                      : "Resubmit updated work"}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4 border-t border-surface-100 pt-5">
              {deliverable.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-surface-700">
                  {deliverable.description}
                </p>
              ) : (
                <p className="text-sm text-surface-500">
                  No written submission notes provided.
                </p>
              )}

              {deliverable.fileUrls.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-surface-500">
                    Attached files &amp; links
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deliverable.fileUrls.map((url, idx) => (
                      <a
                        key={`${url}-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-surface-400" />
                        <span className="max-w-[240px] truncate">
                          {extractFileName(url)}
                        </span>
                        <ExternalLink className="h-3 w-3 text-surface-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Inline Review Comments Thread */}
        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary-600" />
            <h2 className="font-heading text-base font-semibold text-surface-900">
              Review discussion ({deliverable.comments.length})
            </h2>
          </div>

          {deliverable.comments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-surface-200 bg-surface-50 px-4 py-6 text-center text-xs text-surface-500">
              No inline comments yet. Use this thread for feedback specific to this deliverable.
            </p>
          ) : (
            <ul className="space-y-4">
              {deliverable.comments.map((c) => (
                <li
                  key={c.id}
                  className="flex gap-3 rounded-xl border border-surface-200 bg-surface-50/50 p-3.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-900 text-[11px] font-semibold text-white">
                    {getInitials(c.author.name, c.author.username)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-900">
                          {c.author.name || c.author.username}
                        </span>
                        <span className="rounded bg-surface-200/70 px-1.5 py-0.5 text-[10px] font-medium text-surface-700">
                          {c.author.role.toLowerCase()}
                        </span>
                      </div>
                      <span className="tabular-nums text-surface-400">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-surface-700">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {viewerRole !== "ADMIN" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentBody.trim()) return;
                commentMutation.mutate();
              }}
              className="mt-5 flex gap-2 border-t border-surface-100 pt-4"
            >
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a review comment on this deliverable..."
                aria-label="Deliverable review comment"
                className="min-w-0 flex-1 rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
              <button
                type="submit"
                disabled={commentMutation.isPending || !commentBody.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:opacity-50 motion-reduce:transform-none"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post comment</span>
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
