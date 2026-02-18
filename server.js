const jsonServer = require('json-server');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Configuration
const SECRET_KEY = 'votre-cle-secrete-jwt-2024'; // À changer en production
const expiresIn = '24h';

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(middlewares);

// Utilitaires
const createToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, SECRET_KEY, (err, decode) => 
    decode !== undefined ? decode : err
  );
};

const isAuthenticated = ({ email, password }) => {
  const userdb = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'));
  return userdb.users.findIndex(
    user => user.email === email && bcrypt.compareSync(password, user.password)
  ) !== -1;
};

const getUserByEmail = (email) => {
  const userdb = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'));
  return userdb.users.find(user => user.email === email);
};

// Routes d'authentification
app.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password et name sont requis' });
  }

  // Vérifier si l'utilisateur existe déjà
  const userdb = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'));
  const existingUser = userdb.users.find(user => user.email === email);

  if (existingUser) {
    return res.status(409).json({ message: 'Cet email est déjà utilisé' });
  }

  // Créer un nouvel utilisateur
  const newUser = {
    id: Date.now(),
    email,
    name,
    password: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };

  userdb.users.push(newUser);
  fs.writeFileSync('./db.json', JSON.stringify(userdb, null, 2));

  // Créer un token
  const token = createToken({ id: newUser.id, email: newUser.email });
  
  res.status(201).json({
    message: 'Utilisateur créé avec succès',
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    }
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et password sont requis' });
  }

  if (!isAuthenticated({ email, password })) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  const user = getUserByEmail(email);
  const token = createToken({ id: user.id, email: user.email });

  res.status(200).json({
    message: 'Connexion réussie',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

// Route pour vérifier le token
app.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verifyToken(token);
    if (decoded.message) {
      return res.status(401).json({ message: 'Token invalide' });
    }
    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
});

// Middleware de vérification JWT pour les routes protégées
app.use(/^(?!\/auth).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Accès non autorisé - Token manquant' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (decoded.message) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Erreur lors de la vérification du token' });
  }
});

// Routes protégées via json-server
app.use(router);

// Démarrage du serveur
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Base de données: db.json`);
  console.log(`Routes d'authentification disponibles:`);
  console.log(`   POST http://localhost:${PORT}/auth/register`);
  console.log(`   POST http://localhost:${PORT}/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/auth/verify`);
  console.log(`Routes protégées: /products, /users, etc.`);
});
