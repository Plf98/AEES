// script.js - Logique complète du quiz

// Questions du quiz (10 questions)
const quizData = [
    {
        question: "Quelle est la capitale de la France ?",
        options: ["Londres", "Berlin", "Paris", "Madrid"],
        correct: 2
    },
    {
        question: "Quel est le plus grand océan de la planète ?",
        options: ["Océan Atlantique", "Océan Indien", "Océan Arctique", "Océan Pacifique"],
        correct: 3
    },
    {
        question: "Qui a peint la Joconde ?",
        options: ["Van Gogh", "Picasso", "Léonard de Vinci", "Monet"],
        correct: 2
    },
    {
        question: "Quelle est la planète la plus proche du Soleil ?",
        options: ["Vénus", "Mercure", "Terre", "Mars"],
        correct: 1
    },
    {
        question: "En quelle année a eu lieu la Révolution française ?",
        options: ["1776", "1789", "1799", "1804"],
        correct: 1
    },
    {
        question: "Quel est le symbole chimique de l'or ?",
        options: ["Ag", "Fe", "Au", "Cu"],
        correct: 2
    },
    {
        question: "Qui a écrit 'Les Misérables' ?",
        options: ["Victor Hugo", "Émile Zola", "Gustave Flaubert", "Albert Camus"],
        correct: 0
    },
    {
        question: "Quel est le plus long fleuve du monde ?",
        options: ["Amazone", "Nil", "Yangtsé", "Mississippi"],
        correct: 1
    },
    {
        question: "Dans quel pays se trouve la tour de Pise ?",
        options: ["France", "Espagne", "Italie", "Grèce"],
        correct: 2
    },
    {
        question: "Quel est le plus grand animal terrestre ?",
        options: ["Éléphant d'Afrique", "Rhinocéros", "Hippopotame", "Girafe"],
        correct: 0
    }
];

// Variables globales
let currentQuestionIndex = 0;
let userAnswers = new Array(10).fill(null);
let timer = null;
let timeLeft = 15;
let isAnswered = false;
let isTransitioning = false;

// Éléments DOM
const questionCounter = document.getElementById('questionCounter');
const progressBar = document.getElementById('progressBar');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const quizContent = document.getElementById('quizContent');
const resultContainer = document.getElementById('resultContainer');
const finalScore = document.getElementById('finalScore');
const resultStats = document.getElementById('resultStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const timerProgress = document.querySelector('.timer-progress');
const timerText = document.getElementById('timerText');

// Initialisation
function initQuiz() {
    currentQuestionIndex = 0;
    userAnswers = new Array(10).fill(null);
    isAnswered = false;
    if (timer) clearInterval(timer);
    
    quizContent.style.display = 'flex';
    resultContainer.style.display = 'none';
    nextBtn.disabled = true;
    
    loadQuestion();
    updateProgress();
}

// Charger une question
function loadQuestion() {
    if (isTransitioning) return;
    
    clearTimer();
    isAnswered = false;
    nextBtn.disabled = true;
    timeLeft = 15;
    updateTimerDisplay();
    startTimer();
    
    const question = quizData[currentQuestionIndex];
    questionText.textContent = question.question;
    questionCounter.textContent = `Question ${currentQuestionIndex + 1}/${quizData.length}`;
    
    // Animation de transition
    optionsContainer.style.opacity = '0';
    setTimeout(() => {
        renderOptions();
        optionsContainer.style.opacity = '1';
    }, 200);
    
    // Si la question a déjà une réponse sauvegardée, la restaurer
    if (userAnswers[currentQuestionIndex] !== null) {
        const savedAnswer = userAnswers[currentQuestionIndex];
        setTimeout(() => {
            const selectedOption = document.querySelector(`.option[data-index='${savedAnswer}']`);
            if (selectedOption) {
                handleAnswerSelection(savedAnswer, false);
            }
        }, 250);
    }
}

// Afficher les options
function renderOptions() {
    const question = quizData[currentQuestionIndex];
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, idx) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.setAttribute('data-index', idx);
        optionDiv.addEventListener('click', () => {
            if (!isAnswered && !isTransitioning) {
                handleAnswerSelection(idx, true);
            }
        });
        optionsContainer.appendChild(optionDiv);
    });
}

// Gérer la sélection d'une réponse
function handleAnswerSelection(selectedIndex, isNewSelection) {
    if (isAnswered) return;
    
    const question = quizData[currentQuestionIndex];
    const isCorrect = (selectedIndex === question.correct);
    
    // Sauvegarder la réponse
    userAnswers[currentQuestionIndex] = selectedIndex;
    isAnswered = true;
    clearTimer();
    nextBtn.disabled = false;
    
    // Mettre en évidence les réponses
    const options = document.querySelectorAll('.option');
    
    if (isNewSelection) {
        // Surligner la réponse sélectionnée
        if (isCorrect) {
            options[selectedIndex].classList.add('selected-correct');
        } else {
            options[selectedIndex].classList.add('selected-wrong');
            // Afficher la bonne réponse en vert
            options[question.correct].classList.add('correct-highlight');
        }
    } else {
        // Restaurer l'affichage pour une réponse déjà sélectionnée
        if (selectedIndex === question.correct) {
            options[selectedIndex].classList.add('selected-correct');
        } else {
            options[selectedIndex].classList.add('selected-wrong');
            options[question.correct].classList.add('correct-highlight');
        }
    }
    
    // Désactiver toutes les options
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        opt.classList.add('disabled');
    });
}

// Passer à la question suivante
function nextQuestion() {
    if (isTransitioning) return;
    if (!isAnswered && userAnswers[currentQuestionIndex] === null) return;
    
    isTransitioning = true;
    
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
        updateProgress();
        
        // Animation de transition
        quizContent.style.animation = 'none';
        setTimeout(() => {
            quizContent.style.animation = 'fadeInUp 0.5s ease';
        }, 10);
    } else {
        // Fin du quiz
        finishQuiz();
    }
    
    setTimeout(() => {
        isTransitioning = false;
    }, 500);
}

// Terminer le quiz et afficher le score
function finishQuiz() {
    clearTimer();
    quizContent.style.display = 'none';
    resultContainer.style.display = 'block';
    
    // Calculer le score
    let score = 0;
    let correctAnswers = 0;
    quizData.forEach((question, idx) => {
        if (userAnswers[idx] === question.correct) {
            score++;
            correctAnswers++;
        }
    });
    
    finalScore.textContent = `Votre score : ${score}/${quizData.length}`;
    
    // Statistiques
    const percentage = (score / quizData.length) * 100;
    let message = "";
    if (percentage === 100) message = "🎉 Parfait ! Vous êtes un expert !";
    else if (percentage >= 80) message = "🌟 Excellent travail !";
    else if (percentage >= 60) message = "👍 Bien joué ! Continuez comme ça !";
    else if (percentage >= 40) message = "📚 Pas mal, mais vous pouvez faire mieux !";
    else message = "💪 Continuez à apprendre, vous allez y arriver !";
    
    resultStats.innerHTML = `${message}<br>Réponses correctes : ${correctAnswers}/${quizData.length}`;
}

// Recommencer le quiz
function restartQuiz() {
    if (isTransitioning) return;
    clearTimer();
    currentQuestionIndex = 0;
    userAnswers = new Array(10).fill(null);
    isAnswered = false;
    isTransitioning = false;
    
    quizContent.style.display = 'flex';
    resultContainer.style.display = 'none';
    nextBtn.disabled = true;
    
    loadQuestion();
    updateProgress();
}

// Mettre à jour la barre de progression
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Chronomètre
function startTimer() {
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        if (!isAnswered && timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft === 0) {
                // Temps écoulé
                clearTimer();
                
                // Si aucune réponse n'a été donnée
                if (!isAnswered && userAnswers[currentQuestionIndex] === null) {
                    // Marquer comme sans réponse (mauvaise réponse par défaut)
                    isAnswered = true;
                    nextBtn.disabled = false;
                    
                    // Afficher la bonne réponse
                    const question = quizData[currentQuestionIndex];
                    const options = document.querySelectorAll('.option');
                    options[question.correct].classList.add('correct-highlight');
                    
                    // Désactiver toutes les options
                    options.forEach(opt => {
                        opt.style.pointerEvents = 'none';
                        opt.classList.add('disabled');
                    });
                    
                    // Sauvegarder comme réponse incorrecte
                    userAnswers[currentQuestionIndex] = -1;
                    
                    // Passer automatiquement à la question suivante après un délai
                    setTimeout(() => {
                        if (currentQuestionIndex < quizData.length - 1) {
                            nextQuestion();
                        } else {
                            finishQuiz();
                        }
                    }, 1000);
                }
            }
        }
    }, 1000);
}

// Mettre à jour l'affichage du timer
function updateTimerDisplay() {
    timerText.textContent = timeLeft;
    const circumference = 2 * Math.PI * 22;
    const offset = circumference - (timeLeft / 15) * circumference;
    timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
    timerProgress.style.strokeDashoffset = offset;
    
    // Changer la couleur du timer quand il ne reste plus que 5 secondes
    if (timeLeft <= 5) {
        timerProgress.style.stroke = '#ff4444';
        timerText.style.color = '#ff4444';
    } else {
        timerProgress.style.stroke = '#ffd700';
        timerText.style.color = 'white';
    }
}

// Arrêter le chronomètre
function clearTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// Événements
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);
playAgainBtn.addEventListener('click', () => {
    restartQuiz();
});

// Initialiser le quiz
initQuiz();