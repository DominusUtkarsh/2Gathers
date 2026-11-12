"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AtSign,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from "lucide-react";

import { projectsApi } from "@/lib/api";
import {
  formatRelativeTime,
  getDisplayName,
  getInitials,
  type ProjectDetail,
  type ProjectMessageItem,
} from "./types";

type MessagesTabProps = {
  project: ProjectDetail;
  currentUserId: number;
  viewerRole: "CLIENT" | "FREELANCER" | "ADMIN";
};

export function MessagesTab({
  project,
  currentUserId,
  viewerRole,
}: MessagesTabProps) {
  const [body, setBody] = useState("");
  const [attachedFile, setAttachedFile] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messagesQuery = useQuery({
    queryKey: ["project-messages", project.id],
    queryFn: async () => {
      const res = await projectsApi.messages.list(project.id);
      return (res.data?.messages || []) as ProjectMessageItem[];
    },
    refetchInterval: 3000,
  });

  const messages = messagesQuery.data || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      return projectsApi.messages.send(project.id, {
        body: body.trim(),
        fileUrl: attachedFile?.url || null,
        fileName: attachedFile?.fileName || null,
      });
    },
    onSuccess: async () => {
      setBody("");
      setAttachedFile(null);
      setErrorMsg("");
      await messagesQuery.refetch();
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to send message.";
      setErrorMsg(detail);
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    setUploading(true);
    try {
      const res = await projectsApi.uploadFile(project.id, file);
      if (res.data?.url) {
        setAttachedFile({
          url: res.data.url,
          fileName: res.data.fileName || file.name,
        });
      }
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "File upload failed.";
      setErrorMsg(detail);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleMentionPartner() {
    const partner =
      viewerRole === "FREELANCER" ? project.client : project.freelancer;
    const handle = partner.username || getDisplayName(partner).replace(/\s+/g, "");
    setBody((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}@${handle} `);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !attachedFile) return;
    if (!body.trim() && attachedFile) {
      setBody(`Shared file: ${attachedFile.fileName}`);
      return;
    }
    sendMutation.mutate();
  }

  const partnerName =
    viewerRole === "FREELANCER"
      ? getDisplayName(project.client)
      : getDisplayName(project.freelancer);

  return (
    <div className="flex h-[620px] flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-sm">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-primary-600" />
          <div>
            <h2 className="font-heading text-sm font-semibold text-surface-900">
              Contract chat with {partnerName}
            </h2>
            <p className="text-xs text-surface-500">
              Messages and shared files stay scoped to this contract
            </p>
          </div>
        </div>
        <span className="rounded-full border border-surface-200 bg-surface-50 px-2.5 py-0.5 text-[11px] font-medium text-surface-600">
          Syncs every 3s
        </span>
      </div>

      {/* Messages feed */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-surface-50/50 p-5">
        {messagesQuery.isLoading ? (
          <div className="space-y-3">
            <div className="h-14 w-2/3 rounded-xl bg-surface-100 animate-pulse motion-reduce:animate-none" />
            <div className="ml-auto h-14 w-1/2 rounded-xl bg-primary-50 animate-pulse motion-reduce:animate-none" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-8 w-8 text-surface-300" />
            <p className="mt-2 font-heading text-sm font-semibold text-surface-900">
              Start the contract conversation
            </p>
            <p className="mt-1 max-w-sm text-xs text-surface-500">
              Share kickoff expectations, links, or quick clarifications here. Deliverable-specific reviews live in Deliverables.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isMine
                      ? "bg-primary-600 text-white"
                      : "bg-surface-900 text-white"
                  }`}
                >
                  {getInitials(msg.sender.name, msg.sender.username)}
                </span>

                <div
                  className={`max-w-[75%] space-y-1 ${
                    isMine ? "items-end text-right" : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-[11px] text-surface-500 ${
                      isMine ? "justify-end" : ""
                    }`}
                  >
                    <span className="font-semibold text-surface-700">
                      {msg.sender.name || msg.sender.username}
                    </span>
                    <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-600">
                      {msg.sender.role.toLowerCase()}
                    </span>
                    <span className="tabular-nums">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed ${
                      isMine
                        ? "bg-primary-600 text-white"
                        : "border border-surface-200 bg-white text-surface-800 shadow-card-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    {msg.fileUrl && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          isMine
                            ? "border-primary-400 bg-primary-700/60 text-white hover:bg-primary-700"
                            : "border-surface-200 bg-surface-50 text-surface-700 hover:bg-surface-100"
                        }`}
                      >
                        <Paperclip className="h-3 w-3 shrink-0" />
                        <span className="max-w-[200px] truncate">
                          {msg.fileName || "Attachment"}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {viewerRole !== "ADMIN" && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-surface-200 bg-white p-4"
        >
          {attachedFile && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="max-w-[240px] truncate">
                {attachedFile.fileName}
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                aria-label="Remove attached file"
                className="hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {errorMsg && (
            <p className="mb-2 text-xs font-medium text-danger-600">
              {errorMsg}
            </p>
          )}

          <div className="flex items-end gap-2">
            <label
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-surface-200 bg-surface-50 px-3 text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 focus-within:ring-2 focus-within:ring-primary-500"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Attach file</span>
              <input
                type="file"
                disabled={uploading}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleMentionPartner}
              title="Mention partner"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-50 px-3 text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <AtSign className="h-4 w-4" />
              <span className="sr-only">Mention partner</span>
            </button>

            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                uploading ? "Uploading attachment..." : `Message ${partnerName}...`
              }
              aria-label="Project message"
              className="h-10 min-w-0 flex-1 rounded-lg border border-surface-200 bg-white px-3.5 text-sm text-surface-900 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />

            <button
              type="submit"
              disabled={
                sendMutation.isPending ||
                uploading ||
                (!body.trim() && !attachedFile)
              }
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
