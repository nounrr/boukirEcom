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
const product = {id:6696,designation:'Membrane bitume',designation_ar:'غشاء بيتومين',designation_en:'Bitumen membrane',designation_zh:'沥青膜',prix_vente:80,variants:[{id:12,variant_name:'Vert 4 mm',color_name:'Vert',prix_vente:90,available:true}]};
let status = 200;
global.fetch = async url => { assert.ok(String(url).endsWith('/6696')); return Response.json(product,{status}); };
const props = (locale,id,query={}) => ({params:Promise.resolve({locale,id}),searchParams:Promise.resolve(query)});

test('legacy and outdated slugs redirect permanently, retaining variants and campaign parameters in all languages', async()=>{
 for(const locale of ['fr','ar','en','zh']) {
  const target=productHref(product,locale);
  for(const id of ['6696','6696-old-name']) await assert.rejects(Page(props(locale,id,{variant:'12-vert-4-mm',utm_source:'test'})),e=>e.digest?.includes('308')&&e.digest.includes(target+'?variant=12-vert-4-mm&utm_source=test'));
  assert.ok(await Page(props(locale,target.split('/').at(-1))));
  const metadata=await generateMetadata(props(locale,'6696'));
  for(const l of ['fr','ar','en','zh']) assert.equal(metadata.alternates.languages[l],new URL(productHref(product,l),'https://boukirdiamond.com').href);
 }
});
test('unknown products are 404 while an API outage remains a server error',async()=>{
 status=404; await assert.rejects(Page(props('fr','6696')),e=>e.digest?.includes('404'));
 status=503; await assert.rejects(Page(props('fr','6696')),/Product API HTTP 503/);
 status=200;
});
test('initial HTML describes named variants and their selectable URLs',async()=>{
 const html=renderToStaticMarkup(await Layout({...props('fr','6696'),children:null}));
 const data=JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
 assert.equal(data['@type'],'ProductGroup');
 assert.equal(data.hasVariant[0].name,'Membrane bitume — Vert 4 mm');
 assert.equal(data.hasVariant[0].offers.price,90);
 assert.ok(data.hasVariant[0].url.endsWith('?variant=12-vert-4-mm'));
});
