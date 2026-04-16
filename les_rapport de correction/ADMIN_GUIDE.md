# 👨‍💼 Guide Administration - Gestion des Utilisateurs

## Nouvelles Fonctionnalités Ajoutées

### 1. Suppression de l'ID utilisateur
- L'ID n'est plus affiché publiquement
- Utilisation de l'email comme identifiant unique
- Plus propre et plus sécurisé

### 2. Gestion complète des utilisateurs par l'Admin

#### A. Affichage des utilisateurs
```
Tableau avec colonnes:
- Nom d'utilisateur
- Email
- Nom complet
- Actions (Supprimer)
```

#### B. Recherche d'utilisateurs
- Recherche en temps réel
- Par email ou nom d'utilisateur
- Filtre instantané

#### C. Statistiques tableau de bord
- Total Élèves


#### D. Ajouter un utilisateur
**Bouton**: "Ajouter Élève" (coin haut-droit)

**Modale avec champs**:
- Nom d'utilisateur * (obligatoire)
- Email * (obligatoire)
- Mot de passe * (obligatoire)
- Nom complet (optionnel)
- Faire un Maître (checkbox)

**Validations**:
- ✓ Vérification dupliquemail ne peut pas exister deux fois
- ✓ Champs obligatoires validés
- ✓ Message de succès/erreur

#### E. Supprimer un utilisateur
**Icône**: Corbeille rouge dans la colonne "Actions"

**Processus**:
1. Clic sur l'icône corbeille
2. Confirmation : "Êtes-vous sûr de vouloir supprimer {email} ?"
3. Si confirmé → Suppression
4. Si c'est l'admin → "Vous ne pouvez pas vous supprimer vous-même"

### 3. URL et endpoints

#### Frontend
```
GET /admin/users
- Récupère liste des utilisateurs
- Authentification requise (token Bearer)

POST /admin/users
- Crée un nouvel utilisateur
- Body: { username, email, password, fullname?, is_admin? }

DELETE /admin/users/{email}
- Supprime un utilisateur
- Path: email de l'utilisateur à supprimer

PUT /admin/users/{email}
- Modifie un utilisateur (optionnel)
```

### 4. Schema réponse (sans ID)

```typescript
interface User {
  username: string;
  email: string;
  fullname?: string;
  phone?: string;
  birthdate?: string;
  institution?: string;
  level?: string;
  objective?: string;
  is_admin: boolean;
}
```

### 5. Exemple d'utilisation

#### Créer un utilisateur
```bash
POST http://localhost:8000/admin/users
Authorization: Bearer {token}

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "fullname": "John Doe",
  "is_admin": false
}

Response: 201 Created
{
  "username": "johndoe",
  "email": "john@example.com",
  "fullname": "John Doe",
  "is_admin": false
}
```

#### Supprimer un utilisateur
```bash
DELETE http://localhost:8000/admin/users/john@example.com
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Utilisateur john@example.com supprimé avec succès"
}
```

#### Récupérer liste des utilisateurs
```bash
GET http://localhost:8000/admin/users
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "username": "johndoe",
    "email": "john@example.com",
    "fullname": "John Doe",
    "is_admin": false
  },
  ...
]
```

### 6. Sécurité

✅ **Authentification**: Token JWT requis
✅ **Autorisation**: Seul l'admin peut accéder (`@Depends(get_current_admin)`)
✅ **Protection**: Admin ne peut pas se supprimer lui-même
✅ **Validation**: Tous les champs sont validés
✅ **Email unique**: Pas de doublons possibles

### 7. Messages de retour

#### Succès
```
✓ Utilisateur créé avec succès
✓ Utilisateur {email} supprimé avec succès
✓ Recherche mise à jour
```

#### Erreurs
```
✗ Cet email est déjà utilisé
✗ Tous les champs obligatoires doivent être remplis
✗ Utilisateur non trouvé
✗ Vous ne pouvez pas vous supprimer vous-même
✗ Erreur lors de la création
✗ Erreur lors de la suppression
```

### 8. Interface Frontend

```
┌─────────────────────────────────────────────────┐
│ Gérer les Élèves              [+ Ajouter Élève]│
├─────────────────────────────────────────────────┤
│ 📊 Total: 24      │
├─────────────────────────────────────────────────┤
│ 🔍 [Rechercher par email...]                    │
├──────────┬──────────┬──────────┬─────┬──────────┤
│ Username │ Email    │ Complet  │ Actions  │
├──────────┼──────────┼──────────┼─────┼──────────┤
│ johndoe  │john@ex   │John Doe  │ │ 🗑 Sup   │
│ janedoe  │jane@ex   │Jane Doe  │  │ 🗑 Sup   │
└──────────┴──────────┴──────────┴─────┴──────────┘
```

### 9. Modale d'ajout

```
┌──────────────────────────────────────────┐
│ Ajouter un Élève                    [×]   │
├──────────────────────────────────────────┤
│ Nom d'utilisateur *                      │
│ [________________] (ex: john_doe)        │
│                                          │
│ Email *                                  │
│ [________________] (ex: john@ex.com)     │
│                                          │
│ Mot de passe *                           │
│ [________________] (••••••••)            │
│                                          │
│ Nom complet                              │
│ [________________] (ex: John Doe)        │
│                                          │
│ ☐ Faire un Maître (Admin)                │
│                                          │
│        [Annuler]    [Créer]              │
└──────────────────────────────────────────┘
```

### 10. Workflow complet

#### Ajouter un utilisateur:
1. Admin clique sur "+ Ajouter Élève"
2. Modale s'ouvre
3. Admin remplit les champs
4. Admin peut cocher "Faire un Maître" (optionnel)
5. Admin clique "Créer"
6. Validation backend
7. Si succès → Message vert ✓ + Tableau rafraîchi
8. Si erreur → Message rouge ✗

#### Supprimer un utilisateur:
1. Admin localise l'utilisateur dans le tableau
2. Admin clique sur l'icône 🗑 (corbeille)
3. Confirmation modale s'affiche
4. Admin confirme "Oui, supprimer"
5. Requête DELETE avec email
6. Backend supprime l'utilisateur + ses stats
7. Message de succès ✓
8. Tableau se rafraîchit automatiquement

### 11. Notes techniques

- **Clés de tableau**: Utilisation de `email` au lieu de `id`
- **Recherche**: Filtre en temps réel côté client
- **Modal**: Utilise Framer Motion pour animations
- **Erreurs**: Héritage du style global App.css
- **Authentification**: Token Bearer dans headers

### 12. Prochaines améliorations possibles



- [ ] Export liste des utilisateurs (CSV/PDF)
- [ ] Actions en masse (supprimer plusieurs)


---

## Pour tester

### Backend
```bash
cd study_backend
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd study
npm run dev
```

### Accès Admin
1. Se connecter avec compte admin
2. Naviguer vers `/admin`
3. Tester les fonctionnalités

Bon administration ! 👨‍💼
