// =================================================================================
// NFL Page Script - Revamped with Correct Search Functionality
// =================================================================================

// ------------------------------------
// SEARCH FUNCTIONS (Corrected to match Watch Page)
// ------------------------------------
let allMatchesCache = [];
let searchDataFetched = false;

// This function creates the detailed search card, identical to the Watch page.
function createMatchCard(match) {
    const card = document.createElement("div");
    card.className = "search-result-item";
    
    const poster = document.createElement("img");
    poster.className = "match-poster";
    poster.src = (match.teams?.home?.badge && match.teams?.away?.badge) ? `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp` : "https://nflbite.top/Fallbackimage.webp";
    poster.alt = match.title || "Match Poster";
    poster.loading = "lazy";
    poster.onerror = () => { poster.onerror = null; poster.src = "/Fallbackimage.webp"; };
    
    const { badge, badgeType, meta } = formatDateTime(match.date);
    const statusBadge = document.createElement("div");
    statusBadge.classList.add("status-badge", badgeType);
    statusBadge.textContent = badge;
    
    const info = document.createElement("div");
    info.classList.add("match-info");
    
    const title = document.createElement("div");
    title.classList.add("match-title");
    title.textContent = match.title || "Untitled Match";
    
    const metaRow = document.createElement("div");
    metaRow.classList.add("match-meta-row");
    const category = document.createElement("span");
    category.classList.add("match-category");
    category.textContent = match.category ? match.category.charAt(0).toUpperCase() + match.category.slice(1) : "Unknown";
    const timeOrDate = document.createElement("span");
    timeOrDate.textContent = meta;
    
    metaRow.append(category, timeOrDate);
    info.append(title, metaRow);
    card.append(poster, statusBadge, info);
    
    // Add click event to navigate to the correct match page
    card.addEventListener("click", () => { window.location.href = `../Matchinformation/?id=${match.id}`; });
    
    return card;
}

// Helper function required for the detailed card
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeFormat = { hour: "numeric", minute: "2-digit" };
    
    if (timestamp <= now.getTime()) {
        return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) };
    }
    if (isToday) {
        return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" };
    }
    return { 
        badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 
        badgeType: "date", 
        meta: date.toLocaleTimeString("en-US", timeFormat) 
    };
}

async function fetchSearchData() {
    if (searchDataFetched) return;
    try {
        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Failed to fetch search data");
        const allMatches = await res.json();
        const map = new Map();
        allMatches.forEach(m => map.set(m.id, m));
        allMatchesCache = Array.from(map.values());
        searchDataFetched = true;
    } catch (err) { console.error("Error fetching search data:", err); }
}

function setupSearch() {
    const searchInput = document.getElementById("search-input");
    const searchOverlay = document.getElementById("search-overlay");
    const overlayInput = document.getElementById("overlay-search-input");
    const overlayResults = document.getElementById("overlay-search-results");
    const searchClose = document.getElementById("search-close");
    
    const openSearch = () => { 
        fetchSearchData(); 
        searchOverlay.style.display = "flex"; 
        overlayInput.value = searchInput.value; 
        overlayInput.focus();
        performSearch(overlayInput.value);
    };
    
    const performSearch = (query) => {
        const q = query.trim().toLowerCase();
        overlayResults.innerHTML = "";
        if (!q || !searchDataFetched) {
            overlayResults.innerHTML = `<p style="color: var(--text-secondary); text-align: center; width: 100%;">Start typing to find a match.</p>`;
            return;
        }
        const filtered = allMatchesCache.filter(m => (m.title || "").toLowerCase().includes(q));
        
        if(filtered.length > 0) {
            filtered.slice(0, 12).forEach(match => { overlayResults.appendChild(createMatchCard(match)); });
        } else {
            overlayResults.innerHTML = `<p style="color: var(--text-secondary); text-align: center; width: 100%;">No matches found for "${q}".</p>`;
        }
    };
    
    searchInput.addEventListener("focus", openSearch);
    searchClose.addEventListener("click", () => { searchOverlay.style.display = "none"; });
    searchOverlay.addEventListener("click", (e) => { if (!e.target.closest(".search-overlay-content")) searchOverlay.style.display = "none"; });
    overlayInput.addEventListener("input", () => performSearch(overlayInput.value));
    overlayInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = overlayInput.value.trim();
            if (q) window.location.href = `/SearchResult/?q=${encodeURIComponent(q)}`;
        }
    });
}

// ------------------------------------
// CORE TABLE LOGIC (Preserved)
// ------------------------------------
function initializeTable() {
    const apiURL = "https://topembed.pw/api.php?format=json";
    const matchesBody = document.getElementById("matches-body");
    const matchesTable = document.getElementById("matches-table");
    const loadingDiv = document.getElementById("loading");
    const keyword = "NFL";
    const now = Math.floor(Date.now() / 1000);

    loadingDiv.style.display = "block";
    matchesTable.style.display = "none";

    function formatTime(unix) {
        const date = new Date(unix * 1000);
        return date.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    fetch(apiURL)
        .then(res => res.json())
        .then(data => {
            let allMatches = [];
            let liveCount = 0;

            for (const date in data.events) {
                data.events[date].forEach((event, idx) => {
                    const matchTime = event.unix_timestamp;
                    const diffMinutes = (now - matchTime) / 60;
                    const keywordMatch = (event.sport && event.sport.toLowerCase().includes(keyword.toLowerCase())) || (event.tournament && event.tournament.toLowerCase().includes(keyword.toLowerCase()));

                    if (!keywordMatch || diffMinutes >= 180) return;

                    let status = "upcoming";
                    if (diffMinutes >= 0 && diffMinutes < 150) {
                        status = "live";
                        liveCount++;
                    } else if (diffMinutes >= 150) {
                        status = "finished";
                    }

                    allMatches.push({
                        time: formatTime(matchTime),
                        sport: event.sport || "-",
                        tournament: event.tournament || "-",
                        match: event.match || "-",
                        status,
                        url: `/StreamPage/?id=${event.unix_timestamp}_${idx}`
                    });
                });
            }

            document.getElementById("live-count").textContent = liveCount;

            function renderMatches(filter) {
                matchesBody.innerHTML = "";
                let filtered = allMatches.filter(m => filter === "all" || m.status === filter);
                if (filtered.length === 0) {
                    matchesBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">⚠ No ${filter} matches found.</td></tr>`;
                } else {
                    filtered.forEach(m => {
                        const badge = m.status === "live" ? `<span class="badge live"></span>` : (m.status === "finished" ? `<span class="badge finished"></span>` : "");
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>${m.time}</td>
                            <td>${m.sport}</td>
                            <td>${m.tournament}</td>
                            <td>${m.match} ${badge}</td>
                            <td><a class="watch-btn" href="${m.url}">Watch</a></td>
                        `;
                        matchesBody.appendChild(row);
                    });
                }
                matchesTable.style.display = "table";
            }
            
            function setActive(id) {
                document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
                document.getElementById(id).classList.add("active");
            }
            
            document.getElementById("all-btn").addEventListener("click", () => { setActive("all-btn"); renderMatches("all"); });
            document.getElementById("live-btn").addEventListener("click", () => { setActive("live-btn"); renderMatches("live"); });
            document.getElementById("upcoming-btn").addEventListener("click", () => { setActive("upcoming-btn"); renderMatches("upcoming"); });

            renderMatches("all"); // Initial render
            loadingDiv.style.display = "none";
        })
        .catch(err => {
            loadingDiv.innerHTML = `<p style="color:red;">⚠ Error loading matches</p>`;
            console.error(err);
        });
}


// ------------------------------------
//         INITIALIZE PAGE
// ------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initializeTable();
    setupSearch();

    const closeAdBtn = document.getElementById("close-ad");
    const stickyAd = document.getElementById("sticky-footer-ad");
    if (closeAdBtn && stickyAd) {
        closeAdBtn.addEventListener("click", () => {
            stickyAd.style.display = "none";
        });
    }
});