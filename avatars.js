
// ========================================
// HAPPY DAY - FEATURES.JS
// ========================================


// ---------- 1. HELPER FUNCTIONS ----------

function hdRead(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function hdSave(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function hdToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function hdGetUser() {
    return hdRead("happyUser", null);
}

function hdGetStories() {
    return hdRead("happyDayStories", []);
}

function hdGetMyStories() {
    const user = hdGetUser();
    const stories = hdGetStories();

    if (!user) return [];

    return stories.filter(story =>
        story.email === user.email ||
        story.name === user.name
    );
}


// ---------- 2. DAILY HAPPINESS CHECK-IN ----------

function hdStartMood() {
    const moodForm = document.getElementById("moodForm");
    const moodMessage = document.getElementById("moodMessage");

    if (!moodForm) return;

    const savedMood = hdRead("hdMoodHistory", {});
    const todayMood = savedMood[hdToday()];

    if (todayMood && moodMessage) {
        moodMessage.textContent =
            `Today's mood: ${todayMood} 😊`;
    }

    moodForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const moodChoice = document.getElementById("moodChoice");

        if (!moodChoice || !moodChoice.value) return;

        const moods = hdRead("hdMoodHistory", {});
        moods[hdToday()] = moodChoice.value;

        hdSave("hdMoodHistory", moods);

        if (moodMessage) {
            moodMessage.textContent =
                `Your mood has been saved: ${moodChoice.value} 💙`;
        }

        hdUpdateBadges();
        hdUpdateStats();
    });
}


// ---------- 3. QUOTE OF THE DAY ----------

function hdStartQuote() {
    const quoteElement = document.getElementById("dailyQuote");

    if (!quoteElement) return;

    const quotes = [
        "Happiness is made of little moments.",
        "A smile can brighten someone's day.",
        "Every day is a new opportunity.",
        "Kindness makes the world better.",
        "Collect memories, not worries.",
        "You can make today amazing!",
        "Small acts of kindness matter.",
        "Choose happiness whenever you can.",
        "A happy heart makes a happy day.",
        "The best memories are shared."
    ];

    const quoteIndex = Math.floor(
        new Date().getFullYear() * 1000 +
        (new Date().getMonth() + 1) * 31 +
        new Date().getDate()
    ) % quotes.length;

    quoteElement.textContent = `"${quotes[quoteIndex]}"`;
}


// ---------- 4. HAPPINESS JAR ----------

function hdStartJar() {
    const jarButton = document.getElementById("openJarButton");
    const jarMemory = document.getElementById("jarMemory");

    if (!jarButton || !jarMemory) return;

    jarButton.addEventListener("click", function() {
        const stories = hdGetMyStories();

        if (stories.length === 0) {
            jarMemory.textContent =
                "Your jar is empty! Share a happy memory first. 💙";
            return;
        }

        const randomStory =
            stories[Math.floor(Math.random() * stories.length)];

        jarMemory.textContent =
            `✨ ${randomStory.title || randomStory.activity || "A Happy Memory"}: ` +
            `${randomStory.details || randomStory.special || randomStory.activity || "A wonderful day!"}`;
    });
}


// ---------- 5. HAPPINESS BADGES ----------

function hdUpdateBadges() {
    const badgeList = document.getElementById("badgeList");

    if (!badgeList) return;

    const stories = hdGetMyStories();
    const moods = hdRead("hdMoodHistory", {});
    const challenges = hdRead("hdChallengesCompleted", 0);

    const badges = [
        {
            name: "First Memory",
            icon: "📖",
            earned: stories.length >= 1
        },
        {
            name: "Memory Collector",
            icon: "🏆",
            earned: stories.length >= 5
        },
        {
            name: "Happiness Explorer",
            icon: "🌍",
            earned: Object.keys(moods).length >= 3
        },
        {
            name: "Kindness Champion",
            icon: "💙",
            earned: challenges >= 5
        },
        {
            name: "Super Storyteller",
            icon: "⭐",
            earned: stories.length >= 10
        }
    ];

    badgeList.innerHTML = "";

    badges.forEach(badge => {
        const item = document.createElement("p");

        item.textContent = badge.earned
            ? `${badge.icon} ${badge.name}`
            : `🔒 ${badge.name}`;

        badgeList.appendChild(item);
    });
}


// ---------- 6. RANDOM KINDNESS CHALLENGES ----------

function hdStartChallenge() {
    const challengeElement =
        document.getElementById("kindnessChallenge");

    const doneButton =
        document.getElementById("challengeDoneButton");

    const challengeMessage =
        document.getElementById("challengeMessage");

    if (!challengeElement || !doneButton) return;

    const challenges = [
        "Give someone a genuine compliment.",
        "Help someone with a task.",
        "Thank someone who helped you.",
        "Make someone laugh today.",
        "Share something with a friend.",
        "Write a kind message to someone.",
        "Help a family member.",
        "Include someone in a game.",
        "Tell someone why you appreciate them.",
        "Do something helpful without being asked."
    ];

    let currentChallenge = hdRead(
        "hdCurrentChallenge",
        challenges[0]
    );

    challengeElement.textContent = currentChallenge;

    doneButton.addEventListener("click", function() {
        let completed = hdRead("hdChallengesCompleted", 0);

        completed++;

        hdSave("hdChallengesCompleted", completed);

        const randomIndex = Math.floor(
            Math.random() * challenges.length
        );

        currentChallenge = challenges[randomIndex];

        hdSave("hdCurrentChallenge", currentChallenge);

        challengeElement.textContent = currentChallenge;

        if (challengeMessage) {
            challengeMessage.textContent =
                "Amazing! You completed a kindness challenge! 🎉";
        }

        hdUpdateBadges();
        hdUpdateStats();
    });
}


// ---------- 7. HAPPINESS AROUND THE WORLD ----------

function hdUpdateLocations() {
    const locationContainer =
        document.getElementById("worldLocations");

    if (!locationContainer) return;

    const stories = hdGetMyStories();

    locationContainer.innerHTML = "";

    const locations = [
        ...new Set(
            stories
                .map(story => story.location)
                .filter(location => location && location.trim())
        )
    ];

    if (locations.length === 0) {
        locationContainer.textContent =
            "Add a location when sharing a happy memory to see it here!";
        return;
    }

    locations.forEach(location => {
        const item = document.createElement("p");
        item.textContent = `📍 ${location}`;
        locationContainer.appendChild(item);
    });
}


// ---------- 8. MY HAPPINESS TIMELINE ----------

function hdUpdateTimeline() {
    const timeline = document.getElementById("myTimeline");

    if (!timeline) return;

    const stories = hdGetMyStories();

    timeline.innerHTML = "";

    if (stories.length === 0) {
        timeline.textContent =
            "Your memories will appear here when you share stories!";
        return;
    }

    const sortedStories = [...stories].reverse();

    sortedStories.forEach(story => {
        const item = document.createElement("div");

        item.style.padding = "10px";
        item.style.marginBottom = "10px";
        item.style.borderLeft = "4px solid #3784d0";

        const title = document.createElement("strong");
        title.textContent =
            story.title || story.activity || "Happy Memory";

        const date = document.createElement("p");
        date.textContent = story.submittedAt
            ? new Date(story.submittedAt).toLocaleDateString()
            : "Date unavailable";

        item.append(title, date);
        timeline.appendChild(item);
    });
}


// ---------- 9. COMMUNITY REACTIONS ----------

function hdAddReactions() {
    const container = document.getElementById("storiesContainer");

    if (!container) return;

    const reactions = ["❤️", "😊", "🎉", "👏"];

    function addReactionButtons() {
        const storyCards = container.querySelectorAll(
            ".story-card, .story"
        );

        storyCards.forEach((card, index) => {
            if (card.dataset.hdReactionsAdded === "true") return;

            card.dataset.hdReactionsAdded = "true";

            const reactionArea = document.createElement("div");
            reactionArea.className = "hd-reactions";

            reactions.forEach(reaction => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = reaction;

                button.addEventListener("click", function() {
                    const counts = hdRead("hdLocalReactions", {});
                    const key = `story-${index}-${reaction}`;

                    counts[key] = (counts[key] || 0) + 1;

                    hdSave("hdLocalReactions", counts);

                    button.textContent =
                        `${reaction} ${counts[key]}`;
                });

                reactionArea.appendChild(button);
            });

            card.appendChild(reactionArea);
        });
    }

    addReactionButtons();

    const observer = new MutationObserver(addReactionButtons);

    observer.observe(container, {
        childList: true,
        subtree: true
    });
}


// ---------- 10. HAPPINESS QUIZ ----------

function hdStartQuiz() {
    const quiz = document.getElementById("happinessQuiz");
    const result = document.getElementById("quizResult");

    if (!quiz) return;

    const questions = [
        {
            question: "What is a kind thing to do?",
            answers: [
                "Help someone",
                "Ignore everyone",
                "Make fun of someone"
            ],
            correct: 0
        },
        {
            question: "What can make someone's day better?",
            answers: [
                "Being unkind",
                "A friendly smile",
                "Being rude"
            ],
            correct: 1
        },
        {
            question: "What should you do when someone helps you?",
            answers: [
                "Say thank you",
                "Ignore them",
                "Complain"
            ],
            correct: 0
        }
    ];

    let currentQuestion = 0;
    let score = 0;

    function showQuestion() {
        quiz.innerHTML = "";

        if (currentQuestion >= questions.length) {
            quiz.innerHTML = "<h3>Quiz Complete! 🎉</h3>";

            if (result) {
                result.textContent =
                    `You scored ${score} out of ${questions.length}!`;
            }

            hdSave("hdLastQuizScore", score);
            hdUpdateStats();

            return;
        }

        const question = questions[currentQuestion];

        const heading = document.createElement("h4");
        heading.textContent =
            `Question ${currentQuestion + 1}: ${question.question}`;

        quiz.appendChild(heading);

        question.answers.forEach((answer, index) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "button";
            button.style.display = "block";
            button.style.margin = "8px 0";
            button.textContent = answer;

            button.addEventListener("click", function() {
                if (index === question.correct) {
                    score++;
                }

                currentQuestion++;
                showQuestion();
            });

            quiz.appendChild(button);
        });
    }

    showQuestion();
}


// ---------- 11. HAPPINESS STATISTICS ----------

function hdUpdateStats() {
    const stories = hdGetMyStories();
    const moods = hdRead("hdMoodHistory", {});
    const challenges = hdRead("hdChallengesCompleted", 0);
    const quizScore = hdRead("hdLastQuizScore", 0);

    const locations = [
        ...new Set(
            stories
                .map(story => story.location)
                .filter(Boolean)
        )
    ];

    const statStories = document.getElementById("statStories");
    const statLocations = document.getElementById("statLocations");
    const statCheckins = document.getElementById("statCheckins");
    const statChallenges = document.getElementById("statChallenges");
    const statQuiz = document.getElementById("statQuiz");

    if (statStories) statStories.textContent = stories.length;
    if (statLocations) statLocations.textContent = locations.length;
    if (statCheckins) statCheckins.textContent = Object.keys(moods).length;
    if (statChallenges) statChallenges.textContent = challenges;
    if (statQuiz) statQuiz.textContent = quizScore;
}


// ---------- 12. YOUR FEATURES BUTTON ----------

function hdStartFeaturesButton() {
    const button = document.getElementById("showFeaturesButton");
    const section = document.getElementById("yourFeaturesSection");

    if (!button || !section) return;

    button.addEventListener("click", function() {
        section.hidden = !section.hidden;

        button.textContent = section.hidden
            ? "✨ Your Features"
            : "✖ Close Features";

        if (!section.hidden) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            hdUpdateBadges();
            hdUpdateLocations();
            hdUpdateTimeline();
            hdUpdateStats();
        }
    });
}


// ---------- 13. LIVE DATE AND TIME ----------

function hdUpdateClock() {
    const dateElement = document.getElementById("currentDate");
    const timeElement = document.getElementById("currentTime");

    const now = new Date();

    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString("en-AE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString("en-AE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
}


// ---------- 14. PLAYER AVATAR ----------

function hdUpdatePlayerAvatar() {
    const user = hdGetUser();

    const nameElement = document.getElementById("topPlayerName");
    const avatarElement = document.getElementById("topPlayerAvatar");

    const avatarPicture = localStorage.getItem("happyAvatarPicture");

    if (nameElement) {
        nameElement.textContent = user?.name || "Guest Player";
    }

    if (avatarElement && avatarPicture) {
        avatarElement.src = avatarPicture;
    }
}


// ---------- START EVERYTHING ----------

function hdStartHappyDayFeatures() {
    hdStartMood();
    hdStartQuote();
    hdStartJar();
    hdStartChallenge();
    hdStartQuiz();
    hdStartFeaturesButton();

    hdUpdateBadges();
    hdUpdateLocations();
    hdUpdateTimeline();
    hdAddReactions();
    hdUpdateStats();

    hdUpdateClock();
    hdUpdatePlayerAvatar();

    setInterval(hdUpdateClock, 1000);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        hdStartHappyDayFeatures
    );
} else {
    hdStartHappyDayFeatures();
}
