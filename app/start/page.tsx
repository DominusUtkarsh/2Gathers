"use client";

import { BriefcaseBusiness, Search, Trophy, UserRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ActionCard } from "@/components/post-signup/ActionCard";

export default function PostSignupSelectionPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-50">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 rounded-2xl border border-surface-200 bg-white p-8 text-center shadow-card-sm sm:p-10">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3.5 py-1 text-xs font-semibold text-primary-700">
            Platform workspace
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-surface-900 sm:text-4xl">
            Welcome to 2Gathers
          </h1>
          <p className="mt-3 text-sm text-surface-600 sm:text-base">
            Select your primary objective to enter your personalized workspace.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <ActionCard
            title="Work as Freelancer"
            description="Browse open contracts, submit milestone proposals, and track verified wallet disbursements."
            buttonLabel="Start Working"
            icon={BriefcaseBusiness}
            onClick={() => router.push("/freelancer/dashboard")}
          />

          <ActionCard
            title="Hire Talent"
            description="Create job requirements, evaluate bids, fund escrow milestones, and approve deliverables."
            buttonLabel="Hire Now"
            icon={UserRound}
            onClick={() => router.push("/client/dashboard")}
          />

          <ActionCard
            title="Explore Jobs"
            description="Browse real-time listings, filter by required skillsets, and evaluate project scopes."
            buttonLabel="Browse Jobs"
            icon={Search}
            onClick={() => router.push("/jobs")}
          />
        </section>

        <section className="mt-8">
          <Link
            href="/leaderboard"
            className="group block rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm transition-[border-color,box-shadow] duration-150 hover:border-surface-300 hover:shadow-card-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold text-primary-700">
                  Marketplace rankings
                </span>
                <h2 className="mt-1 font-heading text-xl font-bold text-surface-900">
                  Top Freelancers Leaderboard
                </h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-surface-600">
                  Review top-ranked talent by completed contracts, escrow volume, and client ratings.
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none" />
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-warning-200 bg-warning-50 text-warning-700">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
