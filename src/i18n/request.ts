import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import xpFr from '../../messages/xp/fr.json';
import xpEn from '../../messages/xp/en.json';
import xpAr from '../../messages/xp/ar.json';
import xpZh from '../../messages/xp/zh.json';

type Messages = Record<string, unknown>;

function isRecord(value: unknown): value is Messages {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep merge: `override` wins, missing keys fall back to `base`. */
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isRecord(value) && isRecord(base[key]) ? deepMerge(base[key] as Messages, value) : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const base = (await import(`../../messages/${locale}.json`)).default as Messages;

  // Redesign / smart-tools copy lives in its own namespace ("xp") so it never
  // collides with the existing message files. French is the reference; any
  // key missing in another locale falls back to French instead of erroring.
  const xpByLocale: Record<string, Messages> = { fr: xpFr, en: xpEn, ar: xpAr, zh: xpZh };
  const xpLocale = xpByLocale[locale] ?? {};

  return {
    locale,
    messages: { ...base, xp: deepMerge(xpFr as Messages, xpLocale) },
  };
});
