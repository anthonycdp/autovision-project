import { ReactNode } from "react";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: "primary" | "success" | "warning" | "secondary";
  onClick?: () => void;
  href?: string;
  clickable?: boolean;
}

export function StatsCard({ title, value, icon, color, onClick, href, clickable = true }: StatsCardProps) {
  const colorClasses = {
    primary: "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border-blue-200",
    success: "bg-gradient-to-r from-green-50 to-green-100 text-green-600 border-green-200",
    warning: "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 border-orange-200",
    secondary: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-gray-200",
  };

  const baseClasses = "group hover:scale-105 transition-transform duration-200";
  const clickableClasses = clickable ? "cursor-pointer hover:shadow-lg" : "";
  const cardClasses = `${baseClasses} ${clickableClasses}`;

  const cardContent = (
    <div className="flex items-center justify-between p-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`rounded-xl w-12 h-12 flex items-center justify-center border ${colorClasses[color]} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
    </div>
  );

  if (href && clickable) {
    return (
      <Link href={href}>
        <div className={cardClasses}>
          {cardContent}
        </div>
      </Link>
    );
  }

  if (onClick && clickable) {
    return (
      <div className={cardClasses} onClick={onClick}>
        {cardContent}
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {cardContent}
    </div>
  );
}
