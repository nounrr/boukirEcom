const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const locales = ['fr', 'ar', 'en', 'zh'];
const flatten = (value, prefix = '', result = {}) => {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, result);
    else result[path] = child;
  }
  return result;
};

test('all four next-intl catalogs expose the same message keys', () => {
  const catalogs = Object.fromEntries(locales.map(locale => [locale, flatten(JSON.parse(fs.readFileSync(`messages/${locale}.json`, 'utf8')))]));
  const expected = Object.keys(catalogs.fr).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(catalogs[locale]).sort(), expected, `${locale} message keys differ`);
});

test('explicit localized URLs are never replaced from localStorage', () => {
  const initializer = fs.readFileSync('src/components/i18n/locale-preference-initializer.tsx', 'utf8');
  assert.doesNotMatch(initializer, /router\.(replace|push)/);
  assert.doesNotMatch(initializer, /localStorage\.getItem/);
  const routing = fs.readFileSync('src/i18n/routing.ts', 'utf8');
  for (const locale of locales) assert.match(routing, new RegExp(`['\"]${locale}['\"]`));
  assert.match(routing, /localePrefix:\s*['\"]always['\"]/);
});
