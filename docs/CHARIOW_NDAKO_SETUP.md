# Intégration Chariow — Ndako

## Fonctionnement

- Tous les paiements de publication payante sont créés côté serveur par `start-chariow-checkout`.
- Le serveur relit le tarif actif dans `publication_plans`, sélectionne le produit Chariow associé et vérifie son prix publié avant de lancer le paiement.
- Le produit Chariow doit être publié, de type `license`, à paiement unique fixe en XOF, sans variantes de prix. Les produits License permettent les achats répétés dans l'API Chariow.
- L'annonce et la transaction sont créées avec le statut `pending_payment` / `pending`. Le navigateur ne peut pas écrire directement dans `listings` ou `transactions`.
- La fonction `chariow-pulse` vérifie la signature HMAC-SHA256 sur le corps brut, puis appelle une fonction SQL transactionnelle qui contrôle la référence, le produit, l'identifiant de vente, le montant et la devise. Elle traite chaque livraison une seule fois.
- Une annonce payante devient visible uniquement après un Pulse `successful.sale` valide. Les événements `failed.sale` et `abandoned.sale` échouent la transaction et expirent le brouillon.
- Le retour de paiement ne lit plus directement la table `transactions` : `get-chariow-payment-status` renvoie uniquement les champs publics nécessaires.
- Le mode gratuit et les codes promotionnels passent par `create-free-listing`, qui revérifie le mode, le tarif et le code côté serveur. Les codes promotionnels ne peuvent être consommés qu'une seule fois par opération validée et leur compteur est incrémenté de manière atomique.
- Les endpoints de publication appliquent une limite de 5 tentatives par adresse IP sur 15 minutes. L'adresse IP est hachée avant stockage.
- Les anciennes transactions sont conservées. Les nouvelles transactions portent `provider = chariow` ou `provider = ndako_free`.

## Tarifs Ndako actuels

| Identifiant de formule | Nom du produit Chariow | Prix | Durée |
|---|---|---:|---:|
| `plan_1_week` | Ndako — Publication 7 jours | 500 XOF | 7 jours |
| `plan_2_weeks` | Ndako — Publication 14 jours | 1 000 XOF | 14 jours |
| `plan_1_month` | Ndako — Publication 30 jours | 3 000 XOF | 30 jours |

Les prix Chariow doivent être définis en XOF et correspondre exactement aux tarifs Ndako. Si l'administrateur modifie un prix dans Ndako, le produit Chariow correspondant doit aussi être modifié avant la remise en service des paiements. Le code bloque un checkout si les deux tarifs ne correspondent pas.

## Configuration Chariow

1. Dans Chariow, créer trois produits distincts avec les noms et les montants du tableau ci-dessus.
2. Choisir le type **License**, un paiement unique fixe en XOF, sans variantes de prix, puis publier chaque produit.
3. Les produits License autorisent les achats répétés via l'API, mais chaque vente peut générer une clé de licence Chariow. Ndako n'utilise pas cette clé : l'annonce est gérée par sa propre base de données. Vérifier l'email de confirmation Chariow affiché à l'acheteur avant la mise en production.
4. Copier les identifiants publics `prd_...` de chaque produit.
5. Créer une clé API Chariow avec les autorisations `products.read` et `checkout.write`.
6. Ouvrir **Automations → Pulses**, créer un Pulse HTTPS vers :

   `https://<PROJECT_REF>.supabase.co/functions/v1/chariow-pulse`

7. Sélectionner `successful.sale`, `failed.sale` et `abandoned.sale`. Si possible, limiter le Pulse aux trois produits Ndako.
8. Copier le **Signing secret** du Pulse (`whsec_...`). Ce secret est distinct de la clé API.

## Configuration de l'administrateur Ndako

L'ancien mot de passe administrateur codé dans le navigateur a été supprimé. L'administration utilise désormais Supabase Auth et une liste de membres autorisés en base.

1. Dans Supabase → Authentication → Users, créer l'utilisateur administrateur avec l'adresse email et un mot de passe fort de votre choix. Confirmer son adresse email.
2. Dans Supabase → SQL Editor, exécuter la requête suivante en remplaçant l'adresse par celle de votre compte administrateur :

   ```sql
   INSERT INTO public.admin_users (user_id)
   SELECT id FROM auth.users WHERE lower(email) = lower('votre-email-admin@exemple.com')
   ON CONFLICT (user_id) DO NOTHING;
   ```

3. La page `/admin` accepte uniquement un utilisateur connecté à Supabase Auth qui figure dans `public.admin_users`. Aucun mot de passe administrateur n'est présent dans le code source.

## Secrets Supabase

Définir ces secrets dans Supabase → Edge Functions → Secrets, ou avec la CLI. Ne jamais les mettre dans les variables `VITE_`, dans le navigateur ou dans le dépôt public.

```bash
supabase secrets set \
  CHARIOW_API_KEY="sk_live_..." \
  CHARIOW_PULSE_SECRET="whsec_..." \
  NDAKO_SITE_URL="https://votre-domaine-ndako.com" \
  CHARIOW_PRODUCT_1_WEEK="prd_..." \
  CHARIOW_PRODUCT_2_WEEKS="prd_..." \
  CHARIOW_PRODUCT_1_MONTH="prd_..."
```

Supabase fournit automatiquement `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` aux fonctions Edge. Ne jamais copier la clé `service_role` dans le frontend.

## Déploiement

À partir de la racine du projet, après connexion à votre projet Supabase :

```bash
supabase db push
supabase functions deploy start-chariow-checkout
supabase functions deploy chariow-pulse --no-verify-jwt
supabase functions deploy get-chariow-payment-status
supabase functions deploy create-free-listing
```

Les fonctions publiques de création et de consultation de statut utilisent `verify_jwt = false` parce que Ndako ne demande pas de compte acheteur. Elles vérifient l'origine, valident les données côté serveur et appliquent une limite de fréquence. `chariow-pulse` n'accepte aucune notification sans signature HMAC valide.

## Tests obligatoires avant la mise en production

- Tester une publication à 500 XOF, une à 1 000 XOF et une à 3 000 XOF.
- Vérifier que le checkout refuse un produit non publié, d'un type incorrect, avec variantes, un mauvais prix ou une mauvaise devise.
- Vérifier que l'annonce reste invisible pendant que le paiement est en attente.
- Vérifier qu'un Pulse signé avec un montant, une devise, un produit ou une référence incorrects ne publie rien.
- Rejouer la même livraison Pulse : elle ne doit pas traiter le paiement une deuxième fois.
- Tester `failed.sale` et `abandoned.sale`.
- Tester le mode gratuit et un code promo valide, expiré, désactivé et déjà épuisé.
- Tester la limite de 5 tentatives par IP sur 15 minutes.
- Vérifier les moyens de paiement réellement proposés par Chariow aux acheteurs dans les pays ciblés.
- Vérifier l'email Chariow envoyé après l'achat d'un produit License (notamment la clé de licence éventuellement délivrée).

## Références officielles

- Checkout : https://chariow.dev/en/guides/checkout
- Products : https://chariow.dev/en/guides/products
- Pulses : https://chariow.dev/en/guides/pulses
- Pulse Security : https://chariow.dev/en/guides/pulse-security

## Limites restantes avant la mise en service réelle

- Les trois identifiants `prd_...`, la clé API et le secret Pulse doivent être fournis et configurés par le propriétaire de la boutique Chariow.
- La migration `00004_security_and_atomic_payments.sql` doit être appliquée sur la base Supabase du projet avant le déploiement des fonctions.
- Un vrai paiement de bout en bout doit être testé avec la boutique Chariow et les moyens de paiement du pays avant d'ouvrir le service au public.
