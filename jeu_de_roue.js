document.addEventListener("DOMContentLoaded", () => {

    const $ = id => document.getElementById(id);


    const wheel = $("wheel");
    const spinButton = $("spinButton");
    const resultBox = $("result");
    const scoreEl = $("score");

    const emailCard = $("emailCard");
    const emailForm = $("emailForm");
    const emailInput = $("emailInput");
    const emailMessage = $("emailMessage");
    const sendCodeButton = $("sendCodeButton");

    const codeVerification = $("codeVerification");
    const codeForm = $("codeForm");
    const codeInput = $("codeInput");
    const codeMessage = $("codeMessage");
    const newCodeButton = $("newCodeButton");
    const verifyCodeButton = $("verifyCodeButton");

    const gameContent = $("gameContent");
    const intro = $("intro");
    const wheelZone = $("wheelZone");

    const attemptsUsedEl = $("attemptsUsed");
    const remainingEl = $("remaining");

    const blockedCard = $("blockedCard");
    const countdown = $("countdown");
    const chosenGiftText = $("chosenGiftText");

    const quiz = $("quiz");
    const quizCategory = $("quizCategory");
    const questionEl = $("question");
    const quizForm = $("quizForm");
    const quizResult = $("quizResult");
    const questionTime = $("questionTime");
    const choixElements = [0, 1, 2, 3].map(i => $("choix" + i));

    const specialCard = $("specialCard");
    const specialTitle = $("specialTitle");
    const specialText = $("specialText");
    const specialButton = $("specialButton");

    const riskChoice = $("riskChoice");
    const acceptRisk = $("acceptRisk");
    const refuseRisk = $("refuseRisk");

    const giftShop = $("giftShop");
    const giftList = $("giftList");
    const finalScore = $("finalScore");
    const giftMessage = $("giftMessage");


    const segments = [
        { id: "code", label: "Défi code" },
        { id: "creatif", label: "Défi créatif" },
        { id: "ia", label: "Défi IA" },
        { id: "marketing", label: "Défi Marketing" },
        { id: "nws", label: "Quiz NWS" },
        { id: "bonus", label: "Bonus" },
        { id: "risques", label: "Risques" }
    ];

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

    const segmentAngle = 360 / segments.length;
    const MAX_ATTEMPTS = 3;
    const QUESTION_TIME = 10;

    let currentRotation = 0;
    let isSpinning = false;
    let currentEmail = null;
    let authToken = null;
    let player = null;
    let currentQuestionId = null;
    let currentCategory = null;
    let questionAnswered = false;
    let questionTimer = null;
    let countdownInterval = null;


    function setButtonLoading(button, loading, normalText, loadingText) {
        button.disabled = loading;
        button.textContent = loading ? loadingText : normalText;
    }

    function updatePlayerUI(p) {

        if (!p) return;

        player = p;

        scoreEl.textContent = p.score;
        attemptsUsedEl.textContent = p.attempts;

        const remaining = MAX_ATTEMPTS - p.attempts;

        remainingEl.textContent = remaining <= 0
            ? "Tes 3 tours sont terminés."
            : `Il te reste ${remaining} tour${remaining > 1 ? "s" : ""}.`;
    }

    async function api(url, options = {}) {

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(url, { ...options, headers });

        let data = {};

        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }

        if (!response.ok) {
            const error = new Error(data.error || "Une erreur est survenue.");
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }


    async function envoyerCode() {

        const email = emailInput.value.trim().toLowerCase();

        if (!email) return;

        if (!emailInput.checkValidity()) {
            emailMessage.textContent = "Entre une adresse email valide.";
            emailMessage.style.color = "#ef4b35";
            return;
        }

        currentEmail = email;

        emailMessage.textContent = "Envoi du code...";
        emailMessage.style.color = "#555";

        setButtonLoading(sendCodeButton, true, "RECEVOIR MON CODE", "ENVOI...");

        try {

            const data = await api("/auth/envoyer-code", {
                method: "POST",
                body: JSON.stringify({ email })
            });

            emailMessage.textContent = data.message || "Code envoyé !";
            emailMessage.style.color = "#00a5a5";

            codeVerification.classList.remove("hidden");
            codeInput.value = "";
            codeInput.focus();

        } catch (error) {

            console.error(error);
            emailMessage.textContent = error.message;
            emailMessage.style.color = "#ef4b35";
        }

        setButtonLoading(sendCodeButton, false, "RECEVOIR MON CODE", "ENVOI...");
    }

    emailForm.addEventListener("submit", event => {
        event.preventDefault();
        envoyerCode();
    });

    newCodeButton.addEventListener("click", envoyerCode);

    codeForm.addEventListener("submit", async event => {

        event.preventDefault();

        const email = currentEmail;
        const code = codeInput.value.trim();

        if (!email || !code) {
            codeMessage.textContent = "Entre le code reçu par email.";
            codeMessage.style.color = "#ef4b35";
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            codeMessage.textContent = "Le code doit contenir 6 chiffres.";
            codeMessage.style.color = "#ef4b35";
            return;
        }

        codeMessage.textContent = "Vérification...";
        codeMessage.style.color = "#555";

        setButtonLoading(verifyCodeButton, true, "VALIDER LE CODE", "VÉRIFICATION...");

        try {

            const data = await api("/auth/verifier-code", {
                method: "POST",
                body: JSON.stringify({ email, code })
            });

            authToken = data.token;
            currentEmail = data.user.email;

            codeMessage.textContent = "Code vérifié !";
            codeMessage.style.color = "#00a5a5";

            emailCard.classList.add("hidden");
            gameContent.classList.remove("hidden");

            updatePlayerUI(data.player);

            if (
                data.player.attempts >= MAX_ATTEMPTS &&
                data.player.blockedUntil &&
                Date.now() < data.player.blockedUntil
            ) {
                showGiftShop();
            } else {
                showGame();
            }

        } catch (error) {

            console.error(error);
            codeMessage.textContent = error.message;
            codeMessage.style.color = "#ef4b35";
        }

        setButtonLoading(verifyCodeButton, false, "VALIDER LE CODE", "VÉRIFICATION...");
    });


    function showGame() {

        intro.style.display = "block";
        wheelZone.style.display = "flex";
        giftShop.style.display = "none";
        blockedCard.style.display = "none";

        hideGameCards();

        spinButton.disabled = false;
    }

    function hideGameCards() {

        stopQuestionTimer();

        quiz.style.display = "none";
        specialCard.style.display = "none";
        riskChoice.style.display = "none";

        quizResult.textContent = "";
    }


    function stopQuestionTimer() {

        if (questionTimer) {
            clearInterval(questionTimer);
            questionTimer = null;
        }
    }

    function lockQuestion() {

        questionAnswered = true;

        document.querySelectorAll('input[name="reponse"]')
            .forEach(radio => { radio.disabled = true; });

        document.querySelector(".validate-button").disabled = true;
    }

    function startQuestionTimer() {

        stopQuestionTimer();

        let timeLeft = QUESTION_TIME;
        questionTime.textContent = timeLeft;

        questionTimer = setInterval(async () => {

            timeLeft--;
            questionTime.textContent = Math.max(timeLeft, 0);

            if (timeLeft > 0) return;

            stopQuestionTimer();

            if (questionAnswered) return;

            lockQuestion();

            quizResult.textContent = "Temps écoulé ! 0 point.";
            quizResult.style.color = "#ef4b35";

            try {
                const data = await api("/api/timeout", { method: "POST" });
                updatePlayerUI(data.player);
            } catch (error) {
                console.error(error);
            }

            currentQuestionId = null;

            setTimeout(() => {
                quiz.style.display = "none";
                quizResult.textContent = "";
                finishTurn();
            }, 1500);

        }, 1000);
    }


    function showQuestion(category, question, autoStart = true) {

        hideGameCards();

        currentCategory = category;
        currentQuestionId = question.id;
        questionAnswered = false;

        const segment = segments.find(item => item.id === category);

        quizCategory.textContent = segment
            ? segment.label.toUpperCase()
            : category.toUpperCase();

        questionEl.textContent = question.question;

        choixElements.forEach((element, index) => {
            element.textContent = question.choix[index] || "";
        });

        document.querySelectorAll('input[name="reponse"]')
            .forEach(radio => {
                radio.checked = false;
                radio.disabled = false;
            });

        document.querySelector(".validate-button").disabled = false;
        quizResult.textContent = "";
        questionTime.textContent = QUESTION_TIME;

        if (!autoStart) return;

        displayQuiz();
    }

    function displayQuiz() {

        quiz.style.display = "block";

        startQuestionTimer();

        setTimeout(() => {
            quiz.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    }

    quizForm.addEventListener("submit", async event => {

        event.preventDefault();

        if (questionAnswered || !currentQuestionId) return;

        const selected = document.querySelector('input[name="reponse"]:checked');

        if (!selected) {
            quizResult.textContent = "Choisis une réponse.";
            quizResult.style.color = "#ef4b35";
            return;
        }

        const answer = Number(selected.value);

        stopQuestionTimer();
        lockQuestion();

        quizResult.textContent = "Vérification...";
        quizResult.style.color = "#555";

        try {

            const data = await api("/api/answer", {
                method: "POST",
                body: JSON.stringify({ questionId: currentQuestionId, answer })
            });

            updatePlayerUI(data.player);

            quizResult.textContent = data.message;
            quizResult.style.color = data.correct ? "#00a5a5" : "#ef4b35";

            currentQuestionId = null;

            setTimeout(() => {
                quiz.style.display = "none";
                quizResult.textContent = "";
                finishTurn();
            }, 2000);

        } catch (error) {

            console.error(error);

            quizResult.textContent = error.message;
            quizResult.style.color = "#ef4b35";

            questionAnswered = false;

            document.querySelectorAll('input[name="reponse"]')
                .forEach(radio => { radio.disabled = false; });

            document.querySelector(".validate-button").disabled = false;

            startQuestionTimer();
        }
    });


    function showBonus(bonusText) {

        hideGameCards();

        specialTitle.textContent = "BONUS";
        specialText.textContent = bonusText;
        specialCard.style.display = "block";

        specialCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    specialButton.addEventListener("click", () => {

        specialCard.style.display = "none";
        resultBox.textContent = "Bonus obtenu !";

        finishTurn();
    });


    function showRisk() {

        hideGameCards();

        riskChoice.style.display = "block";
        riskChoice.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    acceptRisk.addEventListener("click", () => {

        riskChoice.style.display = "none";
        resultBox.textContent = "Risque accepté.";

        displayQuiz();
    });

    refuseRisk.addEventListener("click", async () => {

        try {

            const data = await api("/api/risk/refuse", { method: "POST" });

            riskChoice.style.display = "none";
            resultBox.textContent = data.message || "Risque refusé. Ton score ne change pas.";

            updatePlayerUI(data.player);

            currentQuestionId = null;

            finishTurn();

        } catch (error) {

            console.error(error);
            resultBox.textContent = error.message;
        }
    });


    spinButton.addEventListener("click", async () => {

        if (isSpinning) return;

        if (!authToken) {
            alert("Vérifie d'abord ton adresse email.");
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;

        hideGameCards();

        resultBox.textContent = "La roue tourne...";

        try {

            const data = await api("/api/spin", { method: "POST" });

            updatePlayerUI(data.player);

            const segment = data.segment;

            const winnerIndex = segments.findIndex(item => item.id === segment.id);

            if (winnerIndex === -1) {
                throw new Error("Segment de roue invalide.");
            }

            const offset = (Math.random() - 0.5) * segmentAngle * 0.8;
            const center = winnerIndex * segmentAngle + segmentAngle / 2;
            const target = 360 - (center + offset);
            const turns = (5 + Math.floor(Math.random() * 4)) * 360;
            const mod = ((currentRotation % 360) + 360) % 360;

            currentRotation += turns + (target - mod + 360) % 360;

            wheel.style.transform = `rotate(${currentRotation}deg)`;

            setTimeout(() => {

                resultBox.textContent = "Tu es tombé sur : " + segment.label;

                isSpinning = false;


                if (data.type === "bonus") {

                    showBonus(data.bonus);

                } else if (data.type === "question") {

                    if (segment.id === "risques") {
                        showQuestion(segment.id, data.question, false);
                        showRisk();
                    } else {
                        showQuestion(segment.id, data.question);
                    }

                } else {
                    finishTurn();
                }

            }, 4600);

        } catch (error) {

            console.error(error);

            isSpinning = false;

            if (error.status === 429) {

                const blockedUntil = error.data && error.data.blockedUntil;

                if (blockedUntil) {
                    player = {
                        ...(player || { score: 0, selectedGift: null }),
                        attempts: MAX_ATTEMPTS,
                        blockedUntil
                    };
                    updatePlayerUI(player);
                    showGiftShop();
                }

            } else {
                resultBox.textContent = error.message;
                spinButton.disabled = false;
            }
        }
    });


    function finishTurn() {

        stopQuestionTimer();

        if (player && player.attempts >= MAX_ATTEMPTS) {

            spinButton.disabled = true;
            remainingEl.textContent = "Tes 3 tours sont terminés.";

            setTimeout(showGiftShop, 500);

            return;
        }

        spinButton.disabled = false;
        resultBox.textContent = "Tu peux tourner la roue pour ton prochain tour.";
    }


    function showGiftShop() {

        hideGameCards();

        const score = player.score;

        scoreEl.textContent = score;
        finalScore.textContent = score;

        intro.style.display = "none";
        wheelZone.style.display = "none";
        giftShop.style.display = "block";

        giftList.innerHTML = "";
        giftMessage.innerHTML = "";
        giftMessage.style.display = "none";
        giftMessage.style.borderColor = "#00a5a5";
        giftMessage.style.background = "#edffff";
        giftMessage.style.color = "#111";

        if (player.selectedGift) {

            giftMessage.innerHTML = `
                <strong>BRAVO ! Tu as gagné un ${player.selectedGift} !</strong>
                <br>
                Présente cet écran à un membre de la NWS pour récupérer ton cadeau.
            `;
            giftMessage.style.display = "block";
        }

        gifts.forEach(gift => {

            const giftCard = document.createElement("div");
            giftCard.classList.add("gift");

            const title = document.createElement("h3");
            title.textContent = gift.name;

            const price = document.createElement("p");
            price.textContent = gift.price + " points";

            const button = document.createElement("button");

            if (score < gift.price) {

                giftCard.classList.add("unavailable");
                button.disabled = true;
                button.textContent = "PAS ASSEZ DE POINTS";

            } else if (player.selectedGift) {

                button.disabled = true;

                if (player.selectedGift === gift.name) {
                    giftCard.classList.add("selected");
                    button.textContent = "CADEAU CHOISI";
                } else {
                    button.textContent = "INDISPONIBLE";
                }

            } else {
                button.textContent = "CHOISIR CE CADEAU";
            }

            button.addEventListener("click", () => selectGift(gift, button));

            giftCard.appendChild(title);
            giftCard.appendChild(price);
            giftCard.appendChild(button);
            giftList.appendChild(giftCard);
        });

        if (!player.selectedGift && score < gifts[0].price) {

            giftMessage.textContent = "Ton score ne permet pas de choisir un cadeau.";
            giftMessage.style.display = "block";
            giftMessage.style.borderColor = "#ef4b35";
            giftMessage.style.background = "#fff5f4";
            giftMessage.style.color = "#ef4b35";
        }

        showBlocked();

        giftShop.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function selectGift(gift, button) {

        if (player.selectedGift || player.score < gift.price) return;

        button.disabled = true;

        try {

            const data = await api("/api/gift", {
                method: "POST",
                body: JSON.stringify({ gift: gift.name })
            });

            updatePlayerUI(data.player);
            showGiftShop();

        } catch (error) {

            console.error(error);

            button.disabled = false;

            giftMessage.textContent = error.message;
            giftMessage.style.display = "block";
            giftMessage.style.borderColor = "#ef4b35";
            giftMessage.style.background = "#fff5f4";
            giftMessage.style.color = "#ef4b35";
        }
    }


    function showBlocked() {

        spinButton.disabled = true;

        blockedCard.style.display = "block";

        chosenGiftText.textContent = player.selectedGift
            ? "Ton cadeau : " + player.selectedGift
            : "";

        updateCountdown(player.blockedUntil);

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            updateCountdown(player.blockedUntil);
        }, 1000);
    }

    async function updateCountdown(timestamp) {

        const difference = timestamp - Date.now();

        if (difference <= 0) {

            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }

            try {

                const data = await api("/api/status");

                updatePlayerUI(data.player);

                showGame();

                resultBox.textContent = "Tu peux rejouer !";
                remainingEl.textContent = "Tes 3 tours sont disponibles !";

            } catch (error) {
                console.error(error);
            }

            return;
        }

        const totalSeconds = Math.floor(difference / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countdown.textContent =
            String(hours).padStart(2, "0") + ":" +
            String(minutes).padStart(2, "0") + ":" +
            String(seconds).padStart(2, "0");
    }

});
