import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: number;
  suffix?: string;
  icon: ReactNode;
};

export default function MetricCard({
  title,
  value,
  suffix = "",
  icon,
}: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-icon">
          {icon}
        </span>

        <span className="metric-title">
          {title}
        </span>
      </div>

      <div className="metric-value">
        {typeof value === "number"
          ? value.toFixed(0)
          : value}

        {suffix && (
          <small>{suffix}</small>
        )}
      </div>
    </div>
  );
}
