"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Search, DollarSign, Users, ChevronRight, Briefcase } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { jobsApi, savedJobsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { TOKEN_PRICE_INR } from "@/lib/tokenomics";

type JobItem = {
  id: number;
  title: string;
  description: string;
  budget: number;
  applicationTokenCost?: number;
  clientId: number;
  createdAt: string;
  client: {
    id: number;
    username: string | null;
    name: string;
  };
  _count?: {
    proposals: number;
  };
};

export default function JobsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("500");
  const [status, setStatus] = useState("");

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await jobsApi.list();
      return (response.data?.jobs || []) as JobItem[];
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async () => {
      await jobsApi.create({
        title,
        description,
        budget: Number(budget),
      });
    },
    onSuccess: async () => {
      setStatus("Job posted successfully");
      setTitle("");
      setDescription("");
      setBudget("500");
      await jobsQuery.refetch();
    },
    onError: (err: any) => setStatus(err?.response?.data?.detail || "Unable to post job"),
  });

  const jobs = jobsQuery.data || [];

  const savedJobsQuery = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: async () => {
      const response = await savedJobsApi.list();
      const saved = (response.data?.saved || []) as Array<{ jobId: number }>;
      return new Set(saved.map((item) => item.jobId));
    },
    enabled: Boolean(user),
  });

  const toggleSaveJobMutation = useMutation({
    mutationFn: async (jobId: number) => savedJobsApi.toggle(jobId),
    onSuccess: async (response: any) => {
      const isSaved = Boolean(response?.data?.saved);
      setStatus(isSaved ? "Job saved" : "Job removed from saved list");
      await savedJobsQuery.refetch();
    },
    onError: (err: any) => setStatus(err?.response?.data?.detail || "Unable to save this job"),
  });

  function createJob() {
    if (title.trim().length < 3) {
      setStatus("Title must be at least 3 characters");
      return;
    }

    if (description.trim().length < 10) {
      setStatus("Description must be at least 10 characters");
      return;
    }

    const budgetValue = Number(budget);
    if (!Number.isInteger(budgetValue) || budgetValue <= 0) {
      setStatus("Budget must be a positive whole number");
      return;
    }

    createJobMutation.mutate();
  }

  return (
    <DashboardLayout title="Jobs Marketplace" subtitle="Browse active client projects, verify requirements, and manage proposals.">
      {user?.role === "CLIENT" ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm motion-reduce:transform-none"
        >
          <div className="mb-4">
            <h2 className="font-heading text-lg font-bold text-surface-900">Post a new project</h2>
            <p className="mt-0.5 text-xs text-surface-500">Create a structured brief for verified freelancers.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-700">Project title</label>
              <input
                className="input"
                placeholder="e.g. Full-stack Next.js developer for marketplace checkout"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-700">Scope and deliverables</label>
              <textarea
                className="input min-h-24 resize-y"
                placeholder="Describe scope, technical stack, timeline, and expectations"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-700">Project budget ($ or ₹)</label>
              <input
                className="input"
                placeholder="500"
                inputMode="numeric"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              />
            </div>
            <button
              onClick={createJob}
              className="btn-primary btn-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:opacity-50"
              disabled={createJobMutation.isPending}
            >
              {createJobMutation.isPending ? "Posting..." : "Post project"}
            </button>
          </div>
        </motion.section>
      ) : (
        <section className="mb-6 rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
          <p className="text-xs text-surface-600">
            Signed in as <span className="font-semibold text-surface-800">{user?.role || "Guest"}</span>. Client accounts can post new projects directly to this board.
          </p>
        </section>
      )}

      {status ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-xs font-medium text-primary-800"
        >
          {status}
        </motion.div>
      ) : null}

      {/* Job Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {jobs.map((job, index) => (
          <motion.article
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group relative flex flex-col justify-between rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm transition-[border-color,box-shadow,transform] duration-200 hover:border-surface-300 hover:shadow-card-md hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            <div>
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-bold text-surface-900 transition-colors group-hover:text-primary-700">
                  {job.title}
                </h3>
                {user ? (
                  <button
                    type="button"
                    className="flex-shrink-0 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95 disabled:opacity-50"
                    onClick={() => toggleSaveJobMutation.mutate(job.id)}
                    disabled={toggleSaveJobMutation.isPending}
                    aria-label={savedJobsQuery.data?.has(job.id) ? "Remove saved job" : "Save job"}
                  >
                    {savedJobsQuery.data?.has(job.id) ? (
                      <BookmarkCheck className="h-4 w-4 text-primary-600" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>

              <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-surface-600">{job.description}</p>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1 font-semibold text-surface-800">
                  <DollarSign className="h-3 w-3" />
                  {job.budget}
                </span>
                <span className="rounded-lg bg-primary-50 px-2.5 py-1 font-medium text-primary-700">
                  Fee: {job.applicationTokenCost ?? 0} TOK (~₹{(job.applicationTokenCost ?? 0) * TOKEN_PRICE_INR})
                </span>
                <span className="rounded-lg bg-surface-50 px-2.5 py-1 text-surface-600 ring-1 ring-surface-200/60">
                  {job.client?.username || job.client?.name || "Client"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface-50 px-2.5 py-1 text-surface-600 ring-1 ring-surface-200/60">
                  <Users className="h-3 w-3" />
                  {job._count?.proposals || 0} proposals
                </span>
              </div>

              <div className="flex items-center gap-2 border-t border-surface-100 pt-3.5">
                <Link
                  href={`/jobs/${job.id}`}
                  className="btn-primary btn-sm inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98]"
                >
                  View details <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {jobs.length === 0 && !jobsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white p-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-surface-500">
            <Search className="h-6 w-6" />
          </div>
          <p className="font-heading text-base font-semibold text-surface-900">No jobs posted yet</p>
          <p className="mt-1 text-xs text-surface-500">Check back soon for new opportunities or post a project as a client.</p>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
