# La Roue NWS

Jeu de roue de la Normandie Web School. Le joueur se connecte avec son email (code à 6 chiffres), tourne la roue 3 fois, répond à des défis pour gagner des points, puis choisit un cadeau selon son score. Il peut rejouer 24 heures après.

## Fonctionnement du jeu

- Connexion : le joueur saisit son email et reçoit un code à 6 chiffres (valable 10 minutes, usage unique).
- 3 tours par tranche de 24 h : le compte à rebours démarre au 3e tour.
- La roue a 7 segments :

| Segment | Effet |
|---|---|
| Défi code | Question de programmation |
| Défi créatif | Question UX / UI / design |
| Défi IA | Question sur l'intelligence artificielle |
| Défi Marketing | Question SEO / marketing |
| Quiz NWS | Question sur l'école |
| Bonus | +100 points |
| Risques | Le joueur peut refuser, ou accepter : +300 si bonne réponse, -100 sinon |

- Chronomètre : 10 secondes par question. Temps écoulé = 0 point.
- Cadeaux : après les 3 tours, le joueur choisit un seul cadeau dont le prix est inférieur ou égal à son score.

| Cadeau | Points |
|---|---|
| Sticker NWS | 100 |
| Stylo NWS | 200 |
| Café | 200 |
| Bloc-notes NWS | 300 |
| Tote bag NWS | 400 |
| Gobelet NWS | 500 |
| T-shirt NWS | 600 |
| Gros lot NWS | 700 |

- Les bonnes réponses restent uniquement côté serveur : le navigateur ne peut pas les lire. Le tirage de la roue, les points et les prix des cadeaux sont aussi vérifiés par le serveur.

## Structure du projet

```
roue-nws/
├── server.js              Serveur Express (API, questions, scores, envoi d'emails)
├── package.json           Dépendances et script de démarrage
└── public/
    ├── index.html         Page du jeu
    ├── jeu_de_roue.css    Styles
    ├── jeu_de_roue.js     Logique côté navigateur
    └── logo_nws.jpg       Logo
```

Le dossier `public` est servi automatiquement par le serveur.

## Installation

### Prérequis

- [Node.js](https://nodejs.org) version 18 ou supérieure (version LTS recommandée)

### Étapes

```bash
npm install
npm start
```

Ouvre ensuite http://localhost:3000.

> Ne double-clique pas sur `index.html` : le jeu a besoin du serveur Node.

## Configuration des emails (SMTP)

Les codes de connexion sont envoyés avec Nodemailer. Dans `server.js`, modifie le bloc `createTransport` et l'adresse `from`.

Exemple avec Brevo :

```js
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: "TON_IDENTIFIANT_SMTP",
        pass: "TA_CLE_SMTP"
    }
});
```

```js
from: '"La Roue NWS" <ton-adresse-validee@exemple.com>',
```

### Où trouver les identifiants Brevo

1. Brevo > menu du compte > Paramètres > SMTP & API > onglet SMTP.
2. L'identifiant SMTP est affiché sur cette page (souvent `xxxx@smtp-brevo.com`).
3. Clique sur Générer une nouvelle clé SMTP et copie la clé : elle n'est visible qu'une fois.
4. Valide l'adresse d'expédition dans Expéditeurs, domaines et IP dédiées.

### Erreurs courantes

| Message | Cause | Solution |
|---|---|---|
| `535 Authentication failed` | Mauvais identifiant ou mauvaise clé | Utiliser l'identifiant SMTP et la clé SMTP (ni le mot de passe du compte, ni une clé API) |
| `525 5.7.1 Unauthorized IP address` | Brevo bloque ton IP | Brevo > Sécurité > Adresses IP autorisées : ajouter l'IP ou désactiver la restriction |
| `Sender not valid` | Adresse `from` non validée | Valider l'expéditeur dans Brevo |
| `ETIMEDOUT` / `ECONNREFUSED` | Port bloqué par le réseau | Essayer `port: 2525` |

Après toute modification de `server.js`, redémarre le serveur (`Ctrl + C` puis `npm start`).

## API du serveur

Toutes les routes qui commencent par `/api/` demandent l'en-tête `Authorization: Bearer <token>`, obtenu après la vérification du code.

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/auth/envoyer-code` | Envoie un code à 6 chiffres par email |
| POST | `/auth/verifier-code` | Vérifie le code, renvoie un token de session (24 h) |
| GET | `/api/status` | État du joueur (score, tours, blocage) |
| POST | `/api/spin` | Tourne la roue et consomme un tour |
| POST | `/api/answer` | Envoie la réponse à la question en cours |
| POST | `/api/timeout` | Signale que le temps est écoulé (0 point) |
| POST | `/api/risk/refuse` | Refuse un défi Risque |
| POST | `/api/gift` | Choisit un cadeau (après les 3 tours) |

## Personnalisation

Tout se règle dans `server.js` :

- Questions : objet `questions` (une liste par catégorie, avec `id`, `question`, `choix`, `bonneReponse` et `points`).
- Cadeaux et prix : tableau `gifts`. La même liste existe dans `public/jeu_de_roue.js` pour l'affichage : modifie les deux.
- Réglages : `MAX_ATTEMPTS` (tours), `WAIT_TIME` (attente, 24 h), `CODE_DURATION` (validité du code), `BONUS_POINTS`.
- Segments de la roue : tableau `segments` (présent aussi dans le JS du navigateur) et les textes dans `index.html`.

## Limites à connaître

- Les joueurs, scores, codes et sessions sont stockés en mémoire : tout est remis à zéro quand le serveur redémarre. Pour un usage durable, il faudrait une base de données.
- Le serveur doit tourner en continu : GitHub Pages ne convient pas. Utilise un hébergeur Node.js (Render, Railway, Fly.io...).

## Publier sur GitHub / hébergeur

- Ne mets jamais ta clé SMTP dans le code publié. Lis-la depuis des variables d'environnement (`process.env.SMTP_USER`, `process.env.SMTP_PASS`) et renseigne-les dans l'interface de l'hébergeur.
- Utilise `const PORT = process.env.PORT || 3000;` pour que l'hébergeur choisisse le port.
- Ajoute un fichier `.gitignore` contenant `node_modules`.
- Si le blocage par IP est actif chez Brevo, autorise l'IP de l'hébergeur ou désactive la restriction.

## Technologies

Node.js, Express 5, Nodemailer, HTML / CSS / JavaScript.