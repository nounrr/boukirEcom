# Build et démarrage en production

Dans `/var/www/boukirEcom`, la commande suivante fixe explicitement les deux
origines et prend le pas sur une ancienne valeur présente dans l'environnement :

```bash
NEXT_PUBLIC_SITE_URL=https://boukirdiamond.com NEXT_PUBLIC_API_URL=https://boukirdiamond.com npm run build
```

Ajouter ou remplacer ces deux lignes dans `.env.production`, sans effacer les
autres paramètres du fichier, et dans l'environnement du service e-commerce :

```dotenv
NEXT_PUBLIC_SITE_URL=https://boukirdiamond.com
NEXT_PUBLIC_API_URL=https://boukirdiamond.com
```

Une variable déjà exportée dans le shell ou le gestionnaire de processus prime
sur le fichier `.env.production` : corriger aussi cette valeur si elle existe.
`NEXT_PUBLIC_SITE_URL` doit être une origine HTTPS, sans chemin `/fr` ou `/api`,
ni paramètres. Ne pas utiliser localhost en production.

Après un build réussi, redémarrer le service e-commerce avec son gestionnaire
habituel et l'environnement corrigé. Pour un démarrage manuel avec les mêmes
valeurs et le port configuré par l'hébergement :

```bash
NEXT_PUBLIC_SITE_URL=https://boukirdiamond.com NEXT_PUBLIC_API_URL=https://boukirdiamond.com npm run start
```

Le démarrage manuel reste au premier plan ; conserver le gestionnaire de service
existant pour l'exploitation. Ne pas lancer un second processus sur son port.
Vérifier ensuite la page `/fr/shop` et les journaux du service si Nginx répond 502.

Le message `baseline-browser-mapping` est un avertissement distinct : mettre ce
paquet à jour ne corrige pas l'erreur `NEXT_PUBLIC_SITE_URL`. Le build local du
lot 04 a réussi malgré cet avertissement. Aucun `npm audit fix` n'a été exécuté.

Pour le sitemap complet, déployer également les endpoints backend des lots 03/04
et résoudre la migration de publication des services décrite dans le rapport 03.
Les pages catégories utilisent les endpoints catalogue déjà existants ; le nouvel
endpoint `/api/ecommerce/products/catalog-pages` sert au comptage du sitemap.
