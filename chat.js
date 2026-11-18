
const FRIENDS_KEY = "happyDayChatFriends";
const BLOCKED_KEY = "happyDayBlockedFriends";
const DB_NAME = "HappyDayChatDatabase";
const DB_VERSION = 1;

const $ = id => document.getElementById(id);

const addFriendForm = $("addFriendForm");
const friendEmail = $("friendEmail");
const friendMessage = $("friendMessage");
const friendSearch = $("friendSearch");
const friendsList = $("friendsList");
const friendCount = $("friendCount");

const chatAvatar = $("chatAvatar");
const chatFriendName = $("chatFriendName");
const chatStatus = $("chatStatus");
const messagesArea = $("messages");

const messageForm = $("messageForm");
const messageInput = $("messageInput");
const sendButton = $("sendButton");
const chatMenuButton = $("friendMenuButton");
const friendMenu = $("friendMenu");
const blockButton = $("blockFriendButton");
const reportButton = $("reportFriendButton");

const voiceButton = $("voiceButton");
const recordingStatus = $("recordingStatus");

let friends = readStorage(FRIENDS_KEY, []);
let blockedFriends = readStorage(BLOCKED_KEY, []);
let activeFriend = null;
let database = null;

let mediaRecorder = null;
let microphoneStream = null;
let audioChunks = [];
let recordingFriend = null;
let recordingTimer = null;

const MAX_RECORDING_SECONDS = 60;

/* LOCAL STORAGE */

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFriendName(email) {
    return email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function getInitial(name) {
    return name.trim().charAt(0).toUpperCase() || "?";
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* DATABASE FOR MESSAGES AND VOICE NOTES */

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("Your browser does not support IndexedDB."));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("messages")) {
                const store = db.createObjectStore("messages", {
                    keyPath: "id",
                    autoIncrement: true
                });

                store.createIndex("friendEmail", "friendEmail", {
                    unique: false
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function saveMessage(friendEmailAddress, message) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction("messages", "readwrite");
        const store = transaction.objectStore("messages");

        store.add({
            friendEmail: friendEmailAddress,
            ...message
        });

        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
}

function getMessages(friendEmailAddress) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction("messages", "readonly");
        const store = transaction.objectStore("messages");
        const index = store.index("friendEmail");
        const request = index.getAll(friendEmailAddress);

        request.onsuccess = () => {
            const results = request.result.sort((a, b) =>
                new Date(a.time) - new Date(b.time)
            );
            resolve(results);
        };

        request.onerror = () => reject(request.error);
    });
}

function getLastMessagePreview(message) {
    if (!message) return "Start a conversation!";
    if (message.audio) return "🎙️ Voice note";
    return message.text || "Message";
}

/* FRIEND LIST */

function renderFriends() {
    friendsList.replaceChildren();

    const search = friendSearch.value.toLowerCase().trim();

    const visibleFriends = friends.filter(friend =>
        !blockedFriends.includes(friend.email) &&
        (
            friend.name.toLowerCase().includes(search) ||
            friend.email.toLowerCase().includes(search)
        )
    );

    friendCount.textContent = friends.filter(friend =>
        !blockedFriends.includes(friend.email)
    ).length;

    if (visibleFriends.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-friends";
        empty.textContent = search
            ? "No matching friends found."
            : "No friends yet. Add a friend above to get started.";

        friendsList.appendChild(empty);
        return;
    }

    visibleFriends.forEach(friend => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "friend-card";

        if (activeFriend === friend.email) {
            card.classList.add("active");
        }

        const avatar = document.createElement("div");
        avatar.className = "friend-avatar";
        avatar.textContent = getInitial(friend.name);

        const info = document.createElement("div");
        info.className = "friend-info";

        const name = document.createElement("strong");
        name.textContent = friend.name;

        const preview = document.createElement("small");
        preview.textContent = "Open conversation";

        info.append(name, preview);
        card.append(avatar, info);

        card.addEventListener("click", () => {
            openConversation(friend.email);
        });

        friendsList.appendChild(card);

        updateFriendPreview(friend.email, preview);
    });
}

async function updateFriendPreview(email, previewElement) {
    try {
        const messages = await getMessages(email);
        if (messages.length) {
            previewElement.textContent = getLastMessagePreview(
                messages[messages.length - 1]
            );
        }
    } catch (error) {
        console.error("Could not load message preview:", error);
    }
}

addFriendForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = friendEmail.value.trim().toLowerCase();

    if (!email) return;

    if (blockedFriends.includes(email)) {
        friendMessage.textContent = "This email address is blocked.";
        return;
    }

    if (friends.some(friend => friend.email === email)) {
        friendMessage.textContent = "This friend is already in your list.";
        return;
    }

    const friend = {
        email,
        name: getFriendName(email)
    };

    friends.push(friend);
    saveStorage(FRIENDS_KEY, friends);

    friendEmail.value = "";
    friendMessage.textContent = "Friend added to your chat list.";

    renderFriends();
    openConversation(email);
});

/* OPEN CONVERSATION */

async function openConversation(email) {
    const friend = friends.find(item => item.email === email);

    if (!friend || blockedFriends.includes(email)) return;

    activeFriend = email;

    chatAvatar.textContent = getInitial(friend.name);
    chatFriendName.textContent = friend.name;
    chatStatus.textContent = friend.email;

    messageInput.disabled = false;
    messageInput.placeholder = "Type a message...";
    sendButton.disabled = false;
    voiceButton.disabled = false;

    friendMenu.hidden = true;
    chatMessageClear();

    renderFriends();
    await renderMessages();
}

function chatMessageClear() {
    recordingStatus.textContent = "";
}

/* DISPLAY MESSAGES */

async function renderMessages() {
    messagesArea.replaceChildren();

    if (!activeFriend) {
        showWelcomeMessage();
        return;
    }

    const selectedFriend = activeFriend;
    const messages = await getMessages(selectedFriend);

    if (selectedFriend !== activeFriend) return;

    if (messages.length === 0) {
        const empty = document.createElement("div");
        empty.className = "welcome-chat";

        const icon = document.createElement("div");
        icon.className = "welcome-icon";
        icon.textContent = "👋";

        const heading = document.createElement("h2");
        heading.textContent = "Say hello!";

        const description = document.createElement("p");
        description.textContent =
            "Your conversation starts with your first message.";

        empty.append(icon, heading, description);
        messagesArea.appendChild(empty);
        return;
    }

    messages.forEach(message => {
        const bubble = document.createElement("div");
        bubble.className = "message";

        if (message.sender === "me") {
            bubble.classList.add("mine");
        }

        if (message.audio) {
            const voice = document.createElement("div");
            voice.className = "voice-message";

            const icon = document.createElement("span");
            icon.textContent = "🎙️";

            const audio = document.createElement("audio");
            audio.controls = true;
            audio.preload = "metadata";
            audio.src = URL.createObjectURL(message.audio);

            voice.append(icon, audio);
            bubble.appendChild(voice);
        } else {
            const text = document.createElement("div");
            text.textContent = message.text;
            bubble.appendChild(text);
        }

        const time = document.createElement("small");
        time.className = "message-time";
        time.textContent = formatTime(message.time);

        bubble.appendChild(time);
        messagesArea.appendChild(bubble);
    });

    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showWelcomeMessage() {
    const welcome = document.createElement("div");
    welcome.className = "welcome-chat";

    const icon = document.createElement("div");
    icon.className = "welcome-icon";
    icon.textContent = "💬";

    const heading = document.createElement("h2");
    heading.textContent = "Your happy conversations start here";

    const description = document.createElement("p");
    description.textContent =
        "Add a friend or choose someone from your chat list.";

    welcome.append(icon, heading, description);
    messagesArea.appendChild(welcome);
}

/* SEND TEXT MESSAGE */

messageForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!activeFriend) {
        recordingStatus.textContent = "Choose a friend first.";
        return;
    }

    const text = messageInput.value.trim();

    if (!text) return;

    const recipient = activeFriend;

    sendButton.disabled = true;

    try {
        await saveMessage(recipient, {
            text,
            sender: "me",
            time: new Date().toISOString()
        });

        messageInput.value = "";
        recordingStatus.textContent = "";

        await renderMessages();
        renderFriends();
    } catch (error) {
        console.error(error);
        recordingStatus.textContent = "Could not save your message.";
    } finally {
        sendButton.disabled = !activeFriend;
    }
});

/* VOICE NOTES */

async function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }
}

voiceButton.addEventListener("click", async () => {
    if (!activeFriend) {
        recordingStatus.textContent = "Choose a friend first.";
        return;
    }

    if (mediaRecorder && mediaRecorder.state === "recording") {
        stopRecording();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        recordingStatus.textContent =
            "Voice recording is not supported in this browser.";
        return;
    }

    try {
        recordingFriend = activeFriend;

        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        audioChunks = [];

        mediaRecorder = new MediaRecorder(microphoneStream);

        mediaRecorder.addEventListener("dataavailable", event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener("stop", async () => {
            clearTimeout(recordingTimer);

            const audioBlob = new Blob(audioChunks, {
                type: mediaRecorder.mimeType || "audio/webm"
            });

            microphoneStream?.getTracks().forEach(track => track.stop());
            microphoneStream = null;

            voiceButton.classList.remove("recording");
            voiceButton.textContent = "🎙️";

            const recipient = recordingFriend;
            recordingFriend = null;

            if (!audioBlob.size) {
                recordingStatus.textContent = "No audio was recorded.";
                return;
            }

            try {
                await saveMessage(recipient, {
                    audio: audioBlob,
                    sender: "me",
                    time: new Date().toISOString()
                });

                if (activeFriend === recipient) {
                    await renderMessages();
                }

                renderFriends();
                recordingStatus.textContent = "Voice note saved!";
            } catch (error) {
                console.error(error);
                recordingStatus.textContent =
                    "Could not save the voice note. Try a shorter recording.";
            }
        });

        mediaRecorder.start();

        voiceButton.classList.add("recording");
        voiceButton.textContent = "⏹️";

        recordingStatus.textContent =
            "Recording... Click ⏹️ to finish. Maximum 60 seconds.";

        recordingTimer = setTimeout(() => {
            if (mediaRecorder?.state === "recording") {
                recordingStatus.textContent = "60-second limit reached.";
                stopRecording();
            }
        }, MAX_RECORDING_SECONDS * 1000);

    } catch (error) {
        console.error(error);
        microphoneStream?.getTracks().forEach(track => track.stop());
        microphoneStream = null;

        recordingStatus.textContent =
            "Microphone permission was denied or unavailable.";
    }
});

/* SEARCH */

friendSearch.addEventListener("input", renderFriends);

/* MENU */

chatMenuButton.addEventListener("click", () => {
    if (!activeFriend) {
        recordingStatus.textContent = "Choose a friend first.";
        return;
    }

    friendMenu.hidden = !friendMenu.hidden;
});

document.addEventListener("click", event => {
    if (
        !friendMenu.contains(event.target) &&
        !chatMenuButton.contains(event.target)
    ) {
        friendMenu.hidden = true;
    }
});

/* BLOCK FRIEND */

blockButton.addEventListener("click", () => {
    if (!activeFriend) return;

    const friend = friends.find(item => item.email === activeFriend);

    if (!friend) return;

    if (!confirm(`Block ${friend.name}?`)) return;

    blockedFriends.push(activeFriend);
    saveStorage(BLOCKED_KEY, blockedFriends);

    activeFriend = null;
    resetConversation();
    renderFriends();
});

/* REPORT FRIEND */

reportButton.addEventListener("click", () => {
    if (!activeFriend) return;

    const friend = friends.find(item => item.email === activeFriend);

    if (!friend) return;

    const reason = prompt(`Why would you like to report ${friend.name}?`);

    if (reason === null) return;

    if (!reason.trim()) {
        recordingStatus.textContent = "Please enter a reason.";
        return;
    }

    recordingStatus.textContent =
        "Report recorded in this browser only. It has not been sent.";

    friendMenu.hidden = true;
});

/* RESET CHAT */

function resetConversation() {
    chatAvatar.textContent = "?";
    chatFriendName.textContent = "Welcome to Happy Day";
    chatStatus.textContent = "Choose a friend to start chatting";

    messageInput.value = "";
    messageInput.disabled = true;
    messageInput.placeholder = "Choose a friend first...";
    sendButton.disabled = true;
    voiceButton.disabled = true;

    friendMenu.hidden = true;
    recordingStatus.textContent = "Friend blocked.";

    showWelcomeMessage();
}

/* START */

async function startChat() {
    voiceButton.disabled = true;

    try {
        database = await openDatabase();

        renderFriends();
        showWelcomeMessage();

    } catch (error) {
        console.error(error);
        recordingStatus.textContent =
            "Could not open chat storage. Try another browser.";
    }
}

startChat();
