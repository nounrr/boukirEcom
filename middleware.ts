import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

// Use next-intl middleware with the routing configuration. Locale
// detection behaviour is controlled via the routing config itself.
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};