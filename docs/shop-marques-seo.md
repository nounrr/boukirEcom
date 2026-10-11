# Marques dans le Shop

Une marque ouvre désormais `/{locale}/shop?brand_id={id}`. Par exemple,
INGCO ouvre `/fr/shop?brand_id=8`, avec le filtre coché et les mêmes cartes,
actions et contrôles que le Shop général.

Les anciennes URL `/{locale}/marques/{slug}` redirigent définitivement (308)
vers le Shop filtré. La langue, la pagination, les autres filtres et les
paramètres de campagne sont conservés. Les liens internes utilisent directement
la nouvelle destination.

Une sélection contenant uniquement une marque connue possède son propre titre,
sa description éditoriale, son canonical et ses alternates dans les quatre
langues. Elle est indexable lorsqu'elle contient des produits. La pagination
conserve le filtre et son canonical. Les combinaisons de filtres restent noindex.
Les URL de marques sont publiées dans le sitemap des marques ; les filtres
arbitraires ne sont pas admis dans les sitemaps.

Le déploiement doit inclure ensemble les routes Shop, les redirections, les liens
et le générateur de sitemap pour éviter des destinations incohérentes. Le cache
du sitemap se renouvelle automatiquement sous une heure lorsque l'API fonctionne.
Google doit ensuite réexplorer les anciennes et nouvelles URL ; le changement
n'assure pas une position particulière dans les résultats.

## Fiches produit

Les titres mentionnent le produit, sa marque lorsqu'elle est renseignée et
Tanger dans la langue courante. Les descriptions de moins de 60 caractères
sont complétées par un texte fondé sur le nom, la catégorie et la ville ;
les descriptions détaillées sont conservées. Cette correction ne crée pas de
caractéristiques techniques. Des descriptions précises doivent être renseignées
dans les fiches pour améliorer leur contenu.

## Validation

Depuis `ecom` :

```powershell
node --test tests/brand-shop.test.cjs tests/shop-pagination.test.cjs tests/catalog-pages.test.cjs tests/sitemap-publication.test.cjs tests/product-seo-text.test.cjs tests/product-routes.test.cjs tests/product-initial-html.test.cjs
```

Dans le navigateur, vérifier une ancienne page marque, décocher la marque,
puis sélectionner INGCO : l'URL, le titre, la case cochée et les produits doivent
suivre la sélection sans quitter le Shop.
