import { Suspense } from "react";
import { AuthPanel } from "@/components/AuthPanel";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50" />}>
      <AuthPanel initialMode="register" />
    </Suspense>
  );
}