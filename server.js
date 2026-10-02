const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");

const app = express();

const PORT = 3000;


app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));


const MAX_ATTEMPTS = 3;
const WAIT_TIME = 24 * 60 * 60 * 1000;
const CODE_DURATION = 10 * 60 * 1000;
const SESSION_DURATION = 24 * 60 * 60 * 1000;

const ANSWER_LIMIT = 4600 + 10000 + 3000;

const BONUS_POINTS = 100;
const DEFAULT_POINTS = 100;


const codesTemporaires = new Map();

const joueurs = new Map();

const sessions = new Map();


const gifts = [
    { name: "Sticker NWS", price: 100 },
    { name: "Stylo NWS", price: 200 },
    { name: "Café", price: 200 },
    { name: "Bloc-notes NWS", price: 300 },
    { name: "Tote bag NWS", price: 400 },
    { name: "Gobelet NWS", price: 500 },
    { name: "T-shirt NWS", price: 600 },
    { name: "Gros lot NWS", price: 700 }
];


const questions = {

    code: [
        {
            id: "code-1",
            question: "En JavaScript, que retourne typeof null ?",
            choix: ["null", "undefined", "object", "boolean"],
            bonneReponse: 2,
            points: 100
        },
        {
            id: "code-2",
            question: 'Que retourne 2 + "2" ?',
            choix: ["4", "22", '"4"', "Une erreur"],
            bonneReponse: 1,
            points: 100
        },
        {
            id: "code-3",
            question: "À quoi sert === ?",
            choix: [
                "Comparer uniquement les valeurs",
                "Comparer uniquement les types",
                "Comparer la valeur et le type",
                "Affecter une valeur"
            ],
            bonneReponse: 2,
            points: 100
        },
        {
            id: "code-4",
            question: "Quelle méthode transforme du JSON en objet JavaScript ?",
            choix: ["JSON.stringify()", "JSON.parse()", "JSON.object()", "JSON.convert()"],
            bonneReponse: 1,
            points: 150
        },
        {
            id: "code-5",
            question: "Quelle méthode transforme un objet JavaScript en JSON ?",
            choix: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "JSON.convert()"],
            bonneReponse: 1,
            points: 150
        }
    ],

    creatif: [
        {
            id: "creatif-1",
            question: "Que signifie UX ?",
            choix: ["User Experience", "User Extension", "Universal Experience", "User Export"],
            bonneReponse: 0,
            points: 100
        },
        {
            id: "creatif-2",
            question: "Que signifie UI ?",
            choix: ["User Internet", "User Interface", "Universal Interface", "User Interaction"],
            bonneReponse: 1,
            points: 100
        },
        {
            id: "creatif-3",
            question: "Quel format est adapté à un logo vectoriel ?",
            choix: ["JPG", "PNG", "SVG", "GIF"],
            bonneReponse: 2,
            points: 150
        },
        {
            id: "creatif-4",
            question: "Quel outil est utilisé pour concevoir des interfaces web ?",
            choix: ["Figma", "Git", "MySQL", "Node.js"],
            bonneReponse: 0,
            points: 100
        }
    ],

    ia: [
        {
            id: "ia-1",
            question: "Que signifie LLM ?",
            choix: [
                "Large Language Model",
                "Logical Learning Machine",
                "Language Logic Manager",
                "Large Learning Machine"
            ],
            bonneReponse: 0,
            points: 150
        },
        {
            id: "ia-2",
            question: "Qu'est-ce qu'un prompt ?",
            choix: [
                "Une instruction donnée à une IA",
                "Une base de données",
                "Un langage de programmation",
                "Un serveur"
            ],
            bonneReponse: 0,
            points: 100
        },
        {
            id: "ia-3",
            question: "Qu'est-ce qu'une hallucination d'une IA ?",
            choix: [
                "Une panne",
                "Une réponse inventée ou incorrecte mais plausible",
                "Une image générée",
                "Une erreur de connexion"
            ],
            bonneReponse: 1,
            points: 200
        },
        {
            id: "ia-4",
            question: "Une IA générative peut notamment :",
            choix: [
                "Générer du texte",
                "Générer des images",
                "Générer du code",
                "Toutes les réponses précédentes"
            ],
            bonneReponse: 3,
            points: 150
        }
    ],

    marketing: [
        {
            id: "marketing-1",
            question: "Que signifie SEO ?",
            choix: [
                "Search Engine Optimization",
                "Social Engine Online",
                "Search Email Optimization",
                "System Engine Optimization"
            ],
            bonneReponse: 0,
            points: 100
        },
        {
            id: "marketing-2",
            question: "Quel est l'objectif principal du SEO ?",
            choix: [
                "Améliorer la visibilité dans les moteurs de recherche",
                "Créer des logos",
                "Envoyer des SMS",
                "Héberger un site"
            ],
            bonneReponse: 0,
            points: 100
        },
        {
            id: "marketing-3",
            question: "Que signifie CTA ?",
            choix: [
                "Click To Access",
                "Call To Action",
                "Content To Advertise",
                "Create Target Audience"
            ],
            bonneReponse: 1,
            points: 100
        },
        {
            id: "marketing-4",
            question: "Qu'est-ce qu'une cible marketing ?",
            choix: [
                "Le groupe que l'entreprise souhaite atteindre",
                "Une publicité",
                "Un logo",
                "Un moteur de recherche"
            ],
            bonneReponse: 0,
            points: 150
        }
    ],

    nws: [
        {
            id: "nws-1",
            question: "Quel est le niveau du titre Chef de projets digitaux ?",
            choix: [
                "Niveau 5 - Bac+2",
                "Niveau 6 - Bac+3",
                "Niveau 7 - Bac+5",
                "Niveau 8 - Bac+8"
            ],
            bonneReponse: 1,
            points: 100
        },
        {
            id: "nws-2",
            question: "Quelle spécialisation ne fait pas partie des Bachelor présentés ?",
            choix: [
                "Communication graphique",
                "Marketing et Communication",
                "Développement Web",
                "Cybersécurité"
            ],
            bonneReponse: 3,
            points: 100
        },
        {
            id: "nws-3",
            question: "Pour intégrer une formation Bac+3 en alternance, quel niveau faut-il généralement ?",
            choix: ["Brevet", "Bac uniquement", "Bac ou Bac+2", "Bac+5"],
            bonneReponse: 2,
            points: 100
        },
        {
            id: "nws-4",
            question: "L'admission est-elle obligatoirement liée à Parcoursup ?",
            choix: [
                "Oui",
                "Non, la NWS possède sa propre procédure",
                "Oui uniquement en alternance",
                "Oui uniquement après Bac+3"
            ],
            bonneReponse: 1,
            points: 100
        }
    ],

    risques: [
        {
            id: "risque-1",
            question: "Quelle est la capitale de la France ?",
            choix: ["Lyon", "Paris", "Marseille", "Bordeaux"],
            bonneReponse: 1
        },
        {
            id: "risque-2",
            question: "Quelles sont les couleurs du drapeau français ?",
            choix: [
                "Bleu, blanc, rouge",
                "Vert, blanc, rouge",
                "Rouge, jaune, bleu",
                "Bleu, jaune, rouge"
            ],
            bonneReponse: 0
        },
        {
            id: "risque-3",
            question: "Quelle est la devise de la République française ?",
            choix: [
                "Travail, Famille, Patrie",
                "Liberté, Égalité, Fraternité",
                "Unité, Liberté, Justice",
                "Honneur et Patrie"
            ],
            bonneReponse: 1
        },
        {
            id: "risque-4",
            question: "Quel fleuve traverse Paris ?",
            choix: ["La Loire", "Le Rhône", "La Seine", "La Garonne"],
            bonneReponse: 2
        }
    ]
};


const segments = [
    { id: "code", label: "Défi code" },
    { id: "creatif", label: "Défi créatif" },
    { id: "ia", label: "Défi IA" },
    { id: "marketing", label: "Défi Marketing" },
    { id: "nws", label: "Quiz NWS" },
    { id: "bonus", label: "Bonus" },
    { id: "risques", label: "Risques" }
];

const bonus = [
    "Coup de chance !",
    "Bonus : la chance est avec toi !",
    "Joker : tu gagnes des points !",
    "Surprise : la roue t'accorde un cadeau !",
    "Bonus NWS : bien joué !",
    "Une belle opportunité !",
    "La roue te donne un bonus !"
];


const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,
    auth: {
        user: "identifiant",
        pass: "clé"
    }
});


function normaliserEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function emailValide(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function genererCode() {
    return crypto.randomInt(100000, 1000000).toString();
}

function genererToken() {
    return crypto.randomBytes(32).toString("hex");
}

function publicPlayer(joueur) {
    return {
        email: joueur.email,
        score: joueur.score,
        attempts: joueur.attempts,
        blockedUntil: joueur.blockedUntil,
        selectedGift: joueur.selectedGift
    };
}

function resetIfExpired(joueur) {

    if (
        joueur.blockedUntil &&
        Date.now() >= joueur.blockedUntil
    ) {
        joueur.attempts = 0;
        joueur.score = 0;
        joueur.blockedUntil = 0;
        joueur.selectedGift = null;
        joueur.activeChallenge = null;
    }
}

function getOrCreatePlayer(email) {

    let joueur = joueurs.get(email);

    if (!joueur) {

        joueur = {
            email,
            attempts: 0,
            score: 0,
            blockedUntil: 0,
            selectedGift: null,
            activeChallenge: null
        };

        joueurs.set(email, joueur);
    }

    resetIfExpired(joueur);

    return joueur;
}


function getPlayerFromRequest(req) {

    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    const token = authorization.substring(7).trim();

    if (!token) {
        return null;
    }

    const session = sessions.get(token);

    if (!session) {
        return null;
    }

    if (Date.now() >= session.expiration) {
        sessions.delete(token);
        return null;
    }

    const joueur = joueurs.get(session.email);

    if (!joueur) {
        return null;
    }

    resetIfExpired(joueur);

    return joueur;
}


app.post("/auth/envoyer-code", async (req, res) => {

    const email = normaliserEmail(req.body.email);

    if (!email) {
        return res.status(400).json({
            error: "L'adresse email est requise."
        });
    }

    if (!emailValide(email)) {
        return res.status(400).json({
            error: "Adresse email invalide."
        });
    }

    const code = genererCode();

    codesTemporaires.set(email, {
        code,
        expiration: Date.now() + CODE_DURATION
    });

    const mailOptions = {

        from: '"NWS" <ton mail>',

        to: email,

        subject: "Votre code de connexion - La Roue NWS",

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">

                <h2>La Roue NWS</h2>

                <p>Bonjour,</p>

                <p>Voici ton code de connexion :</p>

                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00a5a5; margin: 25px 0;">
                    ${code}
                </div>

                <p>Ce code est valable pendant 10 minutes.</p>

                <p>Il ne peut être utilisé qu'une seule fois.</p>

                <p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>

            </div>
        `
    };

    try {

        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: "Le code a été envoyé par email."
        });

    } catch (error) {

        console.error("Erreur SMTP :", error);

        codesTemporaires.delete(email);

        return res.status(500).json({
            error: "Impossible d'envoyer le code par email."
        });
    }
});


app.post("/auth/verifier-code", (req, res) => {

    const email = normaliserEmail(req.body.email);
    const code = String(req.body.code || "").trim();

    if (!email || !code) {
        return res.status(400).json({
            error: "L'email et le code sont requis."
        });
    }

    const donnees = codesTemporaires.get(email);

    if (!donnees) {
        return res.status(400).json({
            error: "Aucun code valide n'a été demandé."
        });
    }

    if (Date.now() > donnees.expiration) {

        codesTemporaires.delete(email);

        return res.status(401).json({
            error: "Le code a expiré. Demande un nouveau code."
        });
    }

    if (donnees.code !== code) {
        return res.status(401).json({
            error: "Code de connexion incorrect."
        });
    }

    codesTemporaires.delete(email);

    const joueur = getOrCreatePlayer(email);

    const token = genererToken();

    sessions.set(token, {
        email,
        expiration: Date.now() + SESSION_DURATION
    });

    return res.json({
        success: true,
        message: "Connexion réussie.",
        token,
        user: { email },
        player: publicPlayer(joueur)
    });
});


app.get("/api/status", (req, res) => {

    const joueur = getPlayerFromRequest(req);

    if (!joueur) {
        return res.status(401).json({
            error: "Session invalide ou expirée."
        });
    }

    return res.json({
        success: true,
        player: publicPlayer(joueur)
    });
});


app.post("/api/spin", (req, res) => {

    const joueur = getPlayerFromRequest(req);

    if (!joueur) {
        return res.status(401).json({
            error: "Session invalide."
        });
    }

    if (
        joueur.attempts >= MAX_ATTEMPTS ||
        (
            joueur.blockedUntil &&
            Date.now() < joueur.blockedUntil
        )
    ) {
        return res.status(429).json({
            error: "Tes 3 tours sont terminés.",
            blockedUntil: joueur.blockedUntil,
            attempts: joueur.attempts,
            score: joueur.score
        });
    }

    joueur.attempts++;

    if (joueur.attempts >= MAX_ATTEMPTS) {
        joueur.blockedUntil = Date.now() + WAIT_TIME;
    }

    joueur.activeChallenge = null;

    const segment = segments[crypto.randomInt(0, segments.length)];

    if (segment.id === "bonus") {

        joueur.score += BONUS_POINTS;

        const bonusText = bonus[crypto.randomInt(0, bonus.length)];

        return res.json({
            success: true,
            segment,
            type: "bonus",
            bonus: `${bonusText} Tu gagnes ${BONUS_POINTS} points.`,
            player: publicPlayer(joueur)
        });
    }

    const list = questions[segment.id];

    const question = list[crypto.randomInt(0, list.length)];

    joueur.activeChallenge = {
        type: segment.id,
        questionId: question.id,
        startedAt: Date.now()
    };

    return res.json({
        success: true,
        segment,
        type: "question",
        question: {
            id: question.id,
            question: question.question,
            choix: question.choix
        },
        player: publicPlayer(joueur)
    });
});


app.post("/api/answer", (req, res) => {

    const joueur = getPlayerFromRequest(req);

    if (!joueur) {
        return res.status(401).json({
            error: "Session invalide."
        });
    }

    const challenge = joueur.activeChallenge;

    if (!challenge) {
        return res.status(400).json({
            error: "Aucun défi actif."
        });
    }

    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined) {
        return res.status(400).json({
            error: "La question et la réponse sont requises."
        });
    }

    if (challenge.questionId !== questionId) {
        return res.status(400).json({
            error: "Ce défi n'est plus valide."
        });
    }

    const category = challenge.type;
    const isRisk = category === "risques";

    const question = questions[category].find(
        item => item.id === questionId
    );

    if (!question) {
        return res.status(400).json({
            error: "Question introuvable."
        });
    }

    joueur.activeChallenge = null;

    if (
        !isRisk &&
        Date.now() > challenge.startedAt + ANSWER_LIMIT
    ) {
        return res.json({
            success: true,
            correct: false,
            category,
            points: 0,
            message: "Temps écoulé ! 0 point.",
            player: publicPlayer(joueur)
        });
    }

    const bonne = Number(answer) === question.bonneReponse;

    const bonneReponse = question.choix[question.bonneReponse];

    let points = 0;

    if (isRisk) {
        points = bonne ? 300 : -100;
    } else if (bonne) {
        points = question.points || DEFAULT_POINTS;
    }

    joueur.score += points;

    let message;

    if (bonne) {
        message = `Bonne réponse ! +${points} points.`;
    } else if (isRisk) {
        message = `Mauvaise réponse. -100 points. La bonne réponse était : ${bonneReponse}`;
    } else {
        message = `Mauvaise réponse. La bonne réponse était : ${bonneReponse}`;
    }

    return res.json({
        success: true,
        correct: bonne,
        category,
        points,
        ...(bonne ? {} : { bonneReponse }),
        message,
        player: publicPlayer(joueur)
    });
});


app.post("/api/timeout", (req, res) => {

    const joueur = getPlayerFromRequest(req);

    if (!joueur) {
        return res.status(401).json({
            error: "Session invalide."
        });
    }

    joueur.activeChallenge = null;

    return res.json({
        success: true,
        message: "Temps écoulé ! 0 point.",
        player: publicPlayer(joueur)
    });
});


app.post("/api/risk/refuse", (req, res) => {

    const joueur = getPlayerFromRequest(req);

    if (!joueur) {
        return res.status(401).json({
            error: "Session invalide."
        });
    }

    joueur.activeChallenge = null;

    return res.json({
        success: true,
        message: "Risque refusé. Ton score ne change pas.",
        player: publicPlayer(joueur)
    });
});


app.post("/api/gift", (req, res) => {

    const joueur = getPlayerFromRequest(req);

    if (!joueur) {
        return res.status(401).json({
            error: "Session invalide."
        });
    }

    if (
        joueur.attempts < MAX_ATTEMPTS ||
        joueur.activeChallenge
    ) {
        return res.status(400).json({
            error: "Tu dois d'abord terminer tes 3 tours."
        });
    }

    if (joueur.selectedGift) {
        return res.status(400).json({
            error: "Tu as déjà choisi ton cadeau."
        });
    }

    const name = String(req.body.gift || "").trim();

    const gift = gifts.find(item => item.name === name);

    if (!gift) {
        return res.status(400).json({
            error: "Cadeau introuvable."
        });
    }

    if (joueur.score < gift.price) {
        return res.status(400).json({
            error: "Tu n'as pas assez de points pour ce cadeau."
        });
    }

    joueur.selectedGift = gift.name;

    return res.json({
        success: true,
        message: `Tu as choisi : ${gift.name}`,
        player: publicPlayer(joueur)
    });
});


setInterval(() => {

    const now = Date.now();

    for (const [email, data] of codesTemporaires) {
        if (now >= data.expiration) {
            codesTemporaires.delete(email);
        }
    }

    for (const [token, session] of sessions) {
        if (now >= session.expiration) {
            sessions.delete(token);
        }
    }

}, 60 * 1000);


app.listen(PORT, () => {

    console.log("La Roue NWS est disponible sur :");
    console.log(`http://localhost:${PORT}`);
});
