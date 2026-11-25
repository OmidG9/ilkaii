import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

export function Field({ label, hint, error, children, htmlFor }: {
  label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink/80">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field min-h-28 resize-y ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field cursor-pointer ${className}`} {...props}>{children}</select>;
}

export function Checkbox({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={`h-5 w-5 accent-[var(--color-primary)] ${className}`} {...props} />;
}
