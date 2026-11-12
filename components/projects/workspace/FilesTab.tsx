"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  ExternalLink,
  FileCode2,
  FileImage,
  FileText,
  FolderOpen,
  Link2,
} from "lucide-react";

import { projectsApi } from "@/lib/api";
import {
  extractFileName,
  formatRelativeTime,
  type ProjectDetail,
  type ProjectMessageItem,
} from "./types";

type UnifiedFileEntry = {
  id: string;
  name: string;
  url: string;
  sourceLabel: string;
  uploadedBy: string;
  createdAt: string;
};

function getFileIcon(nameOrUrl: string) {
  const lower = nameOrUrl.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return FileImage;
  if (/\.(ts|tsx|js|jsx|json|py|sql|zip|tar)$/.test(lower)) return FileCode2;
  if (/^https?:\/\//.test(lower) && !/\.[a-z0-9]{2,5}$/i.test(lower)) {
    return Link2;
  }
  return FileText;
}

export function FilesTab({ project }: { project: ProjectDetail }) {
  const messagesQuery = useQuery({
    queryKey: ["project-messages", project.id],
    queryFn: async () => {
      const res = await projectsApi.messages.list(project.id);
      return (res.data?.messages || []) as ProjectMessageItem[];
    },
  });

  const files = useMemo<UnifiedFileEntry[]>(() => {
    const entries: UnifiedFileEntry[] = [];

    for (const deliv of project.deliverables) {
      deliv.fileUrls.forEach((url, index) => {
        entries.push({
          id: `deliv-${deliv.id}-${index}`,
          name: extractFileName(url),
          url,
          sourceLabel: `Deliverable: ${deliv.title}`,
          uploadedBy:
            project.freelancer.name ||
            project.freelancer.username ||
            "Freelancer",
          createdAt: deliv.submittedAt || deliv.createdAt,
        });
      });
    }

    for (const msg of messagesQuery.data || []) {
      if (msg.fileUrl) {
        entries.push({
          id: `msg-${msg.id}`,
          name: msg.fileName || extractFileName(msg.fileUrl),
          url: msg.fileUrl,
          sourceLabel: "Contract chat",
          uploadedBy: msg.sender.name || msg.sender.username || "Member",
          createdAt: msg.createdAt,
        });
      }
    }

    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [messagesQuery.data, project]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-base font-semibold text-surface-900">
          Project files &amp; links
        </h2>
        <p className="text-xs text-surface-500">
          Every file and external artifact shared across deliverables and contract chat.
        </p>
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-surface-300" />
          <p className="mt-2 font-heading text-sm font-semibold text-surface-900">
            No files shared yet
          </p>
          <p className="mt-1 text-xs text-surface-500">
            Upload attachments inside a Deliverable or in Contract Chat and they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-200 bg-surface-50 text-xs text-surface-500">
                <tr>
                  <th className="px-4 py-3 font-medium">File / Link</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Shared by</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {files.map((item) => {
                  const Icon = getFileIcon(item.url);
                  const isInternalUpload = item.url.startsWith("/uploads/");
                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-surface-50/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0 text-primary-600" />
                          <span className="max-w-[260px] truncate font-medium text-surface-900">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-600">
                        {item.sourceLabel}
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-700">
                        {item.uploadedBy}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-surface-500">
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          download={isInternalUpload ? item.name : undefined}
                          className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1 text-xs font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          {isInternalUpload ? (
                            <Download className="h-3.5 w-3.5" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )}
                          <span>{isInternalUpload ? "Download" : "Open"}</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
