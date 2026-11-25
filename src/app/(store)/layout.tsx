import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { getSiteConfig } from "@/config/site";
import { getActiveMenu } from "@/services/cms";
import { getAnalyticsSettings, getConsent } from "@/services/analytics";
import { ANALYTICS_COOKIE, ANALYTICS_CONSENT_COOKIE } from "@/lib/constants";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { AnalyticsConsentBanner } from "@/components/analytics-consent-banner";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [site, headerMenu, footerMenu, analyticsSettings, store] = await Promise.all([
    getSiteConfig(),
    getActiveMenu("HEADER"),
    getActiveMenu("FOOTER"),
    getAnalyticsSettings(),
    cookies(),
  ]);

  let consentDecided = false;
  let analyticsAllowed = !analyticsSettings.requireConsent;
  if (analyticsSettings.requireConsent) {
    const cookieConsent = store.get(ANALYTICS_CONSENT_COOKIE)?.value;
    if (cookieConsent) {
      consentDecided = true;
      analyticsAllowed = cookieConsent === "all" || cookieConsent === "analytics";
    } else {
      const sessionId = store.get(ANALYTICS_COOKIE)?.value;
      if (sessionId) {
        const consent = await getConsent(sessionId).catch(() => null);
        if (consent) {
          consentDecided = true;
          analyticsAllowed = consent.analytics;
        }
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar site={site} menu={headerMenu} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer site={site} menu={footerMenu} />
      <Suspense fallback={null}>
        <AnalyticsTracker allowed={analyticsSettings.enabled && analyticsAllowed} />
      </Suspense>
      {analyticsSettings.enabled && analyticsSettings.requireConsent && !consentDecided ? <AnalyticsConsentBanner /> : null}
    </div>
  );
}
