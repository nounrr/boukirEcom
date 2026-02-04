import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['fr', 'ar', 'en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'fr',

  // The `pathnames` configuration is used to match incoming
  // requests to specific pathnames based on the active locale
  localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
