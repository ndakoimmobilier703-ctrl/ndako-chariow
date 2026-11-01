# Document d'Exigences Fonctionnelles

## 1. Vue d'Ensemble de l'Application

### 1.1. Nom de l'Application
Ndako

### 1.2. Description de l'Application
Ndako est une plateforme web d'annonces de location immobilière couvrant 5 pays d'Afrique (Congo, Côte d'Ivoire, Sénégal, Cameroun, Bénin). Elle permet aux bailleurs et agents immobiliers de publier des biens en mode payant ou avec code promotionnel, aux visiteurs de rechercher des logements, de consulter et publier des avis vérifiés, et d'entrer en contact direct par WhatsApp ou appel téléphonique sécurisé. La plateforme comprend un panneau d'administration pour la modération, la personnalisation visuelle avancée, la gestion des codes promo, la gestion granulaire et collective des bannières promotionnelles et publications publiques, le suivi réel et en temps réel de l'audience et des interactions, ainsi que la modération des avis.

---

## 2. Utilisateurs et Cas d'Utilisation

### 2.1. Utilisateurs Cibles
- **Visiteurs / Chercheurs de Logement** : Recherchent des biens en location, consultent les fiches, visualisent ou masquent les annonces promotionnelles, publient des avis et contactent les annonceurs.
- **Annonceurs / Bailleurs / Agents** : Déposent et gèrent leurs annonces de location lorsque la publication est activée, en bénéficiant des codes promotionnels diffusés sur les bannières actives.
- **Administrateur** : Supervise les annonces, les avis, les codes promo, l'apparence graphique, active ou désactive individuellement ou collectivement les bannières d'annonces (barre flash supérieure et bannière d'offre d'accueil) ainsi que le bouton de publication, et analyse les statistiques d'audience en temps réel.

### 2.2. Cas d'Utilisation Principaux
- **Recherche, Consultation et Affichage Promotionnel** : Le visiteur recherche un bien avec filtres, consulte les fiches détaillées, prend contact via WhatsApp/appel direct et consulte les offres promotionnelles actives qu'il peut masquer localement.
- **Publication d'Annonce** : L'annonceur renseigne les caractéristiques de son logement, applique un code promotionnel valide (ex. codes mis en avant sur les bannières) et valide sa formule de publication.
- **Administration et Contrôle des Bannières** : L'administrateur active/désactive directement chaque bannière promotionnelle (barre flash orange, bannière bleue d'accueil) ou l'ensemble des bannières en un clic depuis le tableau de bord, la gestion des publications et la gestion des codes promo, avec répercussion instantanée et persistante.

---

## 3. Structure des Pages et Description des Fonctionnalités

### 3.1. Arborescence de l'Application

```
Application Web Ndako
├── 1.0 Page d'Accueil
│   ├── 1.1 Barre d'Annonce Flash Supérieure (Orange)
│   ├── 1.2 En-tête & Navigation
│   ├── 1.3 Bannière d'Offre Promotionnelle d'Accueil (Bleue)
│   └── 1.4 Catalogue & Biens en Vedette
├── 2.0 Page Catalogue & Recherche
├── 3.0 Page Détail de l'Annonce (avec Avis & Commentaires)
├── 4.0 Parcours de Publication d'Annonce
│   ├── 4.1 Étape 1 : Informations sur le Bien (Nombre de chambres)
│   ├── 4.2 Étape 2 : Localisation
│   ├── 4.3 Étape 3 : Tarification & Coordonnées
│   ├── 4.4 Étape 4 : Durée, Code Promo & Paiement
│   └── 4.5 Étape 5 : Confirmation
└── 5.0 Panneau de Contrôle Central Administrateur (/admin)
    ├── 5.1 Connexion Sécurisée
    ├── 5.2 Tableau de Bord Général (avec Contrôles Rapides des Bannières)
    ├── 5.3 Gestion des Annonces
    ├── 5.4 Modération des Avis & Commentaires
    ├── 5.5 Gestion des Codes Promotionnels (avec Contrôles des Bannières Associées)
    ├── 5.6 Analyse des Visiteurs (Données Réelles)
    ├── 5.7 Traçabilité & Comportement en Temps Réel (Données Réelles)
    ├── 5.8 Suivi des Transactions
    └── 5.9 Paramètres Généraux & Personnalisation
        ├── 5.9.1 Configuration Générale & Contacts
        ├── 5.9.2 Gestion des Publications & Bannières Promotionnelles
        ├── 5.9.3 Personnalisation Visuelle Complète & Style
        ├── 5.9.4 Notifications & Alertes
        ├── 5.9.5 Identifiants & Sécurité
        └── 5.9.6 Sauvegarde & Maintenance
```

### 3.2. Spécifications Détaillées des Pages

#### Directives Globales de Design & Style
- **Typographie & Rendu** : Police Roboto appliquée de manière homogène.
- **Logo Officiel** : Intégration du logo officiel (https://miaoda-conversation-file.s3cdn.medo.dev/user-ezcyxap9ijgg/app-ezdypxs5wge9/20261010/file_0000000057d082438752714fcf2f37a8.png).
- **Gestion Dynamique des Thèmes** : Application immédiate des styles personnalisés enregistrés par l'administrateur.

#### 1.0 Page d'Accueil
- **1.1 Barre d'Annonce Flash Supérieure (Orange)** :
  - Affichage conditionnel assujetti au commutateur administrateur dédié.
  - Contenu textuel promotionnel mettant en avant le code promo (ex. « Bienvenue sur Ndako ! Utilisez le code promo CONGO2026 pour publier votre annonce gratuitement »).
  - Bouton de fermeture/masquage direct (croix) permettant au visiteur de fermer la barre pour sa session en cours.
- **1.2 En-tête (Header)** :
  - Logo officiel avec redirection vers l'accueil.
  - Accès administrateur masqué (déclenché par triple-clic rapide sur le logo).
  - Menu de navigation principal.
  - Bouton « Publier une annonce » (visible/masqué dynamiquement selon le paramètre administrateur de publication).
- **1.3 Bannière d'Offre Promotionnelle d'Accueil (Bleue)** :
  - Affichage conditionnel assujetti au commutateur administrateur dédié.
  - Bloc d'offre promotionnelle (ex. « OFFRE PROMOTIONNELLE NDAKO / code NDAKO-BIENVENUE ») avec descriptif des avantages et bouton d'action vers le dépôt d'annonce.
  - Bouton de fermeture/masquage direct permettant au visiteur de masquer le bloc.
- **1.4 Bannière Héro, Recherche Rapide & Biens** :
  - Filtres rapides : Pays (Congo, Côte d'Ivoire, Sénégal, Cameroun, Bénin), ville, type de bien, nombre de chambres et budget maximum.
  - Cartes d'annonces affichant photo, loyer en FCFA, nombre de chambres, localisation, note moyenne et boutons de contact.

#### 2.0 Page Catalogue & Recherche
- **Filtres Avancés** : Pays (5 pays gérés), ville, quartier, type de bien, nombre de chambres, fourchette de loyer en FCFA, équipements, caution.
- **Grille de Résultats** : Affichage des fiches immobilières à jour avec note moyenne réelle, tri et pagination.

#### 3.0 Page Détail de l'Annonce
- **Galerie d'Images & Détails** : Photos, caractéristiques complètes (dont nombre de chambres), loyer, caution, adresse et descriptif.
- **Bloc de Contact Sécurisé** : Bouton WhatsApp direct et bouton Appel avec modal obligatoire d'avertissement anti-fraude.
- **Section Avis et Commentaires** : Note moyenne, liste des avis réels, bouton de signalement, formulaire de dépôt avec assainissement.

#### 4.0 Parcours de Publication d'Annonce
- **Contrôle d'Accès** : Redirection automatique vers l'accueil avec message d'information si la publication est désactivée par l'administrateur.
- **4.1 Étape 1 : Informations sur le Bien** : Type de bien, titre, superficie, nombre de chambres, commodités, téléversement de photos.
- **4.2 Étape 2 : Localisation** : Pays (parmi les 5 autorisés), ville, quartier, adresse.
- **4.3 Étape 3 : Tarification & Coordonnées** : Loyer en FCFA, caution, numéros WhatsApp et appel direct, description.
- **4.4 Étape 4 : Durée, Code Promo & Paiement** : Choix de formule, champ de saisie du code promo avec validation instantanée (validité, quota, statut), application de la réduction ou poursuite en paiement normal.
- **4.5 Étape 5 : Confirmation** : Numéro de dossier, formule et date d'expiration.

#### 5.0 Panneau de Contrôle Central Administrateur (/admin)
- **5.1 Connexion Sécurisée** : Interface d'authentification administrateur.
- **5.2 Tableau de Bord Général** :
  - Métriques consolidées en direct (annonces actives, transactions, avis récents, statistiques du jour).
  - **Bloc de Contrôle Rapide des Bannières Promotionnelles** :
    - Commutateur direct pour la barre flash orange supérieure.
    - Commutateur direct pour la bannière bleue d'offre d'accueil.
    - Boutons d'action globale « Tout activer » et « Tout désactiver » pour les bannières d'annonces en un clic.
    - Indicateurs d'état en direct (Active / Masquée) persistés en base de données.
- **5.3 Gestion des Annonces** : Liste filtrable par statut, validation, suspension, modification (incluant nombre de chambres), suppression.
- **5.4 Modération des Avis & Commentaires** : Traitement des avis signalés et modération.
- **5.5 Gestion des Codes Promotionnels** :
  - Génération de codes, configuration de dates, quotas et statut actif/inactif.
  - **Commandes de liaison promotionnelle** : Boutons de contrôle direct pour activer ou désactiver les bannières associées aux codes promo (barre flash orange et bannière bleue d'accueil) sans quitter le module des codes.
  - Tableau de suivi des codes avec utilisations consommées et état des bannières de diffusion.
- **5.6 Analyse des Visiteurs (Données Réelles)** : Volumes de visites réelles, répartition géographique et temporelle.
- **5.7 Traçabilité & Comportement en Temps Réel (Données Réelles)** : Tableau exhaustif des clics et actions effectives par bouton/fonctionnalité, actualisation à la seconde sans rechargement.
- **5.8 Suivi des Transactions** : Historique des paiements et forfaits associés.
- **5.9 Paramètres Généraux & Personnalisation** :
  - **5.9.1 Configuration Générale & Contacts** : Contacts, devises, identité du site.
  - **5.9.2 Gestion des Publications & Bannières Promotionnelles** :
    - **Contrôle de la Barre Flash Orange Supérieure** : Commutateur Activer/Désactiver dédié avec persistance en base de données.
    - **Contrôle de la Bannière Bleue d'Offre d'Accueil** : Commutateur Activer/Désactiver dédié avec persistance en base de données.
    - **Commandes Collectives des Bannières** : Boutons « Activer toutes les bannières promotionnelles » et « Désactiver toutes les bannières promotionnelles » permettant une modification synchronisée en un clic.
    - **Contrôle du Bouton « Publier une annonce »** : Commutateur Activer/Désactiver indépendant. Lorsque désactivé, le bouton est masqué et tout accès aux URLs de publication est bloqué.
    - Tarification des forfaits de publication et mode de validation.
  - **5.9.3 Personnalisation Visuelle Complète & Style** : Couleurs principales, secondaires, boutons, textes, prévisualisation et restauration.
  - **5.9.4 Notifications & Alertes** : Textes des messages flash et avertissements.
  - **5.9.5 Identifiants & Sécurité** : Modification de l'email et du mot de passe via Supabase Auth, avec session administrateur vérifiée côté serveur.
  - **5.9.6 Sauvegarde & Maintenance** : Export des données et état du système.

---

## 4. Règles Métier et Logique Centrale

1. **Contrôle Granulaire et Collectif des Bannières Promotionnelles** :
   - La barre flash orange supérieure et la bannière bleue d'offre d'accueil possèdent chacune leur propre état booléen (`true`/`false`) persisté en base de données.
   - L'administrateur peut modifier l'état individuel de chaque bannière depuis le Tableau de bord, la Gestion des codes promotionnels et la Gestion des publications.
   - Les boutons d'action collective (« Tout activer » / « Tout désactiver ») basculent simultanément les deux bannières dans l'état demandé et enregistrent immédiatement la configuration.
2. **Persistance Immédiate et Répercussion Publique** :
   - Tout changement d'état d'une bannière côté administration est enregistré instantanément en base de données et se reflète immédiatement sur l'interface publique de la page d'accueil sans nécessiter de redémarrage de l'application.
   - La désactivation d'une bannière masque uniquement son affichage visuel sans supprimer le code promotionnel ni les données sous-jacentes.
3. **Gestion des Boutons de Fermeture Côté Visiteur** :
   - Le clic sur la croix de fermeture d'une bannière par un visiteur masque l'élément pour sa session de navigation sans altérer l'état global configuré par l'administrateur en base de données.
4. **Indépendance Vis-à-Vis de la Publication d'Annonces** :
   - Le statut d'affichage des bannières promotionnelles et le statut du bouton global « Publier une annonce » fonctionnent de manière totalement autonome et indépendante.
5. **Intégrité de la Traçabilité en Temps Réel** :
   - Toutes les statistiques de clics et d'actions proviennent exclusivement d'interactions réelles enregistrées côté serveur, actualisées à la seconde.
6. **Sécurité et Code de Déverrouillage Administrateur** :
   - L'accès aux paramètres de sécurité exige la saisie préalable du code une session administrateur Supabase Auth valide.

---

## 5. Exceptions et Cas Limites

| Scénario | Comportement du Système |
| :--- | :--- |
| Désactivation de la barre flash orange seule | Masquage immédiat de la barre supérieure orange sur la page d'accueil ; la bannière bleue d'accueil reste visible si son état est actif. |
| Désactivation de la bannière bleue d'accueil seule | Masquage immédiat du bloc d'offre bleue sur la page d'accueil ; la barre flash supérieure orange reste visible si son état est actif. |
| Clic sur « Tout désactiver » dans l'administration | Masquage instantané des deux bannières promotionnelles sur la page d'accueil et enregistrement des deux statuts à inactif en base de données. |
| Clic sur « Tout activer » dans l'administration | Réaffichage instantané des deux bannières promotionnelles sur la page d'accueil et enregistrement des deux statuts à actif en base de données. |
| Visiteur fermant une bannière active via le bouton croix | Masquage du composant pour la session du visiteur sans modification du paramètre administrateur en base de données. |
| Tentative d'accès à la publication lorsque le bouton publier est désactivé | Blocage côté serveur et redirection vers l'accueil avec message explicatif, indépendamment de l'état des bannières promotionnelles. |

---

## 6. Critères d'Acceptation

1. L'administrateur peut activer ou désactiver individuellement la barre flash orange supérieure depuis le Tableau de bord, la Gestion des publications et la Gestion des codes promo, avec répercussion visuelle immédiate et persistance en base de données.
2. L'administrateur peut activer ou désactiver individuellement la bannière bleue d'offre promotionnelle d'accueil depuis le Tableau de bord, la Gestion des publications et la Gestion des codes promo, avec répercussion visuelle immédiate et persistance en base de données.
3. L'administrateur dispose de commandes d'action collective (« Tout activer » / « Tout désactiver ») permettant de basculer l'ensemble des bannières promotionnelles en une seule action persistée.
4. La page d'accueil affiche un bouton de fermeture direct sur chaque bannière active, permettant au visiteur de la masquer localement.
5. Le commutateur de publication d'annonces et les commutateurs des bannières promotionnelles fonctionnent de manière autonome sans interférence mutuelle.
6. Le tableau de traçabilité affiche les clics et actions effectives réelles avec actualisation en temps réel à chaque seconde.
7. La modification des identifiants administrateur est effectuée via Supabase Auth et contrôlée par le rôle administrateur en base de données.

---

## 7. Fonctionnalités Hors Périmètre pour cette Phase

- Messagerie instantanée intégrée interne (redirection exclusive vers WhatsApp et appel téléphonique direct).
- Module de vente immobilière (plateforme réservée exclusivement à la location).
- Prélèvement bancaire automatique récurrent des loyers mensuels locataires.
- Signature électronique certifiée de contrats de bail.