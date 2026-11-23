"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  Eye,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  GraduationCap,
  Briefcase,
  Users,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";

interface LeaderboardEntry {
  rank: number;
  freelancerId: number;
  name: string;
  title: string;
  category: "Working Professional" | "Student Pioneer";
  score: number;
  earnings: string;
  tasksCompleted: number;
  trustScore: number;
  badge: string;
}

const leaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    freelancerId: 2,
    name: "Aarav Sharma",
    title: "Principal Frontend & Distributed UI Architect",
    category: "Working Professional",
    score: 99,
    earnings: "₹12,40,000",
    tasksCompleted: 42,
    trustScore: 100,
    badge: "Platform MVP",
  },
  {
    rank: 2,
    freelancerId: 10,
    name: "Elena Rostova",
    title: "Senior Cross-Platform Mobile Engineer",
    category: "Working Professional",
    score: 98,
    earnings: "₹10,80,000",
    tasksCompleted: 38,
    trustScore: 100,
    badge: "Top Mobile Specialist",
  },
  {
    rank: 3,
    freelancerId: 4,
    name: "Nisha Verma",
    title: "Staff Cloud & DevOps Systems Architect",
    category: "Working Professional",
    score: 97,
    earnings: "₹9,50,000",
    tasksCompleted: 35,
    trustScore: 99,
    badge: "Cloud Innovator",
  },
  {
    rank: 4,
    freelancerId: 3,
    name: "Priya Swaminathan",
    title: "AI Research Scholar & Algorithmic Builder",
    category: "Student Pioneer",
    score: 96,
    earnings: "₹8,20,000",
    tasksCompleted: 32,
    trustScore: 100,
    badge: "Student MVP",
  },
  {
    rank: 5,
    freelancerId: 1,
    name: "Kunal Saini",
    title: "Senior Full-Stack & Next.js Architect",
    category: "Working Professional",
    score: 95,
    earnings: "₹7,80,000",
    tasksCompleted: 30,
    trustScore: 99,
    badge: "Proctoring Pioneer",
  },
  {
    rank: 6,
    freelancerId: 5,
    name: "Devansh Kapoor",
    title: "Competitive Programmer & Backend Researcher",
    category: "Student Pioneer",
    score: 94,
    earnings: "₹7,10,000",
    tasksCompleted: 28,
    trustScore: 98,
    badge: "Algorithms Master",
  },
  {
    rank: 7,
    freelancerId: 6,
    name: "Rohan Mehta",
    title: "Senior Data Architect & Machine Learning Engineer",
    category: "Working Professional",
    score: 93,
    earnings: "₹6,80,000",
    tasksCompleted: 26,
    trustScore: 98,
    badge: "ML Specialist",
  },
  {
    rank: 8,
    freelancerId: 7,
    name: "Sana Khan",
    title: "Lead Cybersecurity Specialist & Smart Contract Auditor",
    category: "Working Professional",
    score: 92,
    earnings: "₹6,40,000",
    tasksCompleted: 25,
    trustScore: 99,
    badge: "Security Lead",
  },
  {
    rank: 9,
    freelancerId: 9,
    name: "Aditya Nair",
    title: "Computer Science Scholar & Full-Stack Builder",
    category: "Student Pioneer",
    score: 91,
    earnings: "₹5,90,000",
    tasksCompleted: 23,
    trustScore: 99,
    badge: "Hackathon Winner",
  },
  {
    rank: 10,
    freelancerId: 8,
    name: "Ananya Deshmukh",
    title: "Senior UI/UX Designer & Design Systems Lead",
    category: "Working Professional",
    score: 90,
    earnings: "₹5,50,000",
    tasksCompleted: 22,
    trustScore: 98,
    badge: "Design Lead",
  },
  {
    rank: 11,
    freelancerId: 11,
    name: "Neha Sengupta",
    title: "Senior Data Scientist & Analytics Engineer",
    category: "Working Professional",
    score: 89,
    earnings: "₹5,10,000",
    tasksCompleted: 20,
    trustScore: 97,
    badge: "Analytics Pro",
  },
  {
    rank: 12,
    freelancerId: 12,
    name: "Rahul Joshi",
    title: "Junior Frontend Engineer & CS Student",
    category: "Student Pioneer",
    score: 88,
    earnings: "₹4,60,000",
    tasksCompleted: 18,
    trustScore: 98,
    badge: "Rising Talent",
  },
];

const rankConfig: Record<number, { icon: typeof Trophy; badge: string; ringColor: string }> = {
  1: {
    icon: Trophy,
    badge: "bg-amber-100 text-amber-900 border border-amber-300 shadow-sm",
    ringColor: "#d97706",
  },
  2: {
    icon: Medal,
    badge: "bg-slate-100 text-slate-800 border border-slate-300 shadow-sm",
    ringColor: "#64748b",
  },
  3: {
    icon: Award,
    badge: "bg-orange-100 text-orange-900 border border-orange-300 shadow-sm",
    ringColor: "#c2410c",
  },
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const filteredFreelancers = leaderboardData.filter((entry) => {
    if (filterCategory === "ALL") return true;
    if (filterCategory === "PROFESSIONAL") return entry.category === "Working Professional";
    if (filterCategory === "STUDENT") return entry.category === "Student Pioneer";
    return true;
  });

  return (
    <DashboardLayout
      title="Performance Leaderboard"
      subtitle="Recognizing top platform contributors based on proctored code assessments, verified milestone delivery, and trust integrity."
    >
      {/* Platform Trust & Milestone Metrics Banner */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-surface-200/80 bg-white p-4 shadow-card-sm">
          <div className="flex items-center gap-2 text-primary-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Total Rewards</span>
          </div>
          <p className="font-heading text-xl font-bold text-surface-900">₹89.6 Lakhs+</p>
          <p className="text-[11px] text-surface-500 mt-0.5">Distributed to top contributors</p>
        </div>

        <div className="rounded-2xl border border-surface-200/80 bg-white p-4 shadow-card-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Avg. Trust Score</span>
          </div>
          <p className="font-heading text-xl font-bold text-emerald-700">98.4%</p>
          <p className="text-[11px] text-surface-500 mt-0.5">Camera & violation verified</p>
        </div>

        <div className="rounded-2xl border border-surface-200/80 bg-white p-4 shadow-card-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Cleared Tasks</span>
          </div>
          <p className="font-heading text-xl font-bold text-surface-900">4,820+</p>
          <p className="text-[11px] text-surface-500 mt-0.5">Automated test suites passed</p>
        </div>

        <div className="rounded-2xl border border-surface-200/80 bg-white p-4 shadow-card-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Active Talent</span>
          </div>
          <p className="font-heading text-xl font-bold text-surface-900">1,240+</p>
          <p className="text-[11px] text-surface-500 mt-0.5">Engineers & students</p>
        </div>
      </div>

      <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm">
        {/* Header & Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-surface-100 pb-5">
          <div>
            <h2 className="font-heading text-xl font-bold text-surface-900">
              Verified Platform Standings
            </h2>
            <p className="mt-0.5 text-xs text-surface-500">
              Calculated dynamically over rolling 90-day verified delivery milestones and proctored tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/tasks"
              className="btn-secondary btn-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Take Assessment
            </Link>
            <button
              onClick={() => router.push("/jobs")}
              className="btn-primary btn-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98]"
            >
              Browse Jobs
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterCategory("ALL")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterCategory === "ALL"
                ? "bg-surface-900 text-white shadow-sm"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            All Performers ({leaderboardData.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("PROFESSIONAL")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterCategory === "PROFESSIONAL"
                ? "bg-purple-700 text-white shadow-sm"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            💼 Working Professionals ({leaderboardData.filter((d) => d.category === "Working Professional").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("STUDENT")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterCategory === "STUDENT"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            🎓 Student Pioneers ({leaderboardData.filter((d) => d.category === "Student Pioneer").length})
          </button>
        </div>

        {/* Leaderboard Cards */}
        <div className="space-y-3">
          {filteredFreelancers.map((freelancer, index) => {
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
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className={`group relative rounded-xl border p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-md motion-reduce:transform-none ${
                  isTopThree
                    ? "border-surface-200 bg-white shadow-card-sm"
                    : "border-surface-200/80 bg-surface-50/50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  {/* Rank badge */}
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold ${
                      config ? config.badge : "bg-surface-100 text-surface-700 border border-surface-200"
                    }`}
                  >
                    {freelancer.rank === 1 ? (
                      <Trophy className="h-5 w-5 text-amber-600" />
                    ) : freelancer.rank === 2 ? (
                      <Medal className="h-5 w-5 text-slate-600" />
                    ) : freelancer.rank === 3 ? (
                      <Award className="h-5 w-5 text-orange-600" />
                    ) : (
                      `#${freelancer.rank}`
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ${
                      freelancer.category === "Student Pioneer" ? "bg-emerald-600" : "bg-primary-700"
                    }`}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base font-bold text-surface-900">
                        {freelancer.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          freelancer.category === "Student Pioneer"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-purple-50 text-purple-800 border-purple-200"
                        }`}
                      >
                        {freelancer.category === "Student Pioneer" ? "🎓 Student" : "💼 Professional"}
                      </span>
                      {freelancer.badge && (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/80">
                          {freelancer.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">{freelancer.title}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-500">
                      <span className="inline-flex items-center gap-1 font-medium text-surface-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
                        {freelancer.tasksCompleted} proctored tasks
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {freelancer.trustScore}% Trust Score
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <p className="text-xs text-surface-500 font-medium">Quality Score</p>
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
                      onClick={() => router.push(`/freelancers/${freelancer.freelancerId}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-800 shadow-sm transition-colors duration-150 hover:bg-surface-50 hover:border-surface-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98]"
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
