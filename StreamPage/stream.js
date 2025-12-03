// =================================================================================
// stream.js - Revamped Stream Page Logic with Correct Search
// =================================================================================

// ------------------------------------
// SEARCH & WIDGET FUNCTIONS (Corrected to match Watch Page)
// ------------------------------------
let allMatchesCache = [];
let searchDataFetched = false;

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
    
    card.addEventListener("click", () => { window.location.href = `../Matchinformation/?id=${match.id}`; });
    
    return card;
}

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
            if (q) window.location.href = `../SearchResult/?q=${encodeURIComponent(q)}`;
        }
    });
}

async function loadDiscordWidget() {
    const serverId = "1422384816472457288";
    const apiUrl = `https://discord.com/api/guilds/${serverId}/widget.json`;
    
    const onlineCountEl = document.getElementById("discord-online-count");
    const membersListEl = document.getElementById("discord-members-list");
    const joinButton = document.getElementById("discord-join-button");
    const widgetContainer = document.getElementById("discord-widget-container");

    if (!widgetContainer) return;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch Discord widget data');
        const data = await response.json();

        if(onlineCountEl) onlineCountEl.textContent = data.presence_count || '0';
        if(joinButton && data.instant_invite) joinButton.href = data.instant_invite;

        membersListEl.innerHTML = ''; 
        const fragment = document.createDocumentFragment();

        if (data.members && data.members.length > 0) {
            data.members.slice(0, 10).forEach(member => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="member-avatar">
                        <img src="${member.avatar_url}" alt="${member.username}" loading="lazy">
                        <span class="online-indicator"></span>
                    </div>
                    <span class="member-name">${member.username}</span>`;
                fragment.appendChild(li);
            });
        }
        
        if (data.instant_invite) {
            const moreLi = document.createElement('li');
            moreLi.className = 'more-members-link';
            moreLi.innerHTML = `<p>and more in our <a href="${data.instant_invite}" target="_blank" rel="noopener noreferrer nofollow">Discord!</a></p>`;
            fragment.appendChild(moreLi);
        }
        membersListEl.appendChild(fragment);

    } catch (error) {
        console.error("Error loading Discord widget:", error);
        if (widgetContainer) widgetContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Could not load Discord widget.</p>';
    }
}

// ------------------------------------
// CORE STREAM PAGE LOGIC (Preserved)
// ------------------------------------
function initializeStreamPage() {
    const apiURL = "https://topembed.pw/api.php?format=json";
    const playerFrame = document.getElementById("playerFrame");
    const channelsListEl = document.getElementById("channelsList");
    const matchTitleEl = document.getElementById("matchTitle");
    const matchStatusEl = document.getElementById("matchStatus");
    const streamStatus = document.getElementById("streamStatus");

    function formatLocalFromUnix(unix) {
        return new Date(unix * 1000).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    }

    function formatCountdown(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}H ${minutes}M ${seconds}S`;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("id");

    if (!matchId) {
        streamStatus.textContent = "⚠ No match ID provided in the URL.";
        matchTitleEl.textContent = "Error";
        matchStatusEl.textContent = "Invalid match link.";
        return;
    }

    fetch(apiURL)
        .then(res => res.json())
        .then(data => {
            let foundMatch = null;
            for (const date in data.events) {
                const eventById = data.events[date].find((event, idx) => `${event.unix_timestamp}_${idx}` === matchId);
                if (eventById) {
                    foundMatch = eventById;
                    break;
                }
            }

            if (!foundMatch) {
                streamStatus.textContent = "⚠ Match not found.";
                matchTitleEl.textContent = "Not Found";
                return;
            }

            matchTitleEl.textContent = foundMatch.match || "Match Details";

            const start = foundMatch.unix_timestamp * 1000;
            const end = start + (3 * 60 * 60 * 1000); // Assume 3 hour duration

            function updateStatus() {
                const now = Date.now();
                if (now >= end) {
                    matchStatusEl.innerHTML = `<span class="status-badge status-finished">Finished</span>`;
                } else if (now >= start) {
                    matchStatusEl.innerHTML = `<span class="status-badge status-running">Live</span> (Started: ${formatLocalFromUnix(foundMatch.unix_timestamp)})`;
                } else {
                    const countdown = formatCountdown(start - now);
                    matchStatusEl.innerHTML = `Upcoming — Starts in ⏳ ${countdown}<br><small>${formatLocalFromUnix(foundMatch.unix_timestamp)}</small>`;
                }
            }

            updateStatus();
            setInterval(updateStatus, 1000);

            channelsListEl.innerHTML = "";
            if (foundMatch.channels && Array.isArray(foundMatch.channels) && foundMatch.channels.length > 0) {
                foundMatch.channels.forEach((url, i) => {
                    const btn = document.createElement("button");
                    btn.className = "channel-btn";
                    btn.textContent = `Channel ${i + 1}`;
                    btn.addEventListener("click", () => {
                        Array.from(channelsListEl.children).forEach(el => el.classList.remove("active"));
                        btn.classList.add("active");
                        playerFrame.src = url;
                        streamStatus.textContent = `Now playing Channel ${i + 1}`;
                    });
                    channelsListEl.appendChild(btn);
                });

                const firstBtn = channelsListEl.firstChild;
                if(firstBtn) {
                    firstBtn.classList.add("active");
                    playerFrame.src = foundMatch.channels[0];
                    streamStatus.textContent = "Loading Channel 1...";
                }

            } else {
                streamStatus.textContent = "⚠ No streaming channels are available for this match yet.";
            }
        })
        .catch(err => {
            console.error(err);
            streamStatus.textContent = "⚠ Error loading match data.";
        });
}

// ------------------------------------
//         INITIALIZE PAGE
// ------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initializeStreamPage();
    setupSearch();
    loadDiscordWidget();

    const closeAdBtn = document.getElementById("close-ad");
    const stickyAd = document.getElementById("sticky-footer-ad");
    if(closeAdBtn && stickyAd) {
        closeAdBtn.addEventListener("click", () => {
            stickyAd.style.display = "none";
        });
    }
});