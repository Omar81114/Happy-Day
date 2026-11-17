
const PEXELS_API_KEY = "PASTE_YOUR_PEXELS_API_KEY_HERE";

const gallery = document.getElementById("happyGallery");
const counter = document.getElementById("imageCount");

const searches = [
  { query: "happy boys smiling", label: "Happy Boys" },
  { query: "happy girls smiling", label: "Happy Girls" },
  { query: "happy families together smiling", label: "Happy Families" },
  { query: "happy friends laughing together", label: "Happy Friends" }
];

async function getPhotos(query) {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=80&page=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: PEXELS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error("Could not retrieve photos from Pexels.");
  }

  const data = await response.json();
  return data.photos || [];
}

function createPhotoCard(photo, label) {
  const card = document.createElement("div");
  card.className = "happy-card";

  const img = document.createElement("img");
  img.src = photo.src.large;
  img.alt = photo.alt || label;
  img.loading = "lazy";

  const caption = document.createElement("p");
  caption.textContent = label;

  card.appendChild(img);
  card.appendChild(caption);

  return card;
}

async function loadGallery() {
  if (!gallery || !counter) return;

  gallery.innerHTML = "";
  counter.textContent = "Finding 100 happy photos...";

  if (PEXELS_API_KEY.includes("PASTE_YOUR")) {
    counter.textContent = "Please add your Pexels API key in gallery.js.";
    return;
  }

  try {
    const usedPhotos = new Set();
    const selectedPhotos = [];

    for (const search of searches) {
      const photos = await getPhotos(search.query);
      let added = 0;

      for (const photo of photos) {
        if (usedPhotos.has(photo.id)) continue;

        usedPhotos.add(photo.id);
        selectedPhotos.push({
          photo: photo,
          label: search.label
        });

        added++;

        if (added === 25) break;
      }
    }

    if (selectedPhotos.length !== 100) {
      counter.textContent =
        `Only ${selectedPhotos.length} different photos were found. Please try again later.`;
    }

    selectedPhotos.forEach(item => {
      gallery.appendChild(
        createPhotoCard(item.photo, item.label)
      );
    });

    if (selectedPhotos.length === 100) {
      counter.textContent = "All 100 happy photos loaded!";
    }

  } catch (error) {
    console.error(error);
    counter.textContent =
      "Photos could not load. Check your API key and internet connection.";
  }
}

function goHome() {
  window.location.href = "index.html";
}

loadGallery();
