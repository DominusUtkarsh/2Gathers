"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Star, Search, X, Sparkles, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

import { DashboardLayout } from "@/components/DashboardLayout";
import { freelancersApi } from "@/lib/api";

type FreelancerListItem = {
  id: number;
  username: string | null;
  name: string;
  tokens: number;
  freelancerProfile: {
    professionalTitle: string;
    skills: string;
    experienceLevel: string;
    hourlyRateUsd: number;
    country: string;
    city: string;
  } | null;
  _count: {
    proposals: number;
    receivedReviews: number;
  };
};

export default function FreelancersDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrack, setFilterTrack] = useState<"ALL" | "PROFESSIONAL" | "STUDENT">("ALL");

  const freelancersQuery = useQuery({
    queryKey: ["freelancers-directory"],
    queryFn: async () => {
      const response = await freelancersApi.list();
      return (response.data?.freelancers || []) as FreelancerListItem[];
    },
  });

  const rawFreelancers = freelancersQuery.data || [];

  const filteredFreelancers = rawFreelancers.filter((f) => {
    const profile = f.freelancerProfile;
    const isStudent =
      profile?.experienceLevel === "ENTRY_LEVEL" ||
      profile?.professionalTitle?.toLowerCase().includes("student") ||
      profile?.professionalTitle?.toLowerCase().includes("scholar");

    if (filterTrack === "STUDENT" && !isStudent) return false;
    if (filterTrack === "PROFESSIONAL" && isStudent) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (f.name || "").toLowerCase().includes(q);
    const userMatch = (f.username || "").toLowerCase().includes(q);
    const titleMatch = (profile?.professionalTitle || "").toLowerCase().includes(q);
    const skillsMatch = (profile?.skills || "").toLowerCase().includes(q);
    const cityMatch = (profile?.city || "").toLowerCase().includes(q);

    return nameMatch || userMatch || titleMatch || skillsMatch || cityMatch;
  });

  return (
    <DashboardLayout
      title="Talent Directory"
      subtitle="Discover verified freelance engineers, architects, and student scholars with demonstrated track records and proctoring trust scores."
    >
      {/* Search & Track Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search talent by name, role, skills, or city..."
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

          {/* Track Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTrack("ALL")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTrack === "ALL"
                  ? "bg-surface-900 text-white shadow-sm"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              All Talent ({rawFreelancers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTrack("PROFESSIONAL")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTrack === "PROFESSIONAL"
                  ? "bg-purple-700 text-white shadow-sm"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              <Briefcase className="h-3 w-3" />
              💼 Professionals
            </button>
            <button
              type="button"
              onClick={() => setFilterTrack("STUDENT")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTrack === "STUDENT"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <GraduationCap className="h-3 w-3" />
              🎓 Students
            </button>
          </div>
        </div>
      </div>

      {freelancersQuery.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl border border-surface-200 bg-white p-6 animate-pulse" />
          ))}
        </div>
      ) : filteredFreelancers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white p-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-surface-500">
            <Briefcase className="h-6 w-6" />
          </div>
          <p className="font-heading text-base font-semibold text-surface-900">No matching freelancers found</p>
          <p className="mt-1 text-xs text-surface-500">Try adjusting your search query or track filter.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredFreelancers.map((freelancer, index) => {
            const profile = freelancer.freelancerProfile;
            const initials = (freelancer.username || freelancer.name || "U")
              .slice(0, 2)
              .toUpperCase();

            const isStudent =
              profile?.experienceLevel === "ENTRY_LEVEL" ||
              profile?.professionalTitle?.toLowerCase().includes("student") ||
              profile?.professionalTitle?.toLowerCase().includes("scholar");

            return (
              <motion.article
                key={freelancer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm transition-[border-color,box-shadow,transform] duration-200 hover:border-surface-300 hover:shadow-card-md hover:-translate-y-0.5 motion-reduce:transform-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ${
                          isStudent ? "bg-emerald-600" : "bg-primary-700"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-heading text-lg font-bold text-surface-900">
                            {freelancer.name}
                          </h2>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${
                              isStudent
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-purple-50 text-purple-800 border-purple-200"
                            }`}
                          >
                            {isStudent ? "🎓 Student" : "💼 Pro"}
                          </span>
                        </div>
                        <p className="text-xs text-primary-700 font-medium">
                          {profile?.professionalTitle || "Independent Specialist"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      {freelancer.tokens} TOK
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-50 px-2.5 py-1 text-surface-600 ring-1 ring-surface-200/80">
                      <MapPin className="h-3 w-3 text-surface-400" />
                      {profile ? `${profile.city}, ${profile.country}` : "Location pending"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-50 px-2.5 py-1 text-surface-600 ring-1 ring-surface-200/80">
                      <Briefcase className="h-3 w-3 text-surface-400" />
                      {profile ? `$${profile.hourlyRateUsd}/hr` : "Custom quote"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-50 px-2.5 py-1 text-surface-600 ring-1 ring-surface-200/80">
                      <Star className="h-3 w-3 text-warning-500 fill-warning-500" />
                      {freelancer._count.receivedReviews} reviews
                    </span>
                  </div>

                  <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-surface-600">
                    {profile?.skills || "Skills will be detailed upon profile submission."}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-surface-100 pt-3.5">
                  <p className="text-xs text-surface-500">
                    {freelancer._count.proposals} proposals submitted
                  </p>
                  <Link
                    href={`/freelancers/${freelancer.id}`}
                    className="btn-primary btn-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98]"
                  >
                    View profile
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
