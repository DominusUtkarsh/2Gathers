"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, Circle, Lock, Mail, User, BriefcaseBusiness, Building2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "At least 1 uppercase letter")
    .regex(/[a-z]/, "At least 1 lowercase letter")
    .regex(/[0-9]/, "At least 1 number")
    .regex(/[^A-Za-z0-9]/, "At least 1 special character"),
  role: z.enum(["CLIENT", "FREELANCER"]),
});

type RegisterInput = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

type LoginInput = z.infer<typeof loginSchema>;

type AuthPanelProps = {
  initialMode: "register" | "login";
};

export function AuthPanel({ initialMode }: AuthPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: (searchParams.get("role") as "CLIENT" | "FREELANCER" | null) ?? "CLIENT",
    },
  });

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    registerForm.setValue(
      "role",
      (searchParams.get("role") as "CLIENT" | "FREELANCER" | null) ?? "CLIENT"
    );
  }, [registerForm, searchParams]);

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterInput) => {
      const response = await authApi.register(values);
      return response.data;
    },
    onSuccess: (payload) => {
      setRegisterSuccess(
        payload?.message || "Registration successful. Please verify your email before signing in."
      );
      setVerificationLink(payload?.verificationLink ?? null);
      setMode("login");
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const response = await authApi.login(values);
      return response.data;
    },
    onSuccess: (payload) => {
      if (!payload?.accessToken || !payload?.user) {
        throw new Error("Unexpected auth response.");
      }
      login({ user: payload.user, token: payload.accessToken });
      router.push("/start");
    },
  });

  const activeMutation = mode === "register" ? registerMutation : loginMutation;
  const error = (activeMutation.error as any)?.response?.data?.detail || activeMutation.error?.message;
  const loading = activeMutation.isPending;
  const passwordValue = registerForm.watch("password") || "";
  const selectedRole = registerForm.watch("role");

  const passwordRules = [
    { label: "At least 8 characters", ok: passwordValue.length >= 8 },
    { label: "At least 1 uppercase letter", ok: /[A-Z]/.test(passwordValue) },
    { label: "At least 1 lowercase letter", ok: /[a-z]/.test(passwordValue) },
    { label: "At least 1 number", ok: /[0-9]/.test(passwordValue) },
    { label: "At least 1 special character", ok: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const passedRules = passwordRules.filter((r) => r.ok).length;
  const strengthPercent = (passedRules / passwordRules.length) * 100;
  const strengthColor =
    strengthPercent <= 20
      ? "bg-danger-500"
      : strengthPercent <= 60
        ? "bg-warning-500"
        : strengthPercent < 100
          ? "bg-primary-500"
          : "bg-success-500";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
      {/* ═══════ LEFT BRANDING HERO (DESKTOP) ═══════ */}
      <div className="relative hidden overflow-hidden bg-surface-950 px-12 py-16 lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 font-heading font-extrabold text-white shadow-sm">
              2G
            </div>
            <div>
              <span className="font-heading text-xl font-bold tracking-tight text-white">2Gathers</span>
              <span className="ml-2 rounded-full border border-surface-800 bg-surface-900 px-2 py-0.5 text-[11px] font-medium text-surface-400">
                Marketplace
              </span>
            </div>
          </Link>

          <div className="mt-20 max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-surface-800 bg-surface-900/80 px-3.5 py-1 text-xs font-medium text-surface-300">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />
              <span>{mode === "register" ? "Create your verified profile" : "Welcome back to 2Gathers"}</span>
            </div>

            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
              High-trust freelancing.
              <span className="block font-semibold text-primary-400">
                Milestones backed by escrow.
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-surface-300">
              Connect verified technical clients and top domain specialists through structured contracts, milestone delivery reviews, and cryptographic proof of work.
            </p>

            <div className="mt-10 space-y-4">
              {[
                {
                  title: "Role-specific workflows",
                  desc: "Dedicated interfaces tailored for hiring clients and executing freelancers.",
                },
                {
                  title: "Token-backed project escrow",
                  desc: "Fund milestones safely with transparent dispute resolution and automatic release.",
                },
                {
                  title: "Verified portfolio telemetry",
                  desc: "Ratings and performance metrics tied to real, completed project deliveries.",
                },
              ].map((feat) => (
                <div key={feat.title} className="flex items-start gap-3 rounded-xl border border-surface-800/80 bg-surface-900/40 p-3.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-950 text-primary-400 ring-1 ring-primary-500/30">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feat.title}</h3>
                    <p className="text-xs text-surface-400">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Trust Quote */}
        <div className="relative z-10 border-t border-surface-800/80 pt-6">
          <p className="text-xs text-surface-400">
            Over 1,200 verified contracts executed with 99.4% on-time milestone sign-off.
          </p>
        </div>
      </div>

      {/* ═══════ RIGHT AUTHENTICATION PANEL ═══════ */}
      <div className="flex min-h-dvh items-center justify-center bg-surface-50 px-4 py-12 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 font-heading font-extrabold text-white">
                2G
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-surface-900">2Gathers</span>
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white p-7 shadow-card-md sm:p-9">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700">
                {mode === "register" ? <Sparkles className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-surface-900">
                  {mode === "register" ? "Create account" : "Sign in"}
                </h2>
                <p className="text-xs text-surface-500">
                  {mode === "register" ? "Set up your 2Gathers identity" : "Access your active projects and contracts"}
                </p>
              </div>
            </div>

            {/* Mode switch */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-100 p-1">
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                  mode === "register"
                    ? "bg-white text-surface-900 shadow-card-sm"
                    : "text-surface-600 hover:text-surface-900"
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                  mode === "login"
                    ? "bg-white text-surface-900 shadow-card-sm"
                    : "text-surface-600 hover:text-surface-900"
                }`}
              >
                Sign in
              </button>
            </div>

            {registerSuccess ? (
              <div className="mt-5 rounded-xl border border-success-200 bg-success-50 p-4 text-xs leading-relaxed text-success-800">
                <p className="font-semibold">{registerSuccess}</p>
                {verificationLink ? (
                  <p className="mt-2 text-xs">
                    Quick test link:{" "}
                    <Link
                      href={verificationLink}
                      className="font-bold underline hover:text-success-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-success-600"
                    >
                      Verify email now
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-xl border border-danger-200 bg-danger-50 p-4 text-xs font-medium text-danger-700">
                {error}
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {mode === "register" ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}
                  className="mt-6 space-y-4"
                >
                  <label className="block">
                    <span className="label">Username</span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        className="input pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        placeholder="Choose a username"
                        {...registerForm.register("username")}
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label">Email address</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        className="input pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        type="email"
                        placeholder="alex@domain.com"
                        {...registerForm.register("email")}
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        className="input pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        type="password"
                        placeholder="Create a strong password"
                        {...registerForm.register("password")}
                        minLength={8}
                        required
                      />
                    </div>

                    {/* Password requirements meter */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-100">
                          <div
                            className={`h-full ${strengthColor}`}
                            style={{ width: `${strengthPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-surface-500">
                          {passedRules}/{passwordRules.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {passwordRules.map((rule) => (
                          <div
                            key={rule.label}
                            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                              rule.ok ? "text-success-700 font-medium" : "text-surface-400"
                            }`}
                          >
                            {rule.ok ? (
                              <Check className="h-3 w-3 shrink-0 text-success-600" />
                            ) : (
                              <Circle className="h-3 w-3 shrink-0 text-surface-300" />
                            )}
                            <span>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </label>

                  {/* Primary Role Choice */}
                  <div>
                    <span className="label">Primary purpose on 2Gathers</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => registerForm.setValue("role", "CLIENT")}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-[border-color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] motion-reduce:transform-none ${
                          selectedRole === "CLIENT"
                            ? "border-primary-600 bg-primary-50/70 text-primary-900"
                            : "border-surface-200 bg-white text-surface-700 hover:border-surface-300 hover:bg-surface-50"
                        }`}
                      >
                        <Building2
                          className={`h-6 w-6 ${
                            selectedRole === "CLIENT" ? "text-primary-700" : "text-surface-500"
                          }`}
                        />
                        <span className="text-xs font-semibold">Hire talent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => registerForm.setValue("role", "FREELANCER")}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-[border-color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] motion-reduce:transform-none ${
                          selectedRole === "FREELANCER"
                            ? "border-primary-600 bg-primary-50/70 text-primary-900"
                            : "border-surface-200 bg-white text-surface-700 hover:border-surface-300 hover:bg-surface-50"
                        }`}
                      >
                        <BriefcaseBusiness
                          className={`h-6 w-6 ${
                            selectedRole === "FREELANCER" ? "text-primary-700" : "text-surface-500"
                          }`}
                        />
                        <span className="text-xs font-semibold">Deliver work</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary btn-md w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                        Creating…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>Register</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}
                  className="mt-6 space-y-4"
                >
                  <label className="block">
                    <span className="label">Username</span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        className="input pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        placeholder="Your username"
                        {...loginForm.register("username")}
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        className="input pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        type="password"
                        placeholder="Enter password"
                        {...loginForm.register("password")}
                        minLength={8}
                        required
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="btn-primary btn-md w-full whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                        Signing in…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-6 border-t border-surface-100 pt-5 text-center text-xs text-surface-500">
              {mode === "register" ? (
                <p>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-semibold text-primary-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-600"
                  >
                    Sign in to your account
                  </button>
                </p>
              ) : (
                <p>
                  New to 2Gathers?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="font-semibold text-primary-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-600"
                  >
                    Create an account
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
