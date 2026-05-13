export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.debug('Service worker registration failed', error);
    });
  });
}
