"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, UserCheck, Globe2, Award, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { freelancerProfileApi } from "@/lib/api";

type FreelancerProfile = {
  professionalTitle: string;
  bio: string;
  skills: string;
  experienceLevel: "ENTRY" | "INTERMEDIATE" | "EXPERT";
  hourlyRateUsd: number;
  country: string;
  city: string;
  phone?: string | null;
  languages: string;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  education?: string | null;
  certifications?: string | null;
  availability: "FULL_TIME" | "PART_TIME" | "AS_NEEDED";
  preferredWorkingHours?: string | null;
  responseTime: "WITHIN_HOUR" | "WITHIN_DAY" | "WITHIN_2_DAYS";
};

const defaultValues: FreelancerProfile = {
  professionalTitle: "",
  bio: "",
  skills: "",
  experienceLevel: "INTERMEDIATE",
  hourlyRateUsd: 25,
  country: "",
  city: "",
  phone: "",
  languages: "English",
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  education: "",
  certifications: "",
  availability: "PART_TIME",
  preferredWorkingHours: "",
  responseTime: "WITHIN_DAY",
};

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const { user, login, token } = useAuth();
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState<FreelancerProfile>(defaultValues);

  useEffect(() => {
    if (!user) return;
    const isEditMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("edit") === "1";
    if (user.role !== "FREELANCER") {
      router.replace("/dashboard");
      return;
    }
    if (user.hasFreelancerProfile && !isEditMode) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const profileQuery = useQuery({
    queryKey: ["freelancer-profile"],
    queryFn: async () => {
      const response = await freelancerProfileApi.me();
      return response.data?.profile as FreelancerProfile | null;
    },
    enabled: !!user && user.role === "FREELANCER",
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        ...defaultValues,
        ...profileQuery.data,
      });
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await freelancerProfileApi.save({
        professionalTitle: form.professionalTitle,
        bio: form.bio,
        skills: form.skills,
        experienceLevel: form.experienceLevel,
        hourlyRateUsd: Number(form.hourlyRateUsd),
        country: form.country,
        city: form.city,
        phone: form.phone ?? undefined,
        languages: form.languages,
        portfolioUrl: form.portfolioUrl ?? undefined,
        githubUrl: form.githubUrl ?? undefined,
        linkedinUrl: form.linkedinUrl ?? undefined,
        education: form.education ?? undefined,
        certifications: form.certifications ?? undefined,
        availability: form.availability,
        preferredWorkingHours: form.preferredWorkingHours ?? undefined,
        responseTime: form.responseTime,
      });
    },
    onSuccess: () => {
      setIsError(false);
      setStatus("Freelancer profile saved successfully");
      if (user && token) {
        login({
          user: {
            ...user,
            hasFreelancerProfile: true,
          },
          token,
        });
      }
      router.push("/dashboard");
    },
    onError: (err: any) => {
      setIsError(true);
      setStatus(err?.response?.data?.detail || "Unable to save freelancer profile");
    },
  });

  function onChange<K extends keyof FreelancerProfile>(key: K, value: FreelancerProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit() {
    if (!form.professionalTitle.trim() || !form.bio.trim() || !form.skills.trim() || !form.country.trim() || !form.city.trim()) {
      setIsError(true);
      setStatus("Please complete all required profile fields");
      return;
    }
    if (form.bio.trim().length < 80) {
      setIsError(true);
      setStatus("Bio must be at least 80 characters");
      return;
    }
    if (!Number.isFinite(Number(form.hourlyRateUsd)) || Number(form.hourlyRateUsd) <= 0) {
      setIsError(true);
      setStatus("Hourly rate must be a positive number");
      return;
    }

    setIsError(false);
    saveMutation.mutate();
  }

  return (
    <DashboardLayout
      title="Freelancer profile setup"
      subtitle="Present your technical background, verified rates, and portfolio proof to prospective clients."
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-surface-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-surface-900">
                  Professional discipline
                </h2>
                <p className="text-xs text-surface-500">
                  Primary specialization and baseline milestone billing rate.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-medium text-surface-600">
              <UserCheck className="h-3.5 w-3.5 text-primary-600" />
              Talent Directory
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="label">Professional title *</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.professionalTitle}
                onChange={(event) => onChange("professionalTitle", event.target.value)}
                placeholder="Senior Full-Stack Engineer | React, Node.js & Smart Contracts"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className="label">Technical skills * (comma separated)</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.skills}
                onChange={(event) => onChange("skills", event.target.value)}
                placeholder="TypeScript, Next.js, PostgreSQL, Solidity, Tailwind CSS, REST APIs"
                required
              />
            </label>

            <label className="block">
              <span className="label">Experience seniority *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.experienceLevel}
                onChange={(event) => onChange("experienceLevel", event.target.value as FreelancerProfile["experienceLevel"])}
              >
                <option value="ENTRY">Entry level (0 - 2 years)</option>
                <option value="INTERMEDIATE">Intermediate (2 - 5 years)</option>
                <option value="EXPERT">Expert / Lead (5+ years)</option>
              </select>
            </label>

            <label className="block">
              <span className="label">Baseline rate (USD / hr) *</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                inputMode="numeric"
                type="number"
                min={1}
                value={String(form.hourlyRateUsd)}
                onChange={(event) => onChange("hourlyRateUsd", Number(event.target.value) as FreelancerProfile["hourlyRateUsd"])}
                placeholder="45"
                required
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-surface-100 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-surface-900">
                Location, languages & availability
              </h2>
              <p className="text-xs text-surface-500">
                Set clear expectations for milestone coordination and team overlap.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="label">Country *</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.country}
                onChange={(event) => onChange("country", event.target.value)}
                placeholder="India"
                required
              />
            </label>

            <label className="block">
              <span className="label">City *</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.city}
                onChange={(event) => onChange("city", event.target.value)}
                placeholder="Bangalore"
                required
              />
            </label>

            <label className="block">
              <span className="label">Working languages *</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.languages}
                onChange={(event) => onChange("languages", event.target.value)}
                placeholder="English (Fluent), Hindi"
                required
              />
            </label>

            <label className="block">
              <span className="label">Weekly commitment *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.availability}
                onChange={(event) => onChange("availability", event.target.value as FreelancerProfile["availability"])}
              >
                <option value="FULL_TIME">Full-time (30+ hrs/wk)</option>
                <option value="PART_TIME">Part-time (10-30 hrs/wk)</option>
                <option value="AS_NEEDED">As needed / Advisory</option>
              </select>
            </label>

            <label className="block">
              <span className="label">Response commitment *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.responseTime}
                onChange={(event) => onChange("responseTime", event.target.value as FreelancerProfile["responseTime"])}
              >
                <option value="WITHIN_HOUR">Within 1 hour</option>
                <option value="WITHIN_DAY">Within 24 hours</option>
                <option value="WITHIN_2_DAYS">Within 2 business days</option>
              </select>
            </label>

            <label className="block">
              <span className="label">Preferred working hours</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.preferredWorkingHours || ""}
                onChange={(event) => onChange("preferredWorkingHours", event.target.value)}
                placeholder="Mon-Fri, 10:00 - 18:00 IST"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-surface-100 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-surface-900">
                Portfolio, credentials & bio
              </h2>
              <p className="text-xs text-surface-500">
                Provide verifiable work links and background that build client confidence.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="label">Portfolio or website</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.portfolioUrl || ""}
                onChange={(event) => onChange("portfolioUrl", event.target.value)}
                placeholder="https://portfolio.dev"
              />
            </label>

            <label className="block">
              <span className="label">GitHub repository / profile</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.githubUrl || ""}
                onChange={(event) => onChange("githubUrl", event.target.value)}
                placeholder="https://github.com/username"
              />
            </label>

            <label className="block">
              <span className="label">LinkedIn profile</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.linkedinUrl || ""}
                onChange={(event) => onChange("linkedinUrl", event.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </label>

            <label className="block">
              <span className="label">Direct phone contact</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.phone || ""}
                onChange={(event) => onChange("phone", event.target.value)}
                placeholder="+91 9876543210"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="label">Education & degree</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.education || ""}
                onChange={(event) => onChange("education", event.target.value)}
                placeholder="B.S. in Computer Science, IIT Bombay"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="label">Professional certifications</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.certifications || ""}
                onChange={(event) => onChange("certifications", event.target.value)}
                placeholder="AWS Certified Solutions Architect, Certified Scrum Master"
              />
            </label>

            <label className="block md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="label">Professional bio * (minimum 80 characters)</span>
                <span className={`text-[11px] font-medium ${form.bio.length >= 80 ? "text-success-700" : "text-surface-400"}`}>
                  {form.bio.length} / 80
                </span>
              </div>
              <textarea
                className="input min-h-28 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.bio}
                onChange={(event) => onChange("bio", event.target.value)}
                placeholder="Detail your engineering background, major technical achievements, project deliverables, and client satisfaction track record."
              />
            </label>
          </div>
        </section>

        {status ? (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium ${
              isError
                ? "border-danger-200 bg-danger-50 text-danger-700"
                : "border-success-200 bg-success-50 text-success-800"
            }`}
          >
            {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{status}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSubmit}
            className="btn-primary btn-md inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Save</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
