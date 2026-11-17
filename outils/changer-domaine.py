#!/usr/bin/env python3
"""Remplace l'adresse du site partout (canonical, partage, données structurées, sitemap, robots, llms.txt).

Usage :  python3 outils/changer-domaine.py https://www.mon-domaine.fr

L'adresse actuelle est lue dans outils/domaine.txt, puis mise à jour.
"""
import pathlib, sys

racine = pathlib.Path(__file__).resolve().parent.parent
fichier_domaine = racine / 'outils' / 'domaine.txt'

if len(sys.argv) != 2 or not sys.argv[1].startswith('https://'):
    sys.exit('Usage : python3 outils/changer-domaine.py https://www.mon-domaine.fr')

ancien = fichier_domaine.read_text(encoding='utf-8').strip().rstrip('/')
nouveau = sys.argv[1].strip().rstrip('/')
if ancien == nouveau:
    sys.exit('Le site utilise déjà ' + nouveau)

modifies = 0
for chemin in sorted(racine.rglob('*')):
    if chemin.suffix not in {'.html', '.xml', '.txt'} or '.git' in chemin.parts or chemin == fichier_domaine:
        continue
    texte = chemin.read_text(encoding='utf-8')
    if ancien in texte:
        chemin.write_text(texte.replace(ancien, nouveau), encoding='utf-8')
        modifies += 1
        print('  ' + str(chemin.relative_to(racine)))

fichier_domaine.write_text(nouveau + '\n', encoding='utf-8')
print(f'{modifies} fichiers mis à jour : {ancien} → {nouveau}')
