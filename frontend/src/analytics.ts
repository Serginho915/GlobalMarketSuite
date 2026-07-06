const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

type GtagCommand = 'js' | 'config' | 'event';
type GtagParams = Record<string, unknown>;
type GtagArguments = [GtagCommand, string | Date, GtagParams?];

declare global {
  interface Window {
    dataLayer?: GtagArguments[];
    gtag?: (...args: GtagArguments) => void;
  }
}

export function initAnalytics() {
  if (!measurementId || typeof window === 'undefined' || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: GtagArguments) {
    window.dataLayer?.push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
}

export function trackPageView(path: string) {
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    send_to: measurementId,
  });
}
