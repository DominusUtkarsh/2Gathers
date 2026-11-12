"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FolderKanban,
  Code2,
  MessageSquare,
  Wallet,
  Trophy,
  Bell,
  LifeBuoy,
  Bot,
  Settings,
  LogOut,
  X,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

export type FreelancerViewTab = "overview" | "proposals" | "projects" | "notifications" | "analytics";

type WorkspaceNavItem =
  | {
      key: string;
      label: string;
      icon: LucideIcon;
      type: "tab";
      tab: FreelancerViewTab;
      badge?: number;
    }
  | {
      key: string;
      label: string;
      icon: LucideIcon;
      type: "link";
      href: string;
      badge?: number;
    };

type FreelancerSidebarProps = {
  activeTab: FreelancerViewTab;
  onSelectTab: (tab: FreelancerViewTab) => void;
  unreadNotifications: number;
  unreadMessages: number;
  profilePercent: number;
  missingCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
};

export function FreelancerSidebar({
  activeTab,
  onSelectTab,
  unreadNotifications,
  unreadMessages,
  profilePercent,
  missingCount,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: FreelancerSidebarProps) {
  const pathname = usePathname();

  const workspaceItems: WorkspaceNavItem[] = [
    {
      key: "overview",
      label: "Dashboard",
      icon: LayoutDashboard,
      type: "tab" as const,
      tab: "overview" as const,
    },
    {
      key: "find-work",
      label: "Find Work",
      icon: Briefcase,
      type: "link" as const,
      href: "/freelancer/jobs",
    },
    {
      key: "proposals",
      label: "My Proposals",
      icon: FileText,
      type: "tab" as const,
      tab: "proposals" as const,
    },
    {
      key: "projects",
      label: "My Projects",
      icon: FolderKanban,
      type: "tab" as const,
      tab: "projects" as const,
    },
    {
      key: "tasks",
      label: "Tasks",
      icon: Code2,
      type: "link" as const,
      href: "/tasks",
    },
    {
      key: "messages",
      label: "Messages",
      icon: MessageSquare,
      type: "link" as const,
      href: "/support",
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      key: "wallet",
      label: "Wallet",
      icon: Wallet,
      type: "link" as const,
      href: "/wallet",
    },
    {
      key: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      type: "link" as const,
      href: "/leaderboard",
    },
  ];

  const accountItems = [
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      type: "tab" as const,
      tab: "notifications" as const,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      key: "support",
      label: "Support",
      icon: LifeBuoy,
      type: "link" as const,
      href: "/support",
    },
    {
      key: "chatbot",
      label: "AI Assistant",
      icon: Bot,
      type: "link" as const,
      href: "/chatbot",
    },
    {
      key: "settings",
      label: "Profile Settings",
      icon: Settings,
      type: "link" as const,
      href: "/onboarding/freelancer?edit=1",
    },
  ];

  const navContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-heading text-xs font-extrabold text-white">
            2G
          </div>
          <span className="font-heading text-base font-bold tracking-tight text-surface-900">
            2Gathers
          </span>
        </Link>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.98] disabled:opacity-50 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable navigation links */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <nav aria-label="Workspace navigation" className="space-y-0.5">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.type === "tab"
                ? pathname === "/dashboard" && activeTab === item.tab
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            const baseClass = `group flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] motion-reduce:transform-none ${
              isActive
                ? "bg-primary-50 text-primary-700 font-semibold"
                : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
            }`;

            if (item.type === "tab") {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.tab);
                    onCloseMobile();
                  }}
                  className={`${baseClass} disabled:opacity-50`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-primary-600" : "text-surface-400 group-hover:text-surface-600"
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onCloseMobile}
                className={baseClass}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-primary-600" : "text-surface-400 group-hover:text-surface-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.badge ? (
                  <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none text-primary-700">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-200 pt-4">
          <nav aria-label="Support and account" className="space-y-0.5">
            {accountItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.type === "tab"
                  ? pathname === "/dashboard" && activeTab === item.tab
                  : pathname === item.href;

              const baseClass = `group flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] motion-reduce:transform-none ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
              }`;

              if (item.type === "tab") {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.tab);
                      onCloseMobile();
                    }}
                    className={`${baseClass} disabled:opacity-50`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-primary-600" : "text-surface-400 group-hover:text-surface-600"
                        }`}
                      />
                      <span>{item.label}</span>
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-danger-600 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={baseClass}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-primary-600" : "text-surface-400 group-hover:text-surface-600"
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={onLogout}
              className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-surface-600 transition-colors duration-150 hover:bg-danger-50 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 active:scale-[0.99] disabled:opacity-50 motion-reduce:transform-none"
            >
              <LogOut className="h-4 w-4 shrink-0 text-surface-400 group-hover:text-danger-600" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Profile Strength / Career Growth card */}
      <div className="border-t border-surface-200 p-3.5">
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-surface-900">Profile strength</span>
            <span className="font-semibold tabular-nums text-primary-700">{profilePercent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
            <div
              className="h-full rounded-full bg-primary-600"
              style={{ width: `${profilePercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-surface-500">
            {missingCount > 0
              ? `${missingCount} detail${missingCount === 1 ? "" : "s"} left to boost client trust.`
              : "Your profile is complete and discoverable."}
          </p>
          <Link
            href="/onboarding/freelancer?edit=1"
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
          >
            <span>{missingCount > 0 ? "Finish setup" : "Update profile"}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-surface-200 bg-white lg:block">
        {navContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-surface-950/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-surface-200 bg-white shadow-card-lg">
            {navContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}
