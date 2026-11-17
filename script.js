
// =====================================
// HAPPY DAY - MAIN WEBSITE JAVASCRIPT
// =====================================

// Safely read saved JSON data.
function readSavedData(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error("Could not read " + key, error);
        return fallback;
    }
}

function showMessage(element, text, color) {
    if (!element) return;
    element.textContent = text;
    if (color) element.style.color = color;
}

// =====================================
// SIGN UP
// =====================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim() || "";
        const email = document.getElementById("email")?.value.trim().toLowerCase() || "";
        const password = document.getElementById("password")?.value || "";
        const message = document.getElementById("signupMessage");

        if (!name || !email || !password) {
            showMessage(message, "Please complete all fields.", "red");
            return;
        }

        const accounts = readSavedData("happyAccounts", []);
        const existingAccount = accounts.find(account => account.email === email);

        if (existingAccount) {
            showMessage(message, "This email already has an account. Please sign in.", "red");
            return;
        }

        accounts.push({ name, email, password });

        try {
            localStorage.setItem("happyAccounts", JSON.stringify(accounts));
            localStorage.setItem("happyUser", JSON.stringify({ name, email }));
            window.location.href = "Your Happy Days.html";
        } catch (error) {
            showMessage(message, "Your account could not be saved.", "red");
        }
    });
}

// =====================================
// SIGN IN
// =====================================

const loginButton = document.getElementById("loginButton");

if (loginButton) {
    loginButton.addEventListener("click", function() {
        const email = document.getElementById("email")?.value.trim().toLowerCase() || "";
        const password = document.getElementById("password")?.value || "";
        const message = document.getElementById("signupMessage");

        const accounts = readSavedData("happyAccounts", []);
        const user = accounts.find(account =>
            account.email === email && account.password === password
        );

        if (user) {
            localStorage.setItem("happyUser", JSON.stringify({
                name: user.name,
                email: user.email
            }));
            window.location.href = "Your Happy Days.html";
        } else {
            showMessage(message, "Incorrect email or password!", "red");
        }
    });
}

// =====================================
// HAPPY DAY FORM
// =====================================

const happyForm = document.getElementById("happyForm");

if (happyForm) {
    const currentUser = readSavedData("happyUser", null);
    const welcomeMessage = document.getElementById("welcomeMessage");

    if (!currentUser) {
        window.location.replace("signup.html");
    } else if (welcomeMessage) {
        welcomeMessage.textContent =
            "Welcome, " + currentUser.name + "! Write about your happy day below.";
    }

    const photoInput = document.getElementById("happyPhoto");
    const photoPreview = document.getElementById("photoPreview");
    const message = document.getElementById("formMessage");

    // Photo preview
    if (photoInput && photoPreview) {
        photoInput.addEventListener("change", function() {
            const file = photoInput.files?.[0];

            if (!file) {
                photoPreview.removeAttribute("src");
                photoPreview.hidden = true;
                return;
            }

            if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
                showMessage(message, "Please choose an image smaller than 1 MB.", "red");
                photoInput.value = "";
                photoPreview.hidden = true;
                return;
            }

            const reader = new FileReader();

            reader.onload = function() {
                photoPreview.src = reader.result;
                photoPreview.hidden = false;
            };

            reader.readAsDataURL(file);
        });
    }

    // Submit story
    happyForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const user = readSavedData("happyUser", null);

        if (!user) {
            window.location.href = "signup.html";
            return;
        }

        const title = document.getElementById("storyTitle")?.value.trim() || "";
        const activity = document.getElementById("happyDays")?.value.trim() || "";
        const special = document.getElementById("specialReason")?.value.trim() || "";
        const details = document.getElementById("interestingDetails")?.value.trim() || "";
        const location = document.getElementById("userLocation")?.value.trim() || "";
        const showEmail = document.getElementById("showEmail")?.checked || false;
        const photo = photoInput?.files?.[0];

        if (!title || !activity || !special || !details) {
            showMessage(message, "Please complete all four questions.", "red");
            return;
        }

        if (photo && (!photo.type.startsWith("image/") || photo.size > 1024 * 1024)) {
            showMessage(message, "Please choose an image smaller than 1 MB.", "red");
            return;
        }

        function saveStory(photoData) {
            const stories = readSavedData("happyDayStories", []);

            stories.push({
                name: user.name,
                email: showEmail ? user.email : "",
                title: title,
                activity: activity,
                special: special,
                details: details,
                location: location,
                photo: photoData || "",
                submittedAt: new Date().toISOString()
            });


// Keep only the 15 newest happy memories.
while (stories.length > 15) {
    stories.shift();
}


            try {
                localStorage.setItem("happyDayStories", JSON.stringify(stories));
                happyForm.reset();

                if (photoPreview) {
                    photoPreview.removeAttribute("src");
                    photoPreview.hidden = true;
                }

                showMessage(message, "Your happy day has been shared!", "green");

                window.setTimeout(function() {
                    window.location.href = "thankyou.html";
                }, 900);

            } catch (error) {
                showMessage(
                    message,
                    "Your story could not be saved. Try a smaller picture or remove it.",
                    "red"
                );
            }
        }

        if (photo) {
            const reader = new FileReader();

            reader.onload = function() {
                saveStory(reader.result);
            };

            reader.onerror = function() {
                showMessage(message, "Your picture could not be read.", "red");
            };

            reader.readAsDataURL(photo);
        } else {
            saveStory("");
        }
    });
}

// =====================================
// SIGN OUT
// =====================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function() {
        localStorage.removeItem("happyUser");
        window.location.href = "index.html";
    });
}

// =====================================
// COMMUNITY HAPPY DAYS
// =====================================

const storiesContainer = document.getElementById("storiesContainer");

if (storiesContainer) {
    const stories = readSavedData("happyDayStories", []);
    storiesContainer.innerHTML = "";

    if (stories.length === 0) {
        storiesContainer.textContent =
            "No happy days have been shared yet. Be the first!";
    } else {
        stories.slice().reverse().forEach(function(story, index) {
            const card = document.createElement("article");
            card.className = "story-card";

            const number = document.createElement("small");
            number.textContent = "Happy Memory #" + (stories.length - index);

            const title = document.createElement("h2");
            title.textContent = story.title || "A Happy Day";

            const author = document.createElement("p");
            author.textContent = "Shared by: " + (story.name || "Community member");

            card.append(number, title, author);

            function addSection(headingText, bodyText) {
                const heading = document.createElement("h3");
                heading.textContent = headingText;

                const paragraph = document.createElement("p");
                paragraph.textContent = bodyText || "Not provided.";

                card.append(heading, paragraph);
            }

            addSection("Event or Activity", story.activity || story.story);
            addSection("Why It Was Special", story.special);
            addSection("Interesting Details", story.details);

            if (story.location) {
                const location = document.createElement("p");
                location.textContent = "Location: " + story.location;
                card.appendChild(location);
            }

            if (story.submittedAt) {
                const date = new Date(story.submittedAt);
                const submitted = document.createElement("p");
                submitted.textContent = "Submitted: " +
                    (Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString());
                card.appendChild(submitted);
            }

            // NEW: Gmail and Outlook email options
            if (story.email) {
                const emailHeading = document.createElement("h3");
                emailHeading.textContent = "Send a Compliment";

                const emailDescription = document.createElement("p");
                emailDescription.textContent =
                    "Choose which email service you would like to use:";

                const emailOptions = document.createElement("div");
                emailOptions.className = "email-options";

                const subject = encodeURIComponent(
                    "A compliment about your Happy Day story"
                );

                const recipient = encodeURIComponent(story.email);

                const gmailLink = document.createElement("a");
                gmailLink.href =
                    "https://mail.google.com/mail/?view=cm&fs=1&to=" +
                    recipient + "&su=" + subject;
                gmailLink.textContent = "Send with Gmail";
                gmailLink.className = "email-link gmail-link";
                gmailLink.target = "_blank";
                gmailLink.rel = "noopener noreferrer";

                const outlookLink = document.createElement("a");
                outlookLink.href =
                    "https://outlook.office.com/mail/deeplink/compose?to=" +
                    recipient + "&subject=" + subject;
                outlookLink.textContent = "Send with Outlook";
                outlookLink.className = "email-link outlook-link";
                outlookLink.target = "_blank";
                outlookLink.rel = "noopener noreferrer";

                emailOptions.append(gmailLink, outlookLink);
                card.append(emailHeading, emailDescription, emailOptions);
            }

            if (story.photo) {
                const image = document.createElement("img");
                image.src = story.photo;
                image.alt = "Happy day shared by " +
                    (story.name || "a community member");
                image.className = "community-photo";
                image.loading = "lazy";
                card.appendChild(image);
            }

            storiesContainer.appendChild(card);
        });
    }
}

// =====================================
// 100 STOCK PHOTO GALLERY
// =====================================

const gallery = document.getElementById("happyGallery");

if (gallery) {
    const imageCount = document.getElementById("imageCount");

    const imageIDs = [
        7551181, 3865569, 6146961, 3777727,
        7551660, 3769021, 3812743, 3812744,
        3812745, 3812746, 3812747, 3812748,
        3812749, 3812750, 3812751, 3812752,
        3812753, 3812754, 3812755, 3812756,
        3812757, 3812758, 3812759, 3812760,
        3812761, 3812762, 3812763, 3812764,
        3812765, 3812766, 3812767, 3812768,
        3812769, 3812770, 3812771, 3812772,
        3812773, 3812774, 3812775, 3812776,
        3812777, 3812778, 3812779, 3812780,
        3812781, 3812782, 3812783, 3812784,
        3812785, 3812786, 3812787, 3812788,
        3812789, 3812790, 3812791, 3812792,
        3812793, 3812794, 3812795, 3812796,
        3812797, 3812798, 3812799, 3812800,
        3812801, 3812802, 3812803, 3812804,
        3812805, 3812806, 3812807, 3812808,
        3812809, 3812810, 3812811, 3812812,
        3812813, 3812814, 3812815, 3812816,
        3812817, 3812818, 3812819, 3812820,
        3812821, 3812822, 3812823, 3812824,
        3812825, 3812826, 3812827, 3812828,
        3812829, 3812830, 3812831, 3812832
    ];

    if (imageCount) {
        imageCount.textContent = "Showing 100 happy moment photo choices.";
    }

    imageIDs.forEach(function(id, index) {
        const card = document.createElement("div");
        card.className = "gallery-card";

        const image = document.createElement("img");
        image.src =
            "https://images.pexels.com/photos/" + id +
            "/pexels-photo-" + id +
            ".jpeg?auto=compress&cs=tinysrgb&w=600";
        image.alt = "Happy people - photo " + (index + 1);
        image.loading = "lazy";

        const heading = document.createElement("h3");
        heading.textContent = "Happy Moment #" + (index + 1);

        const link = document.createElement("a");
        link.href = "https://www.pexels.com/search/happy%20people/";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Explore Happy Photos";

        card.append(image, heading, link);
        gallery.appendChild(card);
    });
}

// =====================================
// HOME BUTTON
// =====================================

function goHome() {
    window.location.href = "index.html";
}
// HAPPY DAY RANDOM QUESTIONS

const reflectionForm = document.getElementById("reflectionForm");

if (reflectionForm) {
    const questions = [
        "Are there any sad moments you have encountered?",
        "Give me another happy moment.",
        "What is something that always makes you smile?",
        "Who is someone who has made your day special?",
        "What is your favourite memory with your friends?",
        "What is something new you have experienced recently?",
        "What is one thing you are grateful for?",
        "Where is your favourite place to spend time?",
        "What is something kind someone has done for you?",
        "What is one happy moment you hope to experience in the future?"
    ];

    const selectedQuestions = [...questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

    const questionsContainer = document.getElementById("randomQuestions");

    selectedQuestions.forEach((question, index) => {
        const group = document.createElement("div");
        group.className = "form-group";

        const label = document.createElement("label");
        label.textContent = `${index + 1}. ${question}`;

        const textarea = document.createElement("textarea");
        textarea.required = true;
        textarea.name = `answer${index + 1}`;
        textarea.placeholder = "Write your answer here...";

        group.appendChild(label);
        group.appendChild(textarea);
        questionsContainer.appendChild(group);
    });

    reflectionForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const answers = selectedQuestions.map((question, index) => ({
            question: question,
            answer: reflectionForm.elements[`answer${index + 1}`].value
        }));

        const savedAnswers = JSON.parse(
            localStorage.getItem("happyDayQuestionAnswers") || "[]"
        );

        savedAnswers.push({
            answers: answers,
            submittedAt: new Date().toISOString()
        });

        localStorage.setItem(
            "happyDayQuestionAnswers",
            JSON.stringify(savedAnswers)
        );

        reflectionForm.hidden = true;

        document.getElementById("reflectionMessage").textContent =
            "Your answers have been saved!";

        document.getElementById("reflectionSuccess").hidden = false;
    });
}