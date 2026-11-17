
// =====================================
// HAPPY DAY - 10 NEW FEATURES
// =====================================

function hdRead(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
        return fallback;
    }
}

function hdSave(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function hdToday() {
    return new Date().toISOString().slice(0, 10);
}

function hdStories() {
    return hdRead("happyDayStories", []);
}

function hdOwnStories() {
    const user = hdRead("happyUser", null);
    if (!user) return [];

    return hdStories().filter(story =>
        story.name === user.name
    );
}

// 1. DAILY MOOD CHECK-IN
const moodForm = document.getElementById("moodForm");

if (moodForm) {
    const moods = hdRead("happyDayMoods", {});
    const message = document.getElementById("moodMessage");

    if (moods[hdToday()]) {
        const saved = moodForm.querySelector(
            `[value="${moods[hdToday()]}"]`
        );
        if (saved) saved.checked = true;
        message.textContent = "Today's mood: " + moods[hdToday()];
    }

    moodForm.addEventListener("submit", event => {
        event.preventDefault();

        const selected = moodForm.querySelector(
            'input[name="mood"]:checked'
        );

        if (!selected) {
            message.textContent = "Choose your mood first!";
            return;
        }

        moods[hdToday()] = selected.value;
        hdSave("happyDayMoods", moods);
        message.textContent = "Mood saved successfully!";
        hdUpdateBadges();
        hdUpdateStats();
    });
}

// 2. QUOTE OF THE DAY
const quotes = [
    "Happiness grows when it is shared.",
    "Small moments create wonderful memories.",
    "A little kindness makes a big difference.",
    "Look for something good in every day.",
    "Your smile might brighten someone's day.",
    "Make today a day worth remembering.",
    "Joy is found in the moments we appreciate.",
    "Every day is a new opportunity.",
    "Kindness costs nothing but means everything.",
    "Collect moments, not things."
];

const dailyQuote = document.getElementById("dailyQuote");

if (dailyQuote) {
    const day = Math.floor(Date.now() / 86400000);
    dailyQuote.textContent = "“" + quotes[day % quotes.length] + "”";
}

// 3. HAPPINESS JAR
const jarButton = document.getElementById("openJarButton");

if (jarButton) {
    jarButton.addEventListener("click", () => {
        const memories = hdOwnStories();
        const output = document.getElementById("jarMemory");

        if (!memories.length) {
            output.textContent = "Share a memory first!";
            return;
        }

        const memory = memories[
            Math.floor(Math.random() * memories.length)
        ];

        output.textContent =
            memory.title + ": " + memory.activity;
    });
}

// 4. HAPPINESS BADGES
function hdGetBadges() {
    const stories = hdOwnStories();
    const moods = hdRead("happyDayMoods", {});
    const challenges = hdRead("hdChallengesDone", []);
    const quiz = hdRead("hdQuizDone", false);

    const badges = [];

    if (stories.length >= 1)
        badges.push("🏅 First Memory");

    if (stories.length >= 5)
        badges.push("🏅 Memory Collector");

    if (Object.keys(moods).length >= 1)
        badges.push("🏅 First Check-in");

    if (Object.keys(moods).length >= 7)
        badges.push("🏅 Weekly Checker");

    if (challenges.length >= 1)
        badges.push("🏅 Kindness Starter");

    if (challenges.length >= 5)
        badges.push("🏅 Kindness Champion");

    if (quiz)
        badges.push("🏅 Happiness Explorer");

    return badges;
}

function hdUpdateBadges() {
    const container = document.getElementById("badgeList");
    if (!container) return;

    container.innerHTML = "";

    const badges = hdGetBadges();

    if (!badges.length) {
        container.textContent = "Your badges will appear here!";
        return;
    }

    badges.forEach(badge => {
        const p = document.createElement("p");
        p.textContent = badge;
        container.appendChild(p);
    });
}

// 5. DAILY KINDNESS CHALLENGE
const challenges = [
    "Give someone a genuine compliment.",
    "Thank someone who helped you.",
    "Help with a small task.",
    "Invite someone to join your activity.",
    "Send a kind message.",
    "Listen carefully to someone.",
    "Share something that made you smile.",
    "Help your family today.",
    "Make someone feel included.",
    "Write down three things you appreciate."
];

const challengeText = document.getElementById("kindnessChallenge");

if (challengeText) {
    const day = Math.floor(Date.now() / 86400000);
    challengeText.textContent = challenges[day % challenges.length];
}

const challengeButton = document.getElementById("challengeDoneButton");

if (challengeButton) {
    challengeButton.addEventListener("click", () => {
        const done = hdRead("hdChallengesDone", []);

        if (!done.includes(hdToday())) {
            done.push(hdToday());
            hdSave("hdChallengesDone", done);
        }

        document.getElementById("challengeMessage").textContent =
            "Challenge completed! Well done!";

        challengeButton.disabled = true;
        hdUpdateBadges();
        hdUpdateStats();
    });

    if (hdRead("hdChallengesDone", []).includes(hdToday())) {
        challengeButton.disabled = true;
    }
}

// 6. HAPPINESS AROUND THE WORLD
function hdUpdateLocations() {
    const container = document.getElementById("worldLocations");
    if (!container) return;

    container.innerHTML = "";

    const locations = [
        ...new Set(
            hdStories()
                .map(story => story.location)
                .filter(Boolean)
        )
    ];

    if (!locations.length) {
        container.textContent = "No locations shared yet.";
        return;
    }

    locations.forEach(location => {
        const p = document.createElement("p");
        p.textContent = "📍 " + location;
        container.appendChild(p);
    });
}

// 7. MY HAPPINESS TIMELINE
function hdUpdateTimeline() {
    const container = document.getElementById("myTimeline");
    if (!container) return;

    container.innerHTML = "";

    const stories = hdOwnStories().sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
    );

    if (!stories.length) {
        container.textContent = "Share your first memory to start your timeline!";
        return;
    }

    stories.forEach(story => {
        const item = document.createElement("article");
        item.className = "hd-timeline-item";

        const title = document.createElement("h3");
        title.textContent = story.title || "Happy Day";

        const activity = document.createElement("p");
        activity.textContent = story.activity || "";

        const date = document.createElement("small");
        const parsed = new Date(story.submittedAt);
        date.textContent = Number.isNaN(parsed.getTime())
            ? ""
            : parsed.toLocaleDateString();

        item.append(title, activity, date);
        container.appendChild(item);
    });
}

// 8. COMMUNITY REACTIONS
function hdAddReactions() {
    const container = document.getElementById("storiesContainer");
    if (!container) return;

    const stories = hdStories().slice().reverse();
    const counts = hdRead("hdReactionCounts", {});
    const cards = container.querySelectorAll(".story-card");

    cards.forEach((card, index) => {
        const story = stories[index];
        if (!story) return;

        const key = story.submittedAt || story.title + index;
        const panel = document.createElement("div");
        panel.className = "hd-reactions";

        ["❤️", "😊", "🎉", "👏"].forEach(emoji => {
            const button = document.createElement("button");
            button.type = "button";

            const number = counts[key]?.[emoji] || 0;
            button.textContent = emoji + " " + number;

            button.addEventListener("click", () => {
                const latest = hdRead("hdReactionCounts", {});
                latest[key] = latest[key] || {};
                latest[key][emoji] = (latest[key][emoji] || 0) + 1;

                hdSave("hdReactionCounts", latest);
                button.textContent = emoji + " " + latest[key][emoji];
                button.disabled = true;
                hdUpdateStats();
            });

            panel.appendChild(button);
        });

        card.appendChild(panel);
    });
}

// 9. HAPPINESS QUIZ
function hdStartQuiz() {
    const form = document.getElementById("happinessQuiz");
    const result = document.getElementById("quizResult");

    if (!form || !result) return;

    const questions = [
        {
            question: "What is a kind thing to do?",
            answers: ["Help someone", "Ignore someone", "Laugh at someone"],
            correct: 0
        },
        {
            question: "What can help preserve a happy memory?",
            answers: ["Writing it down", "Forgetting it", "Deleting it"],
            correct: 0
        },
        {
            question: "What can make someone feel included?",
            answers: ["Inviting them to join", "Ignoring them", "Leaving them out"],
            correct: 0
        }
    ];

    form.innerHTML = "";

    questions.forEach((question, index) => {
        const group = document.createElement("fieldset");
        const heading = document.createElement("legend");
        heading.textContent = question.question;
        group.appendChild(heading);

        question.answers.forEach((answer, answerIndex) => {
            const label = document.createElement("label");
            const input = document.createElement("input");

            input.type = "radio";
            input.name = "quiz" + index;
            input.value = answerIndex;
            input.required = true;

            label.append(input, document.createTextNode(answer));
            group.appendChild(label);
        });

        form.appendChild(group);
    });

    const submit = document.createElement("button");
    submit.textContent = "Submit Quiz";
    submit.type = "submit";
    form.appendChild(submit);

    form.addEventListener("submit", event => {
        event.preventDefault();

        let score = 0;

        questions.forEach((question, index) => {
            const selected = form.querySelector(
                `input[name="quiz${index}"]:checked`
            );

            if (Number(selected.value) === question.correct) {
                score++;
            }
        });

        result.textContent =
            "You scored " + score + " out of " + questions.length + "!";

        hdSave("hdQuizDone", true);
        hdUpdateBadges();
        hdUpdateStats();
    });
}

// 10. HAPPINESS STATISTICS
function hdUpdateStats() {
    const stories = hdStories();
    const moods = hdRead("happyDayMoods", {});
    const challenges = hdRead("hdChallengesDone", []);
    const locations = new Set(
        stories.map(story => story.location).filter(Boolean)
    );

    const stats = {
        Stories: stories.length,
        Locations: locations.size,
        Checkins: Object.keys(moods).length,
        Challenges: challenges.length,
        Quiz: hdRead("hdQuizDone", false) ? 1 : 0
    };

    Object.entries(stats).forEach(([name, value]) => {
        const element = document.getElementById("stat" + name);
        if (element) element.textContent = value;
    });
}

// START FEATURES
document.addEventListener("DOMContentLoaded", () => {
    hdUpdateBadges();
    hdUpdateLocations();
    hdUpdateTimeline();
    hdAddReactions();
    hdStartQuiz();
    hdUpdateStats();
});
