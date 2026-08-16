const productionUrl = 'https://taxischild.vercel.app';

export function getPublicAppUrl(): string {
  const configuredUrl = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return window.location.origin;
  }

  return productionUrl;
}
