import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({ children, className = "", hover = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm ${hover ? "hover:shadow-lg transition-all hover:-translate-y-1" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
