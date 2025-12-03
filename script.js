// --- [v3 - HIGH PERFORMANCE SCRIPT] ---

// =========================================================================
// === CRITICAL FIRST-PAINT LOGIC ===
// Code that MUST run immediately. Keep this section as lightweight as possible.
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {

    // --- 1. STICKY HEADER LOGIC ---
    // This is lightweight and affects layout, so it runs early.
    (function setupStickyHeader() {
        const header = document.querySelector(".main-header");
        const titleElement = document.getElementById("main-title");
        if (!header || !titleElement) return;
        window.addEventListener("scroll", function() {
            const triggerPoint = titleElement.offsetTop + titleElement.offsetHeight;
            if (window.scrollY > triggerPoint) {
                header.classList.add("sticky");
            } else {
                header.classList.remove("sticky");
            }
        }, { passive: true }); // Added passive listener for better scroll performance
    })();

});


// =========================================================================
// === DEFERRED, NON-CRITICAL LOGIC ===
// This entire block runs only AFTER the page is fully loaded and visible,
// ensuring it does not impact FCP or LCP.
// =========================================================================
window.addEventListener('load', function() {

    const CONFIG = {
        apiBaseUrl: 'https://streamed.pk/api',
        matchPageUrl: '/Matchinformation/',
        searchResultUrl: '/SearchResult/',
        searchUrlHash: '#search',
        discordServerId: '1422384816472457288',
        discordFallbackInvite: 'https://discord.gg/your-default-fallback-invite',
        placeholderImageUrl: '/Fallbackimage.webp'
    };

    // --- 2. SCROLL ANIMATION LOGIC ---
    (function setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        if (!animatedElements.length) return;
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            animatedElements.forEach(element => observer.observe(element));
        } else {
            // Fallback for very old browsers
            animatedElements.forEach(el => el.classList.add('is-visible'));
        }
    })();

    // --- 3. HOMEPAGE SEARCH REDIRECT LOGIC ---
    (function setupSearchRedirect() {
        const searchTrigger = document.getElementById('search-trigger');

        // If the search trigger element exists on the page, add the redirect event listener.
        if (searchTrigger) {
            searchTrigger.addEventListener('click', function() {
                // Redirect the user to the SearchResult page.
                window.location.href = '/SearchResult/?focus=true';
            });
        }
    })();

    // --- 4. DISCORD INVITE LINK FETCHER LOGIC ---
    (function fetchDiscordInvite() {
        const apiUrl = `https://discord.com/api/guilds/${CONFIG.discordServerId}/widget.json`;
        const discordButton = document.getElementById("discord-join-link");
        if (!discordButton) return;
        fetch(apiUrl)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
            .then(data => {
                if (data.instant_invite) discordButton.href = data.instant_invite;
                else discordButton.href = CONFIG.discordFallbackInvite;
            })
            .catch(err => {
                console.error("Error loading Discord invite link:", err);
                discordButton.href = CONFIG.discordFallbackInvite;
            });
    })();

    // --- 5. LAZY-LOAD MOBILE AD SCRIPT ---
    (function lazyLoadMobileAdScript() {
        // Wait 2 seconds after the page is interactive before loading the ad script
        setTimeout(() => {
            const script = document.createElement('script');
            script.src = '/mobiledetectscript.js';
            script.defer = true;
            document.body.appendChild(script);
        }, 2000);
    })();

});


