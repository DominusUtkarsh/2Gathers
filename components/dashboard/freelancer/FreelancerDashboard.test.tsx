import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FreelancerDashboard } from "./FreelancerDashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "7",
      username: "aarav",
      email: "aarav@example.com",
      role: "FREELANCER",
      tokens: 42,
      walletAddress: null,
      hasFreelancerProfile: true,
      hasClientProfile: false,
    },
    token: "test-token",
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  authApi: {
    dashboard: vi.fn().mockResolvedValue({ data: { walletBalance: 42 } }),
  },
  freelancerProfileApi: {
    me: vi.fn().mockResolvedValue({
      data: {
        profile: {
          professionalTitle: "Full-Stack TypeScript Engineer",
          bio: "Building production SaaS and Next.js platforms.",
          skills: "TypeScript, React, Next.js",
          experienceLevel: "EXPERT",
          hourlyRateUsd: 65,
          country: "India",
          city: "Bengaluru",
          languages: "English, Hindi",
          portfolioUrl: "https://example.com/portfolio",
          githubUrl: "",
          linkedinUrl: "",
          education: "B.Tech CS",
          certifications: "",
          availability: "FULL_TIME",
          preferredWorkingHours: "09:00-18:00 IST",
          responseTime: "WITHIN_HOUR",
        },
      },
    }),
  },
  proposalsApi: {
    inbox: vi.fn().mockResolvedValue({
      data: {
        proposals: [
          {
            id: 101,
            status: "ACCEPTED",
            coverLetter: "Ready to ship your Next.js marketplace.",
            createdAt: "2026-11-10T10:00:00.000Z",
            updatedAt: "2026-11-11T10:00:00.000Z",
            job: {
              id: 501,
              title: "Client Billing Portal",
              description: "Build Stripe invoicing workflows.",
              budget: 45000,
              status: "IN_PROGRESS",
              createdAt: "2026-11-08T10:00:00.000Z",
              client: { id: 12, username: "acmecorp", name: "Acme Corp" },
            },
            freelancer: {
              id: 7,
              username: "aarav",
              name: "Aarav",
              email: "aarav@example.com",
            },
          },
          {
            id: 102,
            status: "SUBMITTED",
            coverLetter: "Happy to help with TypeScript APIs.",
            createdAt: "2026-11-11T08:00:00.000Z",
            job: {
              id: 502,
              title: "Design System Audit",
              description: "Review React accessibility.",
              budget: 18000,
              status: "OPEN",
              createdAt: "2026-11-09T09:00:00.000Z",
              client: { id: 13, username: "nordicstudio", name: "Nordic Studio" },
            },
            freelancer: {
              id: 7,
              username: "aarav",
              name: "Aarav",
              email: "aarav@example.com",
            },
          },
        ],
      },
    }),
  },
  jobsApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        jobs: [
          {
            id: 601,
            title: "Next.js Analytics Dashboard",
            description: "Need React and TypeScript engineer for live metrics.",
            budget: 52000,
            applicationTokenCost: 2,
            status: "OPEN",
            createdAt: "2026-11-12T07:00:00.000Z",
            client: { id: 19, username: "veridian", name: "Veridian Labs" },
            _count: { proposals: 3 },
          },
        ],
      },
    }),
  },
  savedJobsApi: {
    list: vi.fn().mockResolvedValue({ data: { saved: [] } }),
    toggle: vi.fn().mockResolvedValue({ data: { saved: true } }),
  },
  notificationsApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        unreadCount: 2,
        notifications: [
          {
            id: 1,
            title: "Proposal accepted",
            body: "Acme Corp accepted your proposal.",
            link: "/jobs/501",
            isRead: false,
            createdAt: "2026-11-11T10:00:00.000Z",
          },
        ],
      },
    }),
    markAllRead: vi.fn().mockResolvedValue({}),
    markRead: vi.fn().mockResolvedValue({}),
  },
  messagesApi: {
    listByProposal: vi.fn().mockImplementation(async (proposalId: number) => ({
      data: {
        messages:
          proposalId === 101
            ? [
                {
                  id: 901,
                  body: "Can you share milestone 1 ETA?",
                  createdAt: "2026-11-12T06:00:00.000Z",
                  sender: { username: "acmecorp", name: "Acme Corp" },
                },
              ]
            : [],
      },
    })),
  },
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <FreelancerDashboard />
    </QueryClientProvider>
  );
}

describe("FreelancerDashboard", () => {
  it("renders real greeting, overview metrics, recommended jobs, active projects table, and right sidebar", async () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: /good (morning|afternoon|evening), aarav/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/here's your freelance workspace at a glance/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/available · full-time/i)).toBeInTheDocument();
      expect(screen.getByText("Next.js Analytics Dashboard")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Client Billing Portal" })).toBeInTheDocument();
      expect(screen.getByText("Can you share milestone 1 ETA?")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Active Projects" })).toBeInTheDocument();
    expect(screen.getByText("Proposals Sent")).toBeInTheDocument();
    expect(screen.getByText("Unread Messages")).toBeInTheDocument();
    expect(screen.getByText("Wallet Balance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /profile completeness/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /to-do/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recent messages/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /help & assistance/i })).toBeInTheDocument();
  });
});
