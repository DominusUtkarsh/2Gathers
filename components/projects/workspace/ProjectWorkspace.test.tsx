import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectSidebar } from "./ProjectSidebar";
import { ProjectHeader } from "./ProjectHeader";
import { DeliverablesTab } from "./DeliverablesTab";
import type { ProjectDetail, ProjectListItem } from "./types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  projectsApi: {
    deliverables: {
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    uploadFile: vi.fn(),
  },
}));

const sampleProject: ProjectDetail = {
  id: 14,
  jobId: 90,
  proposalId: 210,
  clientId: 3,
  freelancerId: 7,
  status: "ACTIVE",
  maxRevisions: 3,
  startedAt: "2026-11-01T10:00:00.000Z",
  completedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-12T10:00:00.000Z",
  job: {
    id: 90,
    title: "Next.js Fintech Billing Engine",
    description: "Build recurring invoice flows and webhook synchronization.",
    budget: 85000,
    status: "IN_PROGRESS",
    completedAt: null,
  },
  client: {
    id: 3,
    name: "Sarah Rodriguez",
    username: "sarah_studio",
    clientProfile: {
      displayName: "Studio North",
      companyName: "Studio North",
      timezone: "UTC",
    },
  },
  freelancer: {
    id: 7,
    name: "Aarav Sharma",
    username: "aarav",
    freelancerProfile: {
      professionalTitle: "Full-Stack Engineer",
    },
  },
  milestones: [
    {
      id: 1,
      projectId: 14,
      title: "API Schema & Auth",
      description: "Deliver database models and token auth.",
      amount: 500,
      dueDate: "2026-12-01T00:00:00.000Z",
      status: "IN_PROGRESS",
      escrowStatus: "FUNDED",
      releasedAt: null,
      createdAt: "2026-11-01T12:00:00.000Z",
      deliverables: [{ id: 11, title: "Auth endpoints PR", status: "SUBMITTED", dueDate: null }],
    },
  ],
  deliverables: [
    {
      id: 11,
      projectId: 14,
      milestoneId: 1,
      title: "Auth endpoints PR",
      description: "JWT + refresh route handlers implemented.",
      status: "SUBMITTED",
      revisionCount: 0,
      fileUrls: ["https://github.com/org/repo/pull/12"],
      submittedAt: "2026-11-11T14:00:00.000Z",
      approvedAt: null,
      dueDate: null,
      createdAt: "2026-11-11T14:00:00.000Z",
      updatedAt: "2026-11-11T14:00:00.000Z",
      milestone: { id: 1, title: "API Schema & Auth", status: "IN_PROGRESS" },
      _count: { comments: 1 },
    },
  ],
  activityLogs: [],
  reviews: [],
  escrowTransactions: [],
  escrowSummary: {
    totalMilestoneAmount: 500,
    fundedTokens: 500,
    releasedTokens: 0,
  },
};

const clientProjectsList: ProjectListItem[] = [
  {
    id: 14,
    jobId: 90,
    status: "ACTIVE",
    startedAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
    job: { id: 90, title: "Next.js Fintech Billing Engine", budget: 85000, status: "IN_PROGRESS" },
    client: sampleProject.client,
    freelancer: sampleProject.freelancer,
    milestones: [],
    deliverables: [],
    activityLogs: [],
    _count: { deliverables: 1, milestones: 1, projectMessages: 2 },
  },
  {
    id: 18,
    jobId: 95,
    status: "ACTIVE",
    startedAt: "2026-11-05T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
    job: { id: 95, title: "Design System Audit", budget: 30000, status: "IN_PROGRESS" },
    client: sampleProject.client,
    freelancer: sampleProject.freelancer,
    milestones: [],
    deliverables: [],
    activityLogs: [],
    _count: { deliverables: 0, milestones: 0, projectMessages: 0 },
  },
];

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Project Workspace Role Isolation & Controls", () => {
  it("hides project switcher and approval controls from freelancers", () => {
    renderWithQuery(
      <div>
        <ProjectSidebar
          project={sampleProject}
          viewerRole="FREELANCER"
          activeTab="deliverables"
          onSelectTab={vi.fn()}
          clientProjects={clientProjectsList}
          filesCount={1}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
        />
        <ProjectHeader
          project={sampleProject}
          viewerRole="FREELANCER"
          activeTab="deliverables"
          onSelectTab={vi.fn()}
          onOpenMobileMenu={vi.fn()}
          onOpenSubmitDeliverable={vi.fn()}
          onCompleteProject={vi.fn()}
          completingProject={false}
        />
        <DeliverablesTab
          project={sampleProject}
          viewerRole="FREELANCER"
          showCreateForm={false}
          onToggleCreateForm={vi.fn()}
          onRefresh={vi.fn().mockResolvedValue(undefined)}
        />
      </div>,
    );

    // Freelancer must NOT see a project switcher
    expect(screen.queryByLabelText("Active contract")).toBeNull();
    expect(screen.queryByText("Design System Audit")).toBeNull();

    // Freelancer sees Submit deliverable CTA, NOT client Approve/Request revision buttons
    expect(screen.getByRole("button", { name: /submit deliverable/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^approve$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /request revision/i })).toBeNull();
  });

  it("shows project switcher and review actions for clients", () => {
    const onSelectTab = vi.fn();
    renderWithQuery(
      <div>
        <ProjectSidebar
          project={sampleProject}
          viewerRole="CLIENT"
          activeTab="deliverables"
          onSelectTab={onSelectTab}
          clientProjects={clientProjectsList}
          filesCount={1}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
        />
        <ProjectHeader
          project={sampleProject}
          viewerRole="CLIENT"
          activeTab="deliverables"
          onSelectTab={onSelectTab}
          onOpenMobileMenu={vi.fn()}
          onOpenSubmitDeliverable={vi.fn()}
          onCompleteProject={vi.fn()}
          completingProject={false}
        />
        <DeliverablesTab
          project={sampleProject}
          viewerRole="CLIENT"
          showCreateForm={false}
          onToggleCreateForm={vi.fn()}
          onRefresh={vi.fn().mockResolvedValue(undefined)}
        />
      </div>,
    );

    // Client sees the project switcher dropdown containing both projects
    const switcher = screen.getByLabelText("Active contract") as HTMLSelectElement;
    expect(switcher).toBeTruthy();
    expect(switcher.options.length).toBe(2);

    // Client sees Review deliverable, Approve, Request revision, and NOT Submit deliverable
    expect(screen.getByRole("button", { name: /review deliverable/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^approve$/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /submit deliverable/i })).toBeNull();

    // Clicking Request revision reveals inline feedback box
    fireEvent.click(screen.getByRole("button", { name: /request revision/i }));
    expect(
      screen.getByLabelText(/specify requested changes for the freelancer/i),
    ).toBeTruthy();
  });
});
