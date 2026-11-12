"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Lock,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  Coins,
  Check,
  Clock,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { mockJobs } from "@/lib/db";
import { TOKEN_PRICE_INR } from "@/lib/tokenomics";

const features = [
  {
    icon: Sparkles,
    title: "AI-Driven Match Quality",
    description: "Match with high-intent opportunities and candidates based on verified skills, portfolio history, and milestone fit.",
  },
  {
    icon: Shield,
    title: "Escrow Milestone Security",
    description: "Client funds are locked safely in token-backed escrow and only disbursed when project criteria are fully verified.",
  },
  {
    icon: Zap,
    title: "Token-Powered Accountability",
    description: "Every proposal, hiring commitment, and task completion is recorded on a transparent marketplace ledger.",
  },
];

const roleTracks = [
  {
    icon: BriefcaseBusiness,
    title: "For Freelancers",
    subtitle: "Build reputation, submit high-signal proposals, and receive guaranteed on-time milestone payouts.",
    points: [
      "Verifiable on-chain profile & skill benchmarks",
      "Low competition from verified proposal quotas",
      "Instant token withdrawals & milestone protection",
    ],
    ctaLabel: "Start as Freelancer",
    href: "/register?role=FREELANCER",
    badge: "Talent Portal",
  },
  {
    icon: Building2,
    title: "For Clients",
    subtitle: "Publish project briefs, interview top specialists, and disburse payouts with complete confidence.",
    points: [
      "Structured briefs that attract serious proposals",
      "Automated skill verification via coding challenges",
      "Escrow protection with dispute mediation",
    ],
    ctaLabel: "Start as Client",
    href: "/register?role=CLIENT",
    badge: "Hiring Portal",
  },
];

const steps = [
  {
    n: "01",
    title: "Create a verified profile",
    body: "Choose your role as a client or freelancer. Set skills, hourly expectations, and configure your token wallet.",
  },
  {
    n: "02",
    title: "Publish or apply with signal",
    body: "Clients post clear milestone briefs. Freelancers stake application tokens to ensure high-quality, focused proposals.",
  },
  {
    n: "03",
    title: "Deliver and disburse escrow",
    body: "Collaborate through direct messaging, review code or creative deliverables, and release milestone funds instantly.",
  },
];

const testimonials = [
  {
    name: "Alex Chen",
    role: "Full-Stack Engineer",
    rate: "$75/hr",
    quote: "The token stake requirement completely eliminated low-effort spam proposals. Every client I've connected with here has had a clear scope and approved milestones on time.",
  },
  {
    name: "Sarah Rodriguez",
    role: "Head of Product at Studio North",
    rate: "Client",
    quote: "We hired two senior React engineers in under 72 hours. Escrow milestones gave our leadership team complete transparency on deliverables before releasing payment.",
  },
  {
    name: "Marcus Williams",
    role: "Technical Founder",
    rate: "Client",
    quote: "2Gathers is what freelance marketplaces should have been from day one: clean typography, zero fake metrics, and an escrow structure built on real accountability.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [roleFromQuery, setRoleFromQuery] = useState<"CLIENT" | "FREELANCER" | null>(null);
  const [heroEmail, setHeroEmail] = useState("");

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role === "CLIENT" || role === "FREELANCER") {
      setRoleFromQuery(role);
      return;
    }
    setRoleFromQuery(null);
  }, []);

  const scopedRole =
    user?.role === "CLIENT" || user?.role === "FREELANCER"
      ? user.role
      : roleFromQuery === "CLIENT" || roleFromQuery === "FREELANCER"
        ? roleFromQuery
        : null;

  function handleHeroStart(e: FormEvent) {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
      return;
    }
    const cleanEmail = heroEmail.trim();
    router.push(cleanEmail ? `/register?email=${encodeURIComponent(cleanEmail)}` : "/register");
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900">
      <Navbar />

      {/* ═══════ HERO: DIAGONAL MESH & OVERLAPPING WORKSPACE STAGE ═══════ */}
      <section className="relative overflow-hidden border-b border-surface-200 bg-white pb-20 pt-28 sm:pt-32 lg:pb-32 lg:pt-36">
        {/* Diagonal vibrant gradient canvas */}
        <div className="hero-stripe-canvas" aria-hidden="true" />

        {/* Subtle architectural structural lines */}
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden="true">
          <div className="grid h-full grid-cols-4 border-x border-surface-900/[0.04]">
            <div className="border-r border-surface-900/[0.04]" />
            <div className="border-r border-surface-900/[0.04]" />
            <div className="border-r border-surface-900/[0.04]" />
            <div />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-6"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-surface-900 shadow-card-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary-600" />
                2Gathers Escrow &middot; Milestone Marketplace
              </div>

              <h1 className="font-heading text-4xl font-extrabold tracking-[-0.035em] text-surface-950 sm:text-5xl lg:text-[4rem] lg:leading-[1.06]">
                Hire better
                <br />
                talent to scale
                <br />
                your projects
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-surface-700 sm:text-lg">
                High-trust marketplace for verified talent, structured milestones, and escrow payouts.
              </p>

              {/* Inline quick-start action pill */}
              <form
                onSubmit={handleHeroStart}
                className="mt-8 flex max-w-md items-center rounded-full border border-surface-200 bg-white p-1.5 shadow-card-lg focus-within:ring-2 focus-within:ring-primary-600"
              >
                <input
                  type="email"
                  value={heroEmail}
                  onChange={(e) => setHeroEmail(e.target.value)}
                  placeholder="Email address"
                  aria-label="Email address"
                  className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap motion-reduce:transform-none"
                >
                  <span>{user ? "Dashboard" : "Start now"}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-semibold text-surface-700">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-md"
                >
                  <span>Explore live jobs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/freelancers"
                  className="inline-flex items-center gap-1.5 text-surface-700 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-md"
                >
                  <span>Browse verified talent</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Right: Overlapping Mobile Escrow Checkout + Desktop Workspace Telemetry */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="relative lg:col-span-6 lg:pl-8"
            >
              {/* Back layer: Desktop Workspace Analytics Dashboard */}
              <div className="hidden rounded-2xl border border-surface-200/90 bg-white p-5 shadow-card-lg sm:block sm:ml-24">
                {/* Browser / Workspace top bar */}
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-surface-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-950 text-[10px] font-bold text-white">
                      2G
                    </div>
                    <span className="text-xs font-bold tracking-tight text-surface-900">
                      STUDIO NORTH
                    </span>
                  </div>
                  <div className="flex flex-1 max-w-[200px] items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1 text-[11px] text-surface-400">
                    <Search className="h-3 w-3" />
                    <span>Search contracts…</span>
                  </div>
                </div>

                {/* Today Volume Metric + SVG Line Chart */}
                <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
                  <p className="text-xs font-semibold text-surface-500">Today</p>
                  <div className="mt-1 flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-surface-500">Escrow volume</p>
                      <p className="font-heading text-xl font-bold tabular-nums text-surface-900">
                        48,500 TOK
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-surface-500">Yesterday</p>
                      <p className="font-heading text-sm font-semibold tabular-nums text-surface-700">
                        41,200 TOK
                      </p>
                    </div>
                  </div>

                  {/* Clean Indigo Trend Curve */}
                  <div className="mt-3 h-20 w-full">
                    <svg
                      viewBox="0 0 320 70"
                      className="h-full w-full overflow-visible"
                      role="img"
                      aria-label="Escrow disbursement activity curve"
                    >
                      <line x1="0" y1="62" x2="320" y2="62" stroke="#e2e8f0" strokeWidth="1" />
                      <line x1="0" y1="34" x2="320" y2="34" stroke="#f1f5f9" strokeWidth="1" />
                      <polyline
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points="0,56 42,54 88,52 135,44 176,47 224,26 270,22 318,10"
                      />
                    </svg>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-surface-400">
                    <span>00:00</span>
                    <span className="font-semibold text-primary-700">Live · 14:00</span>
                  </div>
                </div>

                {/* Split Mini Stat Cards */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-surface-100 bg-white p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-surface-500">Active milestones</span>
                      <span className="font-semibold text-success-700">+18.4%</span>
                    </div>
                    <p className="mt-1 font-heading text-base font-bold tabular-nums text-surface-900">
                      142 active
                    </p>
                    <svg
                      viewBox="0 0 120 28"
                      className="mt-2 h-7 w-full"
                      aria-hidden="true"
                    >
                      <polyline
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2"
                        strokeLinecap="round"
                        points="0,24 25,21 50,15 78,17 100,8 120,4"
                      />
                    </svg>
                  </div>

                  <div className="rounded-xl border border-surface-100 bg-white p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-surface-500">On-time sign-off</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-primary-700">
                        <TrendingUp className="h-3 w-3" />
                        99.4%
                      </span>
                    </div>
                    <p className="mt-1 font-heading text-base font-bold tabular-nums text-surface-900">
                      &lt; 2.4 hrs
                    </p>
                    <svg
                      viewBox="0 0 120 28"
                      className="mt-2 h-7 w-full"
                      aria-hidden="true"
                    >
                      <polyline
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2"
                        strokeLinecap="round"
                        points="0,22 30,20 60,18 90,12 120,6"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Front layer: Overlapping Mobile Escrow Contract Card */}
              <div className="relative z-20 mx-auto w-full max-w-[292px] rounded-[28px] border border-surface-200 bg-white p-5 shadow-card-lg sm:absolute sm:left-0 sm:top-6">
                {/* Product/Project Card Header */}
                <div className="text-center">
                  <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm">
                    <Shield className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-surface-900">
                    Next.js 15 &amp; Prisma API
                  </p>
                  <p className="text-[11px] text-surface-500">
                    2,400 TOK (~₹{2400 * TOKEN_PRICE_INR})
                  </p>
                </div>

                {/* Dark Pay / Escrow Action Bar */}
                <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-surface-950 py-2 text-xs font-semibold text-white">
                  <Lock className="h-3.5 w-3.5 text-primary-300" />
                  <span>Escrow Milestone #2</span>
                </div>

                <div className="my-3.5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-surface-200" />
                  <span className="text-[11px] font-medium text-surface-400">
                    Contract verification
                  </span>
                  <div className="h-px flex-1 bg-surface-200" />
                </div>

                {/* Form-like detail rows matching Stripe card rhythm */}
                <div className="space-y-2.5 text-left">
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-surface-500">
                      Assigned specialist
                    </p>
                    <div className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-900">
                      <span>Alex Chen</span>
                      <span className="text-primary-700 font-semibold">4.9 ★</span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-[11px] font-medium text-surface-500">
                      Milestone proof
                    </p>
                    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-surface-200 bg-white text-[11px]">
                      <div className="border-r border-surface-200 px-2.5 py-1.5 font-medium text-surface-700">
                        Tests: Passed
                      </div>
                      <div className="px-2.5 py-1.5 font-semibold tabular-nums text-success-700">
                        45 TOK stake
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-[11px] font-medium text-surface-500">
                      Disbursement rule
                    </p>
                    <div className="flex items-center justify-between rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-[11px] text-surface-700">
                      <span>On milestone review</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
                    </div>
                  </div>
                </div>

                <Link
                  href="/jobs"
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.98] motion-reduce:transform-none"
                >
                  <span>Inspect Open Contracts</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ METRICS BANNER ═══════ */}
      <section className="border-b border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="border-l-2 border-primary-600 pl-4">
              <p className="font-heading text-2xl font-bold tabular-nums text-surface-900 sm:text-3xl">
                {mockJobs.length * 15}+
              </p>
              <p className="mt-0.5 text-xs text-surface-500">Active verified jobs</p>
            </div>
            <div className="border-l-2 border-primary-600 pl-4">
              <p className="font-heading text-2xl font-bold tabular-nums text-surface-900 sm:text-3xl">
                98.4%
              </p>
              <p className="mt-0.5 text-xs text-surface-500">Milestone completion</p>
            </div>
            <div className="border-l-2 border-primary-600 pl-4">
              <p className="font-heading text-2xl font-bold tabular-nums text-surface-900 sm:text-3xl">
                &lt; 2.4 hrs
              </p>
              <p className="mt-0.5 text-xs text-surface-500">Proposal response time</p>
            </div>
            <div className="border-l-2 border-primary-600 pl-4">
              <p className="font-heading text-2xl font-bold tabular-nums text-surface-900 sm:text-3xl">
                100%
              </p>
              <p className="mt-0.5 text-xs text-surface-500">Escrow backed contracts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TWO DISTINCT ROLES ═══════ */}
      <section className="border-b border-surface-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              Engineered for both sides of the marketplace
            </h2>
            <p className="mx-auto mt-2.5 max-w-2xl text-base text-surface-600">
              Select your path to enter a workspace tailored to your exact operational requirements.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {roleTracks.map((track) => (
              <div
                key={track.title}
                className="flex flex-col justify-between rounded-2xl border border-surface-200 bg-surface-50/50 p-8 shadow-card-sm transition-[border-color,box-shadow,transform] duration-200 hover:border-surface-300 hover:shadow-card-md hover:-translate-y-0.5 motion-reduce:transform-none"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                      <track.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-surface-200 bg-white px-3 py-1 text-xs font-semibold text-surface-700">
                      {track.badge}
                    </span>
                  </div>

                  <h3 className="font-heading text-2xl font-bold text-surface-900">{track.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600">{track.subtitle}</p>

                  <ul className="my-6 space-y-3 border-t border-surface-200/80 pt-6 text-sm text-surface-700">
                    {track.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={track.href}
                  className="btn-primary btn-md inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {track.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="border-b border-surface-200 bg-surface-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              How 2Gathers operates
            </h2>
            <p className="mx-auto mt-2.5 max-w-2xl text-base text-surface-600">
              Clear structure from account creation to completed project reviews.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="relative rounded-2xl border border-surface-200 bg-white p-7 shadow-card-sm"
              >
                <div className="mb-4 text-xs font-semibold text-primary-700">
                  Step {step.n}
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-surface-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-surface-600">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED OPPORTUNITIES ═══════ */}
      <section className="border-b border-surface-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
                Featured live projects
              </h2>
              <p className="mt-1 text-sm text-surface-600">Active engagements accepting candidate proposals today</p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              View all listings <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockJobs.slice(0, 3).map((job) => (
              <article
                key={job.id}
                className="flex flex-col justify-between rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm transition-[border-color,box-shadow,transform] duration-200 hover:border-surface-300 hover:shadow-card-md hover:-translate-y-0.5 motion-reduce:transform-none"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="rounded-md border border-surface-200 bg-surface-50 px-2 py-0.5 font-medium text-surface-700">
                      {job.client}
                    </span>
                    <span className="font-semibold text-primary-700">
                      {job.tokenCost} TOK Stake
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-surface-900 hover:text-primary-700">
                    <Link href="/jobs">{job.title}</Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-surface-600">
                    {job.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-surface-100 pt-4">
                  <div>
                    <span className="text-[11px] text-surface-500 block">Budget</span>
                    <span className="font-heading text-base font-bold text-surface-900">{job.budget}</span>
                  </div>
                  <Link
                    href="/jobs"
                    className="btn-primary btn-sm inline-flex items-center gap-1"
                  >
                    View Project <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ VERIFIED EXPERIENCES ═══════ */}
      <section className="border-b border-surface-200 bg-surface-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              Verified marketplace outcomes
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-surface-600">
              Feedback from active developers and product managers on 2Gathers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm"
              >
                <div>
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning-500 text-warning-500" />
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-surface-700">&ldquo;{t.quote}&rdquo;</p>
                </div>

                <div className="mt-5 border-t border-surface-100 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-surface-900">{t.name}</p>
                    <p className="text-[11px] text-surface-500">{t.role}</p>
                  </div>
                  <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-700">
                    {t.rate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ READY TO START CTA ═══════ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Ready to experience a modern marketplace?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-surface-600">
            Create an account in minutes and connect with top clients and freelancers on 2Gathers.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="btn-primary btn-lg inline-flex items-center justify-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98]"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary btn-lg inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              Fast registration
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              No subscription paywalls
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              Escrow milestone protection
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
