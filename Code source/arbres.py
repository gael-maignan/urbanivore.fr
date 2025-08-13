import json
import re

ville = 'm'

def extraire_genre_espece(essence):
    """Extrait le genre et l'espèce à partir d'une chaîne de type 'Acer campestre (planté en 1980)'"""
    if not isinstance(essence, str):
        return None, None
    # Supprimer les parenthèses et ce qu'elles contiennent
    essence = re.sub(r"\(.*?\)", "", essence).strip()
    # Découper en mots
    mots = essence.split()
    if len(mots) >= 2:
        return mots[0], mots[1]
    elif len(mots) == 1:
        return mots[0], ""
    else:
        return None, None

def ajouter_genre_espece(chemin_entree, chemin_sortie):
    essence = "nom_latin" #essence pour grenoble (si_essence pous strasbourg) #nom_latin pour montpelier
    
    with open(chemin_entree, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if data.get("type") != "FeatureCollection":
        print("⚠️ Le fichier n'est pas une FeatureCollection.")
        return

    for feature in data.get("features", []):
        properties = feature.get("properties", {})
        essence = properties.get(essence, None)

        genre, espece = extraire_genre_espece(essence)
        if genre:
            properties["genre"] = genre
        if espece:
            properties["espece"] = espece

    # Écriture du fichier modifié
    with open(chemin_sortie, 'w', encoding='utf-8') as f_out:
        json.dump(data, f_out, ensure_ascii=False, indent=2)
    
    print(f"✅ Fichier modifié écrit dans : {chemin_sortie}")

# Exemple d'utilisation :
if __name__ == "__main__":
    entree = "DATA_"+ville+".geojson"        # Remplace par ton fichier d'entrée
    sortie = "DATA_"+ville + ".geojson"  # Nom du fichier modifié
    #ajouter_genre_espece(entree, sortie)






import json
import csv

# Charger la table de traduction depuis le CSV
def charger_traductions(fichier_csv):
    traductions = {}
    with open(fichier_csv, mode='r', encoding='latin-1') as f:
        lecteur = csv.DictReader(f, delimiter=';')
        for ligne in lecteur:
            genre = ligne['Genre'].strip()
            espece = ligne['espèce'].strip()
            nom_fr = ligne['Nom français'].strip()
            comestible = (ligne.get('Comestible') or '').strip().lower()
            traductions[(genre, espece)] = {
                'nom_fr': nom_fr,
                'comestible': comestible if comestible else None
            }
    return traductions

# Ajouter le nom français à chaque arbre dans le GeoJSON
def ajouter_noms_francais(fichier_geojson, traductions, sortie_geojson):
    with open(fichier_geojson, mode='r', encoding='utf-8') as f:
        donnees = json.load(f)

    nouvelles_features = []
    for feature in donnees['features']:
        props = feature.get('properties', {})
        genre = (props.get('genre') or '').strip()
        espece = (props.get('espece') or '').strip()

        info = traductions.get((genre, espece))
        if not info:
            continue  # espèce non traduite → exclue

        nom_fr = info['nom_fr']
        comestible = info['comestible']
        

        if comestible is None:
            # Comestibilité non renseignée → exclure complètement
            nom_fr += " !"  # ajouter un point d'exclamation
            print(nom_fr)
            continue
            
        elif comestible == 'false':
            continue

        # Mise à jour des propriétés
        feature['properties'] = {
            'genre': genre,
            'espece': espece,
            'libellefrancais': nom_fr
        }
        nouvelles_features.append(feature)

    # Écriture du GeoJSON filtré et enrichi
    donnees['features'] = nouvelles_features
    with open(sortie_geojson, mode='w', encoding='utf-8') as f:
        json.dump(donnees, f, ensure_ascii=False, indent=2)

# Utilisation
traductions = charger_traductions('traduction.csv')

ajouter_noms_francais('DATA_'+ville+'.geojson', traductions, ville+'.geojson')






import json
from collections import Counter
from pprint import pprint

def afficher_structure_geojson(chemin_fichier):
    with open(chemin_fichier, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("🔍 Type de l'objet racine :", data.get("type", "Inconnu"))

    if data.get("type") == "FeatureCollection":
        features = data.get("features", [])
        print(f"📦 Nombre de features : {len(features)}\n")

        if features:
            print("🔑 Exemple de propriétés d'une feature :")
            pprint(features[0].get("properties", {}), indent=2)

            # Compter les types de géométries
            geometries = [feat.get("geometry", {}).get("type", "Inconnu") for feat in features]
            geo_counter = Counter(geometries)
            print("\n🗺️ Types de géométrie présents :")
            for geo_type, count in geo_counter.items():
                print(f"  - {geo_type}: {count} fois")

            # Lister toutes les clés de propriétés rencontrées
            all_keys = set()
            for feat in features:
                all_keys.update(feat.get("properties", {}).keys())
            print("\n🧩 Clés de propriétés rencontrées :")
            for key in sorted(all_keys):
                print(f"  - {key}")

            # Affichage complet de la première feature
            print("\n📍 Première feature complète :")
            pprint(features[0], indent=2)


            clef = "essence"
            # Extraire et afficher toutes les valeurs de la clé "essence"
            print("\n🌳 Valeurs uniques pour la clé : ", clef)
            essences = [feat.get("properties", {}).get(clef) for feat in features if clef in feat.get("properties", {})]
            essence_uniques = sorted(set(filter(None, essences)))
            for val in essence_uniques:
                print(f"  - {val}")
            if not essence_uniques:
                print("  ⚠️ Aucune valeur trouvée pour la clé 'essence'.")

        else:
            print("⚠️ Aucun feature dans le fichier.")
    else:
        print("⚠️ Ce fichier GeoJSON n'est pas une FeatureCollection.")

# Exemple d'utilisation :
if __name__ == "__main__":
    chemin = "DATA_"+ville+".geojson"  # ← Remplace ceci par ton fichier GeoJSON
    afficher_structure_geojson(chemin)

