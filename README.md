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

Les textes d'un projet existent à deux endroits : dans `projets/<nom>/index.html` et dans `PROJECTS` (`app.js`). Une modification doit être faite aux deux.

## Mettre en ligne

N'importe quel hébergeur de site statique convient (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Il faut publier le dossier tel quel, à la racine du domaine, sans commande de build.

Avant la mise en ligne sur un nouveau domaine, remplacer `https://paul-balcon-design.poulepaul.chatgpt.site` par la nouvelle adresse dans tous les fichiers HTML, dans `sitemap.xml` et dans `robots.txt`.

## Historique

- Version d'origine : site généré avec ChatGPT, récupéré le 12/10/2026 depuis https://paul-balcon-design.poulepaul.chatgpt.site/ (premier commit, fichiers identiques à la production).
- Retrait du script Cloudflare ajouté par l'hébergeur ChatGPT.
- Plus de cadre de couleur autour des titres et des sections qui reçoivent le focus par script.
