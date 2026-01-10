"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "pink" | "white" | "gray";
  className?: string;
}

export function Spinner({ size = "md", color = "pink", className = "" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3 border",
    md: "h-4 w-4 border-2",
    lg: "h-6 w-6 border-2",
  };

  const colorClasses = {
    pink: "border-pink-600 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-400 border-t-transparent",
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
