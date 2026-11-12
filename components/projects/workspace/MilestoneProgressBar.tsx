"use client";

export function MilestoneProgressBar({
  approved,
  total,
  released,
}: {
  approved: number;
  total: number;
  released?: boolean;
}) {
  const percent = released
    ? 100
    : total > 0
      ? Math.round((approved / total) * 100)
      : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-surface-500">
        <span>
          {total > 0
            ? `${approved} of ${total} deliverables approved`
            : "No deliverables assigned yet"}
        </span>
        <span className="font-medium tabular-nums text-surface-700">{percent}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-colors duration-200 ${
            released || percent === 100 ? "bg-success-500" : "bg-primary-600"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
