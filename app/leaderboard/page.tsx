"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Eye } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";

const topFreelancers = [
  { rank: 1, name: "Aarav Sharma", category: "Frontend", score: 98, earnings: "₹9,20,000" },
  { rank: 2, name: "Nisha Verma", category: "Full Stack", score: 95, earnings: "₹8,40,000" },
  { rank: 3, name: "Rohan Mehta", category: "UI/UX", score: 93, earnings: "₹7,75,000" },
  { rank: 4, name: "Sana Khan", category: "AI/Data", score: 91, earnings: "₹7,10,000" },
  { rank: 5, name: "Vikram Patel", category: "Blockchain", score: 89, earnings: "₹6,85,000" },
];

const rankConfig: Record<number, { icon: typeof Trophy; badge: string; ringColor: string }> = {
  1: {
    icon: Trophy,
    badge: "bg-warning-50 text-warning-800 border border-warning-200",
    ringColor: "#d97706",
  },
  2: {
    icon: Medal,
    badge: "bg-surface-100 text-surface-800 border border-surface-200",
    ringColor: "#64748b",
  },
  3: {
    icon: Award,
    badge: "bg-amber-50 text-amber-800 border border-amber-200",
    ringColor: "#b45309",
  },
};

export default function LeaderboardPage() {
  const router = useRouter();

  return (
    <DashboardLayout
      title="Performance Leaderboard"
      subtitle="Recognizing top platform contributors based on project completion, client ratings, and overall milestone consistency."
    >
      <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 pb-5">
          <div>
            <h2 className="font-heading text-xl font-bold text-surface-900">
              Verified top performers
            </h2>
            <p className="mt-0.5 text-xs text-surface-500">Calculated over rolling 90-day verified delivery milestones.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/start"
              className="btn-secondary btn-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Back to Start
            </Link>
            <button
              onClick={() => router.push("/jobs")}
              className="btn-primary btn-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              Browse Jobs
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {topFreelancers.map((freelancer, index) => {
            const config = rankConfig[freelancer.rank];
            const isTopThree = freelancer.rank <= 3;
            const initials = freelancer.name
              .split(" ")
              .map((p) => p[0])
              .join("");

            return (
              <motion.article
                key={freelancer.rank}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className={`group relative rounded-xl border p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-md motion-reduce:transform-none ${
                  isTopThree
                    ? "border-surface-200 bg-white shadow-card-sm"
                    : "border-surface-200/80 bg-surface-50/50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  {/* Rank badge */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold ${
                      config ? config.badge : "bg-surface-100 text-surface-700 border border-surface-200"
                    }`}
                  >
                    #{freelancer.rank}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-700 text-xs font-bold text-white shadow-sm">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-base font-bold text-surface-900">
                      {freelancer.name}
                    </h3>
                    <p className="text-xs text-surface-500">{freelancer.category}</p>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <p className="text-xs text-surface-500 font-medium">Quality score</p>
                    <div className="relative mt-1">
                      {/* Progress ring */}
                      <div className="mx-auto h-12 w-12">
                        <svg
                          viewBox="0 0 36 36"
                          className="h-12 w-12 -rotate-90"
                          aria-hidden="true"
                          role="img"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke={freelancer.score >= 95 ? "#059669" : freelancer.score >= 90 ? "#4338ca" : "#d97706"}
                            strokeWidth="3"
                            strokeDasharray={`${(freelancer.score / 100) * 97.4} 97.4`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-heading text-xs font-bold text-surface-900">
                          {freelancer.score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Earnings & CTA */}
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-heading text-base font-bold text-success-700">
                      {freelancer.earnings}
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/freelancers")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-800 shadow-sm transition-colors duration-150 hover:bg-surface-50 hover:border-surface-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Eye className="h-3.5 w-3.5 text-surface-500" />
                      View profile
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </DashboardLayout>
  );
}
