"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  CheckCheck,
  User,
  Wallet,
  MessageSquare,
  LogOut,
  X,
} from "lucide-react";

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt?: string;
};

type FreelancerHeaderProps = {
  username: string;
  email?: string;
  walletBalance: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => Promise<void>;
  markAllPending: boolean;
  onOpenMobileNav: () => void;
  onLogout: () => void;
};

export function FreelancerHeader({
  username,
  email,
  walletBalance,
  searchQuery,
  onSearchChange,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  markAllPending,
  onOpenMobileNav,
  onLogout,
}: FreelancerHeaderProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  const initials = (username || "F").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-surface-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile drawer trigger + Search input */}
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-200 text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.98] disabled:opacity-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs and skills..."
            aria-label="Search jobs and skills"
            className="h-9 w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-8 text-sm text-surface-900 placeholder:text-surface-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-surface-400 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </form>
      </div>

      {/* Right: Notifications & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.98] disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold tabular-nums text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {notifOpen ? (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card-lg sm:w-96">
              <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
                <p className="text-xs font-semibold text-surface-900">
                  Notifications ({unreadCount})
                </p>
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  disabled={markAllPending || unreadCount === 0}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark read</span>
                </button>
              </div>
              <div className="max-h-72 divide-y divide-surface-100 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-surface-500">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={async () => {
                        if (!item.isRead) {
                          await onMarkRead(item.id);
                        }
                        setNotifOpen(false);
                        if (item.link) {
                          router.push(item.link);
                        }
                      }}
                      className={`block w-full px-4 py-3 text-left transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 disabled:opacity-50 ${
                        !item.isRead ? "bg-primary-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-surface-900">{item.title}</p>
                        {!item.isRead ? (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-surface-500">{item.body}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-surface-100 bg-surface-50 px-4 py-2.5 text-center">
                <Link
                  href="/support"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded"
                >
                  Open full inbox
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="max-w-[120px] truncate text-xs font-semibold leading-none text-surface-900">
                {username}
              </p>
              <p className="mt-0.5 text-[11px] leading-none text-surface-500">Freelancer</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
          </button>

          {profileOpen ? (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-surface-200 bg-white p-1.5 shadow-card-lg">
              <div className="border-b border-surface-100 px-3 py-2">
                <p className="truncate text-xs font-semibold text-surface-900">{username}</p>
                {email ? <p className="truncate text-[11px] text-surface-500">{email}</p> : null}
                <p className="mt-1 text-[11px] font-medium tabular-nums text-primary-700">
                  {walletBalance.toLocaleString()} TOK available
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/onboarding/freelancer?edit=1"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <User className="h-3.5 w-3.5 text-surface-400" />
                  <span>Edit profile</span>
                </Link>
                <Link
                  href="/wallet"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <Wallet className="h-3.5 w-3.5 text-surface-400" />
                  <span>Wallet</span>
                </Link>
                <Link
                  href="/support"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-surface-400" />
                  <span>Messages</span>
                </Link>
              </div>

              <div className="border-t border-surface-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-danger-600 transition-colors hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 active:scale-[0.99] disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
