# Publication des sitemaps et URL produits

Le fichier `/sitemap.xml` devient un index. Les produits sont répartis dans
`/sitemap-products-fr.xml`, `-ar.xml`, `-en.xml` et `-zh.xml` ; les catégories,
marques et autres pages dans `/sitemap-categories.xml`, `/sitemap-brands.xml`
et `/sitemap-pages.xml`. Une famille de plus de 5 000 URL est automatiquement
découpée avec des suffixes `-1`, `-2`, etc. Les quatre hreflang sont conservés.

Les produits utilisent `/{locale}/product/{id}-{nom-localise}`. L'identifiant
évite les collisions ; les noms manquants utilisent la désignation principale.
Les anciennes URL numériques et les noms modifiés redirigent en 308, avec
conservation des paramètres. Les liens catalogue, cartes et recherche utilisent
le même générateur que les canonical et sitemaps. Les liens historiques basés
uniquement sur l'identifiant (commandes, anciens contenus promotionnels) restent
fonctionnels grâce à cette redirection.

Les variantes partagent la fiche du produit : `?variant={id}-{nom-variante}`
permet de sélectionner directement la variante, son image, son prix et son
ajout au panier. La canonical reste celle du produit parent ; les combinaisons
ne sont pas multipliées dans le sitemap. Les données structurées ProductGroup
décrivent leurs noms, identifiants, URL et prix disponibles.

## Ordre de déploiement obligatoire

1. Déployer d'abord `backend/routes/ecommerce/productSitemap.js` et recharger
   l'API. Vérifier que `/api/ecommerce/products/sitemap` fournit `designation`
   et les trois champs de traduction en plus de `id` et `updated_at`.
2. Préserver `NEXT_PUBLIC_SITE_URL=https://boukirdiamond.com` au build et au
   démarrage. Configurer `SITEMAP_CACHE_DIR` sur un dossier persistant et
   accessible en écriture à l'utilisateur du serveur Next.js, par exemple
   `/var/cache/boukir-ecom/sitemaps`. Ne pas placer ce dossier dans une release
   temporaire supprimée à chaque déploiement.
3. Déployer et construire l'e-commerce, puis recharger son service habituel.
4. Ouvrir `/sitemap.xml` pour générer la première copie complète. Exiger HTTP
   200 et `X-Sitemap-Cache: fresh`. Vérifier les sept fichiers référencés,
   les nombres de produits et les redirections des anciennes URL en FR/AR/EN/ZH.

Une copie complète est enregistrée par remplacement atomique sur disque. Elle
est renouvelée après une heure à la prochaine requête. En cas de panne API,
la dernière copie valide reste disponible pendant sept jours maximum ;
`X-Sitemap-Cache: stale` et les logs signalent alors la panne. Après cette limite,
ou sans première copie valide, HTTP 503 avec Retry-After remplace un faux
sitemap vide. Les URL d'une copie ancienne peuvent refléter l'ancien catalogue
pendant la panne : rétablir la génération dès que le statut devient stale.

## Renouvellement périodique sur le VPS

Les unités fournies déclenchent une requête toutes les 30 minutes. Le script
échoue explicitement si le sitemap est servi depuis une copie ancienne. Adapter
le chemin du checkout dans le fichier service si nécessaire. Le timer ne
redémarre aucun service de l'application et ne se connecte pas à la base.

Depuis `/var/www/boukirEcom`, pour installer les unités sur le VPS :

```bash
sudo install -m 644 docs/boukir-sitemap-refresh.service /etc/systemd/system/
sudo install -m 644 docs/boukir-sitemap-refresh.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now boukir-sitemap-refresh.timer
sudo systemctl start boukir-sitemap-refresh.service
sudo journalctl -u boukir-sitemap-refresh.service -n 30 --no-pager
```

L'installation sur le VPS n'a pas été exécutée par la modification locale.
Dans Search Console, conserver l'URL soumise `https://boukirdiamond.com/sitemap.xml`.
Après publication, vérifier les pages avec variantes et le balisage dans le test
des résultats enrichis, puis suivre les redirections et l'indexation. Des URL
descriptives ou un sitemap découpé ne garantissent pas un gain de classement.
