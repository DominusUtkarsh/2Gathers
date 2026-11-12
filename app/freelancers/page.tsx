"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Star, UserCheck } from "lucide-react";
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
  const freelancersQuery = useQuery({
    queryKey: ["freelancers-directory"],
    queryFn: async () => {
      const response = await freelancersApi.list();
      return (response.data?.freelancers || []) as FreelancerListItem[];
    },
  });

  return (
    <DashboardLayout
      title="Talent Directory"
      subtitle="Discover verified freelance professionals with demonstrated track records, skills, and client review histories."
    >
      {freelancersQuery.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl border border-surface-200 bg-white p-6 animate-pulse" />
          ))}
        </div>
      ) : (freelancersQuery.data || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white p-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-surface-500">
            <Briefcase className="h-6 w-6" />
          </div>
          <p className="font-heading text-base font-semibold text-surface-900">No freelancer profiles yet</p>
          <p className="mt-1 text-xs text-surface-500">Profiles will appear here once onboarding is completed.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {(freelancersQuery.data || []).map((freelancer, index) => {
            const profile = freelancer.freelancerProfile;
            const initials = (freelancer.username || freelancer.name || "U")
              .slice(0, 2)
              .toUpperCase();

            return (
              <motion.article
                key={freelancer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm transition-[border-color,box-shadow,transform] duration-200 hover:border-surface-300 hover:shadow-card-md hover:-translate-y-0.5 motion-reduce:transform-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-700 text-xs font-bold text-white shadow-sm">
                        {initials}
                      </div>
                      <div>
                        <h2 className="font-heading text-lg font-bold text-surface-900">
                          {freelancer.username || freelancer.name}
                        </h2>
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
