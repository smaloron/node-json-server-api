# API REST avec JSON Server et Authentification JWT

API REST simulée pour formation React utilisant json-server avec authentification JWT complète.

## Installation

```bash
npm install
```

## Démarrage

```bash
# Démarrage normal
npm start

# Démarrage avec rechargement automatique (développement)
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

## Authentification

### Inscription (Register)

**Endpoint:** `POST /auth/register`

**Body:**
```json
{
  "email": "nouveau@example.com",
  "password": "motdepasse123",
  "name": "Nom Utilisateur"
}
```

**Réponse:**
```json
{
  "message": "Utilisateur créé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "email": "nouveau@example.com",
    "name": "Nom Utilisateur"
  }
}
```

### Connexion (Login)

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "user@example.com",
    "name": "Utilisateur Test"
  }
}
```

### Vérification du token

**Endpoint:** `GET /auth/verify`

**Headers:**
```
Authorization: Bearer <votre-token>
```

**Réponse:**
```json
{
  "valid": true,
  "user": {
    "id": 2,
    "email": "user@example.com"
  }
}
```

## Routes API (Protégées)

Toutes les routes suivantes nécessitent un token JWT dans le header:
```
Authorization: Bearer <votre-token>
```

### Produits

- `GET /products` - Liste tous les produits
- `GET /products/:id` - Récupère un produit
- `GET /products?category=laptops` - Filtre par catégorie
- `GET /products?featured=true` - Produits mis en avant
- `GET /products?_sort=price&_order=desc` - Trier par prix
- `POST /products` - Créer un produit
- `PUT /products/:id` - Modifier un produit
- `PATCH /products/:id` - Mise à jour partielle
- `DELETE /products/:id` - Supprimer un produit

### Catégories

- `GET /categories` - Liste toutes les catégories
- `GET /categories/:id` - Récupère une catégorie
- `POST /categories` - Créer une catégorie
- `PUT /categories/:id` - Modifier une catégorie
- `DELETE /categories/:id` - Supprimer une catégorie

### Commandes

- `GET /orders` - Liste toutes les commandes
- `GET /orders?userId=2` - Commandes d'un utilisateur
- `POST /orders` - Créer une commande
- `PATCH /orders/:id` - Mettre à jour le statut

### Panier

- `GET /cart` - Contenu du panier
- `GET /cart?userId=2` - Panier d'un utilisateur
- `POST /cart` - Ajouter au panier
- `DELETE /cart/:id` - Retirer du panier

## Exemples d'utilisation avec React

### Configuration Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001'
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
```

### Hook d'authentification

```javascript
import { useState, useEffect } from 'react';
import api from './api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await api.get('/auth/verify');
      if (response.data.valid) {
        setUser(response.data.user);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, loading, login, register, logout };
};
```

### Composant de connexion

```javascript
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirection ou mise à jour de l'état
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

### Récupération des produits

```javascript
import { useState, useEffect } from 'react';
import api from './api';

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des produits', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="products-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <span>{product.price} €</span>
        </div>
      ))}
    </div>
  );
}
```

## Comptes de test

Deux utilisateurs sont disponibles par défaut (mot de passe: `password123`):

- **Admin:** `admin@example.com`
- **User:** `user@example.com`

## Fonctionnalités de json-server

### Pagination

```
GET /products?_page=1&_limit=10
```

### Tri

```
GET /products?_sort=price&_order=asc
```

### Recherche

```
GET /products?q=iPhone
```

### Relations

```
GET /orders?_embed=items
```

### Opérateurs

```
GET /products?price_gte=100&price_lte=500
```

## Notes importantes

- Le token JWT expire après 24 heures
- La clé secrète JWT (`SECRET_KEY`) doit être changée en production
- Les mots de passe dans `db.json` sont hashés avec bcrypt
- Pour réinitialiser la base de données, restaurez le fichier `db.json` original

## Développement

Le fichier `db.json` est modifié en temps réel lors des opérations POST, PUT, PATCH, DELETE. Vous pouvez le réinitialiser manuellement si nécessaire.

## Ressources

- [json-server Documentation](https://github.com/typicode/json-server)
- [JWT Documentation](https://jwt.io/)
- [React Documentation](https://react.dev/)

## Résolution de problèmes

### Le serveur ne démarre pas
- Vérifiez que le port 3001 est disponible
- Assurez-vous que `db.json` existe dans le répertoire

### Erreur 401 Unauthorized
- Vérifiez que le token est valide et non expiré
- Assurez-vous d'inclure `Bearer` avant le token dans le header

### Les modifications ne sont pas sauvegardées
- Vérifiez les permissions d'écriture sur `db.json`
- Redémarrez le serveur si nécessaire
