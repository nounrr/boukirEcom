const test = require('node:test');
const assert = require('node:assert/strict');
require('../scripts/register-project.cjs');
process.env.NEXT_PUBLIC_SITE_URL = 'https://boukirdiamond.com';
const client = require.resolve('../app/[locale]/(shop)/product/[id]/product-page-client.tsx');
require.cache[client] = { id:client, filename:client, loaded:true, exports:function Client(){return null;} };
const Page = require('../app/[locale]/(shop)/product/[id]/page.tsx').default;
const {default:Layout,generateMetadata} = require('../app/[locale]/(shop)/product/[id]/layout.tsx');
const {renderToStaticMarkup} = require('react-dom/server');
const {productHref} = require('../src/lib/seo/product-url.ts');
const {getPublicProduct,ProductBackendUnavailableError} = require('../src/lib/seo/product.ts');
const product = {id:6696,designation:'Membrane bitume',designation_ar:'غشاء بيتومين',designation_en:'Bitumen membrane',designation_zh:'沥青膜',prix_vente:80,variants:[{id:12,variant_name:'Vert 4 mm',color_name:'Vert',prix_vente:90,available:true}]};
let status = 200;
global.fetch = async url => { assert.ok(String(url).endsWith('/6696')); return Response.json(product,{status}); };
const props = (locale,id,query={}) => ({params:Promise.resolve({locale,id}),searchParams:Promise.resolve(query)});

test('legacy and outdated slugs redirect permanently, retaining variants and campaign parameters in all languages', async()=>{
 for(const locale of ['fr','ar','en','zh']) {
  const target=productHref(product,locale);
  assert.doesNotMatch(target, /[^\x00-\x7F]/, 'generated href must be safe in an HTTP Location header');
  for(const id of ['6696','6696-old-name']) await assert.rejects(Page(props(locale,id,{variant:'12-vert-4-mm',utm_source:'test'})),e=>e.digest?.includes('308')&&e.digest.includes(target+'?variant=12-vert-4-mm&utm_source=test'));
  const route = await Page(props(locale,target.split('/').at(-1)));
  assert.equal(route.props.initialProduct.id, product.id);
  assert.equal(route.props.initialProduct.designation, product.designation);
  assert.equal(route.props.initialProduct.is_wishlisted, false);
  const metadata=await generateMetadata(props(locale,'6696'));
  for(const l of ['fr','ar','en','zh']) assert.equal(metadata.alternates.languages[l],new URL(productHref(product,l),'https://boukirdiamond.com').href);
 }
});
test('Arabic and mixed-language slugs are encoded once and accepted as canonical routes', async()=>{
 const mixed={...product,id:5151,designation:'1m سرجوان حديد',designation_ar:null,variants:[]};
 global.fetch=async url=>{ assert.ok(String(url).endsWith('/5151')); return Response.json(mixed); };
 const target=productHref(mixed,'ar');
 assert.equal(target,'/ar/product/5151-1m-%D8%B3%D8%B1%D8%AC%D9%88%D8%A7%D9%86-%D8%AD%D8%AF%D9%8A%D8%AF');
 const encodedRoute=await Page(props('ar',target.split('/').at(-1)));
 assert.equal(encodedRoute.props.initialProduct.id,5151);
 const unicodeRoute=await Page(props('ar','5151-1m-سرجوان-حديد'));
 assert.equal(unicodeRoute.props.initialProduct.id,5151);
 global.fetch=async url=>{assert.ok(String(url).endsWith('/6696'));return Response.json(product,{status});};
});
test('untranslated product locales stay accessible but noindex and outside hreflang', async()=>{
 const partial={...product,id:7700,designation:'Ciment CPJ 35',designation_ar:'إسمنت CPJ 35',designation_en:null,designation_zh:null,variants:[]};
 global.fetch=async url=>{assert.ok(String(url).endsWith('/7700'));return Response.json(partial);};
 for(const locale of ['fr','ar']) {
  const metadata=await generateMetadata(props(locale,'7700'));
  assert.equal(metadata.robots.index,true);
  assert.deepEqual(Object.keys(metadata.alternates.languages),['fr','ar']);
 }
 for(const locale of ['en','zh']) {
  const metadata=await generateMetadata(props(locale,'7700'));
  assert.equal(metadata.robots.index,false);
  assert.equal(metadata.alternates.canonical,new URL(productHref(partial,locale),'https://boukirdiamond.com').href);
  assert.equal(metadata.alternates.languages,undefined);
 }
 global.fetch=async url=>{assert.ok(String(url).endsWith('/6696'));return Response.json(product,{status});};
});
test('unknown products are 404 while an API outage remains a server error',async()=>{
 let calls=0;
 global.fetch=async url=>{calls++;assert.ok(String(url).endsWith('/6696'));return Response.json(product,{status});};
 const invalid=await getPublicProduct('abc');
 assert.equal(invalid.status,'invalid');
 assert.equal(calls,0,'invalid route segments must not call the backend');
 status=404;
 assert.equal((await getPublicProduct('6696')).status,'missing');
 await assert.rejects(Page(props('fr','6696')),e=>e.digest?.includes('404'));
 const missingMetadata=await generateMetadata(props('fr','6696'));
 assert.equal(missingMetadata.robots.index,false);
 assert.deepEqual(missingMetadata.alternates,{});
 const missingHtml=renderToStaticMarkup(await Layout({...props('fr','6696'),children:require('react').createElement('p',null,'404')}));
 assert.doesNotMatch(missingHtml,/application\/ld\+json/);
 status=503;
 await assert.rejects(Page(props('fr','6696')),error=>error instanceof ProductBackendUnavailableError && /HTTP 503/.test(error.message));
 await assert.rejects(generateMetadata(props('fr','6696')),error=>error instanceof ProductBackendUnavailableError);
 status=200;
 global.fetch=async url=>{assert.ok(String(url).endsWith('/6696'));return Response.json(product,{status});};
});

test('a public product that is temporarily out of stock remains a 200 product page',async()=>{
 const unavailable={...product,in_stock:false,quantite_disponible:0};
 global.fetch=async()=>Response.json(unavailable);
 const route=await Page(props('fr',productHref(unavailable,'fr').split('/').at(-1)));
 assert.equal(route.props.initialProduct.in_stock,false);
 const metadata=await generateMetadata(props('fr','6696'));
 assert.equal(metadata.robots.index,true);
 assert.equal(metadata.alternates.canonical,'https://boukirdiamond.com/fr/product/6696-membrane-bitume');
 global.fetch=async url=>{assert.ok(String(url).endsWith('/6696'));return Response.json(product,{status});};
});
test('initial HTML describes named variants and their selectable URLs',async()=>{
 const html=renderToStaticMarkup(await Layout({...props('fr','6696'),children:null}));
 const data=JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
 assert.equal(data['@type'],'ProductGroup');
 assert.equal(data.hasVariant[0].name,'Membrane bitume — Vert 4 mm');
 assert.equal(data.hasVariant[0].offers.price,90);
  assert.ok(data.hasVariant[0].url.endsWith('?variant=12-vert-4-mm'));
});

test('variant structured data applies the same promotion as the interface', async()=>{
 const promoted={...product,prix_vente:100,prix_promo:90,pourcentage_promo:10,has_promo:true,
  variants:[{...product.variants[0],prix_vente:120}]};
 global.fetch=async()=>Response.json(promoted);
 const html=renderToStaticMarkup(await Layout({...props('fr','6696'),children:null}));
 const data=JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
 assert.equal(data.hasVariant[0].offers.price,108);
 global.fetch=async url=>{assert.ok(String(url).endsWith('/6696'));return Response.json(product,{status});};
});

test('stock and invalid prices stay accurate in structured product data',async()=>{
 const unavailable={...product,prix_vente:-1,in_stock:false,quantite_disponible:0,variants:[]};
 global.fetch=async()=>Response.json(unavailable);
 const html=renderToStaticMarkup(await Layout({...props('fr','6696'),children:null}));
 const data=JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
  assert.equal(data.offers,undefined);
 global.fetch=async()=>Response.json({...unavailable,prix_vente:0});
 const zeroHtml=renderToStaticMarkup(await Layout({...props('fr','6696'),children:null}));
 const zeroData=JSON.parse(zeroHtml.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
 assert.equal(zeroData.offers,undefined);
 global.fetch=async()=>Response.json({...unavailable,prix_vente:80});
 const availablePriceHtml=renderToStaticMarkup(await Layout({...props('fr','6696'),children:null}));
 const availablePriceData=JSON.parse(availablePriceHtml.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
 assert.equal(availablePriceData.offers.availability,'https://schema.org/OutOfStock');
 global.fetch=async url=>{assert.ok(String(url).endsWith('/6696'));return Response.json(product,{status});};
});
