import React from "react";
import { Check, AlertTriangle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: "paid" | "pending" | "defaulted";
  size?: "sm" | "md";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const config = {
    paid: {
      label: "Paid",
      icon: Check,
      className: "bg-sea-green/15 text-sea-green border-sea-green/30",
    },
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-cool-steel/15 text-cool-steel border-cool-steel/30",
    },
    defaulted: {
      label: "Defaulted",
      icon: AlertTriangle,
      className: "bg-destructive/15 text-destructive border-destructive/30",
    },
  };

  const { label, icon: Icon, className } = config[status];
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${className} ${
        isSmall ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Icon className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {label}
    </span>
  );
};

export default StatusBadge;
