const fs = require('node:fs');
const path = require('node:path');
const {root} = require('./register-project.cjs');
process.env.NEXT_PUBLIC_SITE_URL='https://boukirdiamond.com';
process.env.NEXT_PUBLIC_API_URL='https://boukirdiamond.com';
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {loadCatalogPage}=require('../src/lib/catalog/data.ts');
const {categories,brands}=require('../src/lib/catalog/registry.ts');
const {CatalogLanding}=require('../src/components/shop/catalog-landing.tsx');
(async()=>{
 const results=[];
 const selected=[...categories.map(page=>({kind:'categories',page})),...brands.filter(b=>[1,2,37].includes(b.id)).map(page=>({kind:'marques',page}))];
 for(const {kind,page} of selected){
  try{const loaded=await loadCatalogPage(kind,page.slug,1);if(!loaded) throw new Error('Missing catalog ID');
   for(const locale of ['fr','ar']){
    const html=renderToStaticMarkup(React.createElement(CatalogLanding,{kind,...loaded,locale,pageNumber:1}));
    const productIds=[...html.matchAll(new RegExp(`href="/${locale}/product/(\\d+)"`,'g'))].map(m=>Number(m[1]));
    const valid=loaded.data.products.every(p=>productIds.includes(p.id))&&productIds.length===loaded.data.products.length;
    results.push({kind,slug:page.slug,locale,total:loaded.data.pagination.total_items,renderedProducts:productIds.length,allLinksInInitialHtml:valid,productIds});
    if(page.slug==='75-etancheite-bitume'||page.slug==='37-danosa') fs.writeFileSync(path.join(root,'../docs/seo-2026-09-08',`correction-04-live-${kind}-${locale}.html`),'<!doctype html><meta charset="utf-8">'+html);
    if(!valid) process.exitCode=1;
   }
  }catch(e){results.push({kind,slug:page.slug,error:e.message});process.exitCode=1;}
 }
 fs.writeFileSync(path.join(root,'../docs/seo-2026-09-08/correction-04-live-ssr.json'),JSON.stringify({checkedAt:new Date().toISOString(),note:'Local Server Component rendering with live public API. Not deployed HTTP route validation.',results},null,2));
 console.log(results.map(({productIds,...result})=>result));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
