import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function buttonStyles(variant: Variant = "primary", size: Size = "md") {
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-white hover:bg-hover shadow-sm",
    secondary: "bg-secondary text-white hover:bg-primary",
    outline: "border border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-ink hover:bg-line/60",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes: Record<Size, string> = {
    sm: "min-h-11 px-4 text-sm rounded-xl",
    md: "min-h-12 px-6 text-sm rounded-2xl",
    lg: "min-h-14 px-8 text-base rounded-2xl",
  };
  return `inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${buttonStyles(variant, size)} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href, variant = "primary", size = "md", className = "", children,
}: {
  href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode;
}) {
  return <Link href={href} className={`${buttonStyles(variant, size)} ${className}`}>{children}</Link>;
}
