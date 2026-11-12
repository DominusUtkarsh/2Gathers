"use client";

import { LucideIcon, ArrowRight } from "lucide-react";

type ActionCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  icon: LucideIcon;
  onClick: () => void;
  accentClass?: string;
};

export function ActionCard({
  title,
  description,
  buttonLabel,
  icon: Icon,
  onClick,
}: ActionCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-surface-200 bg-white p-7 shadow-card-sm transition-[border-color,box-shadow] duration-150 hover:border-surface-300 hover:shadow-card-md">
      <div>
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-surface-200 bg-surface-50 text-primary-700">
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="font-heading text-xl font-bold text-surface-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-surface-600">{description}</p>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onClick}
          className="btn-primary btn-md inline-flex w-full items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
        >
          <span>{buttonLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
