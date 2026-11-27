import type { PaymentGatewayName } from "@/services/payment";

/** Compact, dependency-free brand marks for the gateway picker. */
export function PaymentGatewayLogo({ gateway, className = "" }: { gateway: PaymentGatewayName; className?: string }) {
  if (gateway === "ZARINPAL") {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="زرین‌پال">
        <defs>
          <linearGradient id="zarinpal-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F7D774" />
            <stop offset="55%" stopColor="#E6B93F" />
            <stop offset="100%" stopColor="#C99A1F" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#zarinpal-gold)" />
        <path d="M14 16h20l-14 16h14" fill="none" stroke="#4B3705" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 21h11" fill="none" stroke="#FFF6D8" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      </svg>
    );
  }

  if (gateway === "ZIBAL") {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="زیبال">
        <defs>
          <linearGradient id="zibal-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2388E8" />
            <stop offset="100%" stopColor="#0D4FA8" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="13" fill="url(#zibal-blue)" />
        <path d="M15 15h18l-13 14h13" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="35" cy="34" r="2.6" fill="#8ED0FF" />
        <circle cx="13" cy="34" r="1.8" fill="#8ED0FF" opacity="0.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="به‌پرداخت ملت">
      <defs>
        <linearGradient id="mellat-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E63946" />
          <stop offset="100%" stopColor="#A41623" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="#143B66" />
      <path d="M0 35h48v13H0z" fill="url(#mellat-red)" />
      <path d="M12 25l8-9 4 4 4-4 8 9v6H12z" fill="#FFFFFF" opacity="0.95" />
      <path d="M16 31v-4M22 31v-4M26 31v-4M32 31v-4" stroke="#143B66" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 31h28" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
