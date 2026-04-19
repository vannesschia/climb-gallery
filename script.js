const climbGrid = document.getElementById("climbGrid");
const gradeFilter = document.getElementById("gradeFilter");
const gymFilter = document.getElementById("gymFilter");

const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalButton = document.getElementById("closeModal");
const modalIframe = document.getElementById("modalIframe");

const modalTitle = document.getElementById("modalTitle");
const modalGrade = document.getElementById("modalGrade");
const modalDate = document.getElementById("modalDate");
const modalGym = document.getElementById("modalGym");
const modalAddress = document.getElementById("modalAddress");
const modalNotes = document.getElementById("modalNotes");
const modalVideoId = document.getElementById("modalVideoId");

let climbs = [];

async function loadClimbs() {
  try {
    const response = await fetch("./data/climbs.json");

    if (!response.ok) {
      throw new Error(`Failed to load climbs: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected climbs.json to contain an array.");
    }

    climbs = data;
    populateFilters(climbs);
    applyFilters();
  } catch (error) {
    console.error(error);
    climbGrid.innerHTML = `
      <p class="error-state">
        Could not load climb data. Check that <code>./data/climbs.json</code> exists and that you are serving the site through a local server.
      </p>
    `;
  }
}

function populateFilters(climbList) {
  const grades = [...new Set(climbList.map(climb => climb.grade || "Unknown"))].sort();
  const gyms = [...new Set(climbList.map(climb => climb.gym?.name || "Unknown gym"))].sort();

  grades.forEach((grade) => {
    const option = document.createElement("option");
    option.value = grade;
    option.textContent = grade;
    gradeFilter.appendChild(option);
  });

  gyms.forEach((gym) => {
    const option = document.createElement("option");
    option.value = gym;
    option.textContent = gym;
    gymFilter.appendChild(option);
  });
}

function applyFilters() {
  const selectedGrade = gradeFilter.value;
  const selectedGym = gymFilter.value;

  const filteredClimbs = climbs.filter((climb) => {
    const climbGrade = climb.grade || "Unknown";
    const climbGym = climb.gym?.name || "Unknown gym";

    const matchesGrade = selectedGrade === "all" || climbGrade === selectedGrade;
    const matchesGym = selectedGym === "all" || climbGym === selectedGym;

    return matchesGrade && matchesGym;
  });

  renderClimbs(filteredClimbs);
}

function renderClimbs(climbList) {
  if (!climbList.length) {
    climbGrid.innerHTML = `<p class="empty-state">No climbs match the selected filters.</p>`;
    return;
  }

  climbGrid.innerHTML = "";

  climbList.forEach((climb) => {
    const card = document.createElement("button");
    card.className = "climb-card";
    card.type = "button";

    const thumbnailUrl = getThumbnailUrl(climb.video_player);
    const grade = climb.grade || "Unknown";
    const climbedDate = formatDate(climb.climbed_at);
    const gymName = climb.gym?.name || "Unknown gym";
    const gymAddress = climb.gym?.address || "No address available";
    const notes = climb.notes?.trim() ? climb.notes : "No notes added";

    card.innerHTML = `
      <div class="card-thumbnail">
        <img
          src="${thumbnailUrl}"
          alt="${escapeHtml(grade)} climb thumbnail at ${escapeHtml(gymName)}"
          loading="lazy"
        />
        <span class="play-badge">Play</span>
      </div>
      <div class="card-body">
        <div class="card-topline">
          <span class="grade-pill">${escapeHtml(grade)}</span>
          <span class="card-date">${escapeHtml(climbedDate)}</span>
        </div>
        <h3 class="card-gym">${escapeHtml(gymName)}</h3>
      </div>
    `;

    card.addEventListener("click", () => openModal(climb));
    climbGrid.appendChild(card);
  });
}

function openModal(climb) {
  const videoId = climb.video_player?.id || "";
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  modalIframe.src = embedUrl;

  const grade = climb.grade || "Unknown";
  const date = formatDate(climb.climbed_at);
  const gymName = climb.gym?.name || "Unknown gym";

  modalTitle.textContent = `${grade} Climb`;
  modalGrade.textContent = grade;
  modalDate.textContent = date;
  modalGym.textContent = gymName;
  modalAddress.textContent = climb.gym?.address || "No address available";
  modalNotes.textContent = climb.notes?.trim() ? climb.notes : "No notes added";
  modalVideoId.textContent = videoId || "Unavailable";

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeModalButton.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalIframe.src = "";
  document.body.style.overflow = "";
}

function getThumbnailUrl(videoPlayer) {
  if (videoPlayer?.service === "youtube" && videoPlayer?.id) {
    return `https://img.youtube.com/vi/${videoPlayer.id}/hqdefault.jpg`;
  }

  return "https://via.placeholder.com/640x360?text=No+Thumbnail";
}

function formatDate(dateString) {
  if (!dateString) return "Unknown date";

  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

gradeFilter.addEventListener("change", applyFilters);
gymFilter.addEventListener("change", applyFilters);

closeModalButton.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

loadClimbs();