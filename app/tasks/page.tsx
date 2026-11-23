"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Code2, Search, GraduationCap, Briefcase, Sparkles, X } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface TaskData {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
  rewardTokens: number;
  testCasesCount: number;
  targetAudience?: "STUDENT" | "PROFESSIONAL" | "ALL";
  badge?: string;
}

const difficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const categories = [
  "Basic Math",
  "Logic",
  "String Manipulation",
  "Array Operations",
  "Data Structures",
  "Algorithms",
  "System Design",
  "Security & Auth",
  "Data Processing",
  "Web Development",
];

const trackTabs = [
  { id: "", label: "All Challenges", icon: Sparkles, count: "14" },
  { id: "STUDENT", label: "🎓 Best for Students", icon: GraduationCap, count: "8", desc: "Core algorithms, data structures, and foundational coding interview problems designed for campus placements and hackathons." },
  { id: "PROFESSIONAL", label: "💼 Working Professionals", icon: Briefcase, count: "6", desc: "Production-grade system engineering: token-bucket rate limiters, LRU caches, JWT verification, and deep immutability diffing." },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchTasks();
  }, [difficulty, category, targetAudience]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty) params.append("difficulty", difficulty);
      if (category) params.append("category", category);
      if (targetAudience) params.append("targetAudience", targetAudience);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleDifficultyChange(value: string) {
    setDifficulty(value);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
  }

  function handleTrackChange(value: string) {
    setTargetAudience(value);
  }

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const activeTrack = trackTabs.find((t) => t.id === targetAudience);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06),_transparent_50%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-surface-900">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 md:pt-28">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-surface-200/60 bg-white/80 p-6 shadow-card-sm backdrop-blur-sm md:p-8"
        >
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-accent-500 via-primary-500 to-accent-400" />
          <div className="pl-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">2Gathers Assessments</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Proctored Coding Assessments
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-surface-500 md:text-base">
              Solve rigorous programming challenges under real-time camera proctoring. Earn verified tokens and prove your genuine engineering capability to premier clients.
            </p>
          </div>
        </motion.section>

        {/* Track Selector Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-surface-200/80 bg-white/70 p-2 shadow-card-sm backdrop-blur-sm">
            {trackTabs.map((tab) => {
              const isActive = targetAudience === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTrackChange(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                      : "text-surface-700 hover:bg-surface-100 hover:text-surface-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-surface-100 text-surface-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeTrack?.desc && (
            <div className="mt-2.5 px-3 py-2 rounded-xl bg-primary-50/70 border border-primary-100/80 text-xs text-primary-800 flex items-center gap-2">
              <span className="font-semibold">Track Focus:</span> {activeTrack.desc}
            </div>
          )}
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title, concept, or keyword..."
              className="w-full rounded-xl border border-surface-200 bg-white py-2 pl-9 pr-9 text-xs sm:text-sm text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Difficulty and Category filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-surface-600">
              <Filter className="h-3.5 w-3.5" />
              Difficulty:
            </div>

            {/* Difficulty pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleDifficultyChange("")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  difficulty === ""
                    ? "bg-surface-900 text-white shadow-sm"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                }`}
              >
                All Levels
              </button>
              {difficulties.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleDifficultyChange(level)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    difficulty === level
                      ? "bg-surface-900 text-white shadow-sm"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <span className="hidden h-5 w-px bg-surface-200 sm:inline-block" />

            {/* Category pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-surface-600 mr-1">Topic:</span>
              <button
                type="button"
                onClick={() => handleCategoryChange("")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  category === ""
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                }`}
              >
                All Topics
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    category === cat
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card h-48 rounded-2xl bg-surface-200/50 animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state rounded-2xl border border-dashed border-surface-200 bg-white/60 p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-surface-500">
              <Code2 className="h-6 w-6" />
            </div>
            <p className="font-heading text-base font-semibold text-surface-900">No tasks found</p>
            <p className="mt-1 text-xs text-surface-500">Try adjusting your track or filters to see more challenges.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
