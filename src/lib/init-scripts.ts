/**
 * Inline scripts executed in <head> before first paint. Kept in a neutral
 * (non-"use client") module so the server root layout can embed them.
 */
export const THEME_STORAGE_KEY = "bd-theme"

/** Resolves saved theme (or OS preference) → `.dark` on <html>, no flash. */

export const themeInitScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=null;try{p=localStorage.getItem(k)}catch(e){}var d=p==='dark'||((!p||p==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.dataset.theme=d?'dark':'light'}catch(e){}})();`

/**
 * Enables scroll-reveal hiding only when JS runs. Reduced-motion visitors get
 * opacity-only fades (see globals.css). If the client observer never boots,
 * the class is removed so content stays visible.
 */
export const revealInitScript = `(function(){try{var r=document.documentElement;r.classList.add('motion-ready');setTimeout(function(){if(!window.__bdReveal)r.classList.remove('motion-ready')},2600)}catch(e){}})();`
