# Portfolio Paul Balcon

Site statique (HTML, CSS, JavaScript), sans framework ni étape de build.

## Lancer le site en local

Les chemins commencent par `/` (par exemple `/style.css`) : ouvrir `index.html` en double-cliquant ne suffit pas, il faut un petit serveur.

```bash
cd portfolio
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Organisation

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil |
| `projets/<nom>/index.html` | Une page par projet (13), déjà remplie pour Google |
| `app.js` | Contenu des projets (`PROJECTS`), ordre (`PROJECT_ORDER`), certificats (`CERTIFICATES`), navigation, fenêtres CV et certificats |
| `style.css` | Mise en forme |
| `assets/` | Images, vidéos, CV, pitch MELO, présentation NeoTravel, soutenance Relève |
| `certificates/` | Images des certificats |
| `sitemap.xml`, `robots.txt` | Référencement |
| `llms.txt` | Résumé du profil et des projets pour les assistants IA |
| `og/` | Images d'aperçu de partage (1200 × 630), une par page |
| `fonts/` | Polices DM Sans et Manrope (hébergées sur le site, licence OFL) |
| `mentions-legales/`, `404.html` | Mentions légales et page d'erreur |
| `netlify.toml` | Cache, en-têtes de sécurité et fichiers non publiés sur Netlify |
| `outils/changer-domaine.py` | Remplace l'adresse du site partout en une commande |

Les textes d'un projet existent à deux endroits : dans `projets/<nom>/index.html` et dans `PROJECTS` (`app.js`). Une modification doit être faite aux deux.

## Mettre en ligne

Le site est prévu pour Netlify (`netlify.toml`) : relier le dépôt GitHub, sans commande de build, dossier publié `.`.

Quand le domaine définitif est choisi, une seule commande met à jour toutes les adresses (canonical, aperçus de partage, données structurées, sitemap, robots, llms.txt) :

```bash
python3 outils/changer-domaine.py https://www.mon-domaine.fr
```

## Images

Les visuels des projets font 1600 px de large au maximum (WebP qualité 82). Garder ce format pour les nouvelles images, et créer l'aperçu de partage du projet dans `og/<nom>.jpg` (1200 × 630).

## Historique

- Version d'origine : site généré avec ChatGPT, récupéré le 12/10/2026 depuis https://paul-balcon-design.poulepaul.chatgpt.site/ (premier commit, fichiers identiques à la production).
- Retrait du script Cloudflare ajouté par l'hébergeur ChatGPT.
- Plus de cadre de couleur autour des titres et des sections qui reçoivent le focus par script.
