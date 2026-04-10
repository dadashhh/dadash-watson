# DADASH Watson — Recrutement Chatters

Plateforme de test et recrutement pour chatters DADASH.

## Stack
- React 18 + Babel standalone (single `index.html`, pas de build system)
- Tailwind CSS (CDN)
- Supabase (auth + DB + storage)
- Claude Haiku (spender IA + scoring) via Vercel Edge Functions
- Deploy : Vercel (static + serverless)

## Structure
```
dadash-watson/
├── index.html              # App React complète
├── api/
│   ├── chat.js             # Spender IA (Claude Haiku)
│   ├── evaluate.js         # Scoring scénarios live
│   └── evaluate-french.js  # Correction rédactions
├── vercel.json             # Config Vercel
├── package.json            # Dépendances (Anthropic SDK + Supabase)
└── README.md
```

## Deploy

1. Push ce dossier vers le repo GitHub `dadashhh/dadash-watson`
2. Connecter à Vercel
3. Ajouter les variables d'environnement dans Vercel :
   - `ANTHROPIC_API_KEY` — clé API Anthropic
   - `SUPABASE_URL` — `https://lkrzjwfwhiimpnsyeuxi.supabase.co`
   - `SUPABASE_ANON_KEY` — clé anon publique
   - `SUPABASE_SERVICE_KEY` — clé service (pour les Edge Functions)
4. Deploy

## Flow candidat

1. **Landing** → Présentation + CTA
2. **Inscription** → Formulaire complet (prénom, nom, email, telegram, etc.)
3. **KYC** → Upload photo ID + selfie
4. **Test QI** → 20 QCM, 15 min, seuil 8/20
5. **Test Bon Sens** → 15 QCM, 10 min, seuil 7/15
6. **Test Français** → 10 QCM + 3 rédactions (évaluées par IA), 20 min, seuil 10/20
7. **Test Live** → 10 scénarios chat avec IA, scoring automatique
8. **Résultats** → Score global + niveau

## Scoring

Score pondéré = QI (10%) + Bon Sens (10%) + Français (15%) + Live (65%)

| Score | Niveau | Décision |
|-------|--------|----------|
| 85-100+ | ELITE | Recruter immédiatement |
| 70-84 | PERFORMANT | Recruter, suivi standard |
| 55-69 | ACCEPTABLE | Probation 2 semaines |
| 40-54 | FAIBLE | Refus, re-test possible |
| 0-39 | ÉLIMINÉ | Refus catégorique |

## Admin

- Login : `#/admin-login` (Supabase Auth, rôle gérant ou MC)
- Dashboard : `#/admin` (liste candidats, filtres, export CSV)
- Fiche détaillée : `#/admin/candidat/:id`
- Génération lien d'invitation : `https://[site]/#/?ref={mc_id}`

## Liens d'invitation MC

Les MC peuvent générer un lien unique depuis le dashboard admin.
Le paramètre `?ref=` est capturé à l'inscription et stocké dans `invited_by`.

## Tables Supabase

- `watson_candidates` — profils + scores + statuts
- `watson_test_results` — détail question par question + transcripts live
- Storage bucket `watson-kyc` — photos KYC (privé)
