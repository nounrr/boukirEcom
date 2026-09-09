# Origine publique des URL SEO

L'origine est centralisée dans `src/lib/seo/urls.ts`, réexportée par `metadata.ts`.
Les canonical, alternates, Open Graph, images Twitter, sitemaps et schémas utilisent
cette configuration. Le contenu éditorial, les prix et l'inventaire du sitemap
ne sont pas modifiés par cette correction.

## Configuration de production

Définir dans l'environnement du **build et du serveur** :

```dotenv
NEXT_PUBLIC_SITE_URL=https://boukirdiamond.com
```

Cette valeur est une origine uniquement : sans `/fr`, chemin, identifiants,
paramètres ou fragment. HTTPS et un hôte public sont obligatoires en production.
Une valeur absente/invalide arrête explicitement le build ou le démarrage,
sans imprimer la valeur de configuration reçue.

Les variables `NEXT_PUBLIC_*` sont incorporées lors du build Next.js : changer
uniquement l'environnement du serveur ne remplace pas un build déjà produit.
Recompiler puis redémarrer avec la même origine. Conserver les autres variables
du déploiement, notamment l'API et l'authentification, sans copier le `.env` local.

En développement, l'absence de valeur utilise `http://localhost:3002`, port du
script `npm run dev`. Une valeur explicitement invalide est aussi signalée.

`NEXT_PUBLIC_API_URL` configure les appels API et reste indépendante. Les images
relatives sont publiées sous l'origine du site ; les anciennes URL d'images
localhost et les variantes HTTP/www du même domaine sont normalisées vers cette
origine. Un CDN externe HTTPS explicite est préservé. Une image externe HTTP ou
un schéma non HTTP(S) est omis (logo de repli pour les partages).
Si les uploads sont servis ailleurs, fournir leur URL HTTPS publique complète.

`localizedPath` génère `/fr`, `/ar`, `/en`, `/zh` et des chemins sans slash final,
conformément au comportement Next actuel. Un préfixe de langue déjà présent est
remplacé sans duplication. Les pages de langue restent directement accessibles.

## Vérifications

Depuis `ecom`, avec Node 24 :

```powershell
node --test tests/seo-urls.test.mjs
$env:NEXT_PUBLIC_SITE_URL='https://boukirdiamond.com'
# Conserver ici une configuration API opérationnelle pour les fiches réelles.
npm run build
npm run start -- -p 3012
```

Dans un second terminal :

```powershell
node scripts/check-seo-urls.mjs --base=http://127.0.0.1:3012 --output=../docs/seo-2026-09-08/correction-01-local.json
```

Le contrôle lit le HTML HTTP complet (sans hydratation) de 14 pages : accueil,
boutique, contact et produits 6376/6696 en FR/AR, plus accueil et produit 6376
en EN/ZH. Il vérifie les réponses directes, canonical, quatre alternates,
Open Graph, Twitter, URL JSON-LD, robots et sitemap. Il exige que les vrais
produits et leurs schémas chargent ; une page « produit introuvable » ne passe pas.

Après déploiement, relancer contre le site public :

```powershell
node scripts/check-seo-urls.mjs --base=https://boukirdiamond.com --output=../docs/seo-2026-09-08/correction-01-production.json
```

`--record-only` conserve les défauts dans un relevé sans code de sortie en échec ;
c'est uniquement destiné à une capture de référence, pas à la recette.

Le succès local ne prouve pas le déploiement. Vérifier ensuite les URL publiques
dans Search Console et demander une nouvelle exploration si l'accès est disponible.
La redirection www et la configuration CORS relèvent du lot suivant.

Références : [métadonnées Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
et [variables d'environnement Next.js](https://nextjs.org/docs/app/guides/environment-variables).
