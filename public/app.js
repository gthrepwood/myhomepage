// State
let buttons = [];
let editingId = null;
let isOffline = false;
let filterText = '';
let openTimer = null;

// Constants
const CACHE_KEY = 'myhomepage_buttons_cache';
const AUTO_OPEN_DELAY = 0;
//const AUTO_OPEN_DELAY = 2000;

// DOM Elements
const buttonsContainer = document.getElementById('buttonsContainer');
const addButton = document.getElementById('addButton');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const buttonForm = document.getElementById('buttonForm');
const cancelBtn = document.getElementById('cancelBtn');
const deleteBtn = document.getElementById('deleteBtn');
const nameInput = document.getElementById('name');
const faviconInput = document.getElementById('favicon');
const urlInput = document.getElementById('url');

// Initialize
document.addEventListener('DOMContentLoaded', loadButtons);

// Event Listeners
addButton.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', () => closeModal());
deleteBtn.addEventListener('click', () => {
    if (editingId && confirm('Are you sure you want to delete this button?')) {
        deleteButton(editingId);
    }
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
buttonForm.addEventListener('submit', handleSubmit);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
        return;
    }
    // Ignore typing when modal or form inputs are focused
    const active = document.activeElement;
    if (modal.classList.contains('active')) return;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    // Clear filter on Escape
    if (e.key === 'Escape') {
        filterText = '';
        clearTimeout(openTimer);
        openTimer = null;
        renderButtons();
        return;
    }
    // Backspace removes last char
    if (e.key === 'Backspace') {
        filterText = filterText.slice(0, -1);
        clearTimeout(openTimer);
        openTimer = null;
        renderButtons();
        return;
    }
    // Only single alphanumeric characters
    if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
        filterText += e.key.toLowerCase();
        clearTimeout(openTimer);
        openTimer = null;
        renderButtons();
    }
});

// Save buttons to localStorage cache
function saveButtonsToCache() {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(buttons));
    } catch (e) {
        // Ignore cache write failures (e.g. storage full)
    }
}

// Load buttons from localStorage cache
function loadButtonsFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return [];
        const data = JSON.parse(cached);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

// Show an offline/cached banner inside the buttons container
function showCachedBanner() {
    if (!buttonsContainer) return;
    const banner = document.createElement('div');
    banner.className = 'alert alert-warning cached-banner';
    banner.textContent = 'Offline: showing last cached buttons. Changes are disabled.';
    buttonsContainer.prepend(banner);
}

// Load buttons from API
async function loadButtons() {
    try {
        const response = await fetch('/api/buttons');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        buttons = Array.isArray(data) ? data : [];
        isOffline = false;
        saveButtonsToCache();
        await renderButtons();
        initResize();
    } catch (error) {
        console.error('Failed to load buttons:', error);
        // Fall back to last cached buttons if available
        const cached = loadButtonsFromCache();
        if (cached.length > 0) {
            isOffline = true;
            buttons = cached;
            await renderButtons();
            initResize();
            showCachedBanner();
        } else {
            isOffline = true;
            // No cache available: show error message
            if (buttonsContainer) {
                buttonsContainer.innerHTML = '<div class="alert alert-warning">Failed to load buttons and no cached copy is available. Please refresh the page or try again later.</div>';
            }
        }
    }
}

// Render buttons
async function renderButtons() {
    buttonsContainer.innerHTML = '';

    const sorted = [...buttons].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
    const filterDisplay = document.getElementById('filterDisplay');
    if (filterDisplay) {
        if (filterText) {
            filterDisplay.style.display = 'block';
            filterDisplay.textContent = 'Filter: ' + filterText;
        } else {
            filterDisplay.style.display = 'none';
            filterDisplay.textContent = '';
        }
    }

    const filtered = filterText
        ? sorted.filter(b => (b.name || '').toLowerCase().includes(filterText) || (b.url || '').toLowerCase().includes(filterText))
        : sorted;

    filtered.forEach((button, index) => {
        const btn = document.createElement('a');
        btn.className = 'app-button';
        btn.href = button.url;
        btn.draggable = false;
        btn.dataset.id = button.id;
        btn.dataset.index = index;

        // Icon - use custom favicon (path/url or emoji/text) if defined, else try site favicons, then letter
        const rawFav = ((button.favicon || '') + '').trim();
        let customFaviconUrl = null;
        let fallbackText = (button.name || '').charAt(0).toUpperCase() || '?';
        if (rawFav) {
            if (/^(https?:)?\/\//i.test(rawFav) || rawFav.startsWith('/') || /\.(ico|png|svg|jpe?g|gif|webp)(\?|#|$)/i.test(rawFav)) {
                try {
                    customFaviconUrl = new URL(rawFav, button.url).href;
                } catch (e) {
                    customFaviconUrl = rawFav;
                }
            } else {
                fallbackText = rawFav;
            }
        }

        let faviconUrls = [];
        if (customFaviconUrl) {
            faviconUrls.push(customFaviconUrl);
        }

        let url = null;
        try {
            url = new URL(button.url);
            const host = url.hostname;
            const origin = url.origin;
            const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
            if (isHttp) {
                // Public favicon services (helpful when direct site favicon is blocked/mixed-content, esp. for http targets)
                faviconUrls.push(
                    'https://icons.duckduckgo.com/ip3/' + host + '.ico',
                    'https://www.google.com/s2/favicons?domain=' + host + '&sz=32',
                    'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=' + encodeURIComponent(origin) + '&size=32',
                    'https://favicon.yandex.net/favicon/' + host
                );
            }
            // Direct site favicons (works for http on http pages and for https)
            if (host) {
                faviconUrls.push(
                    origin + '/favicon.ico',
                    origin + '/favicon.svg',
                    origin + '/favicon.png'
                );
            }
        } catch (e) {
            // keep any custom favicon url even if button url is invalid
        }

        // Remove duplicates while preserving order
        const seen = new Set();
        const fallbackChain = faviconUrls.filter((u) => {
            if (!u || seen.has(u)) return false;
            seen.add(u);
            return true;
        });

        const clickCount = button.clickCount || 0;

        const iconWrap = document.createElement('span');
        iconWrap.className = 'icon-wrap';

        const fallback = document.createElement('span');
        fallback.className = 'icon-text';
        fallback.textContent = fallbackText;
        fallback.style.display = fallbackChain.length > 0 ? 'none' : 'flex';

        if (fallbackChain.length > 0) {
            const img = document.createElement('img');
            img.alt = button.name || '';
            img.className = 'icon';
            img.loading = 'lazy';
            img.referrerPolicy = 'no-referrer';
            let i = 0;
            img.src = fallbackChain[i];
            img.onerror = () => {
                i += 1;
                if (i < fallbackChain.length) {
                    img.src = fallbackChain[i];
                } else {
                    img.style.display = 'none';
                    fallback.style.display = 'flex';
                }
            };
            iconWrap.appendChild(img);
        }

        iconWrap.appendChild(fallback);

        const nameEl = document.createElement('span');
        nameEl.className = 'name';
        nameEl.textContent = button.name || '';

        btn.appendChild(iconWrap);
        btn.appendChild(nameEl);

        if (clickCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'click-badge';
            badge.textContent = String(clickCount);
            btn.appendChild(badge);
        }

        // Track click count on navigation
        btn.addEventListener('click', () => {
            navigator.sendBeacon(`/api/buttons/${button.id}/click`);
        });

        // Right-click to edit
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            editButton(button);
        });

        buttonsContainer.appendChild(btn);
    });

    // Re-add resize handle
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.title = 'Drag to resize buttons';
    buttonsContainer.appendChild(handle);

    // Auto-open when only one button remains
    clearTimeout(openTimer);
    openTimer = null;
    if (filterText && filtered.length === 1) {
        const only = filtered[0];
        openTimer = setTimeout(() => {
            window.location.href = only.url;
        }, AUTO_OPEN_DELAY);
    }
    const savedHeight = localStorage.getItem('buttonHeight');
    if (savedHeight) {
        document.querySelectorAll('.app-button').forEach(btn => {
            btn.style.minHeight = `${savedHeight}px`;
        });
    }
}

// Save button order to API
async function saveButtonOrder() {
    try {
        await fetch('/api/buttons/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buttons })
        });
        saveButtonsToCache();
    } catch (error) {
        console.error('Failed to save order:', error);
    }
}

// Modal Functions
function openModal(button = null) {
    editingId = button ? button.id : null;
    modalTitle.textContent = button ? 'Edit Application' : 'Add Application';

    if (nameInput) nameInput.value = button ? button.name : '';
    if (faviconInput) faviconInput.value = button ? (button.favicon || '') : '';
    if (urlInput) urlInput.value = button ? button.url : '';
    if (deleteBtn) deleteBtn.style.display = button ? 'inline-block' : 'none';

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    editingId = null;
    buttonForm.reset();
}

// Form Submit
async function handleSubmit(e) {
    e.preventDefault();

    if (isOffline) {
        alert('You are offline. Changes cannot be saved until the server is reachable again.');
        return;
    }

    const name = nameInput ? nameInput.value.trim() : '';
    const favicon = faviconInput ? faviconInput.value.trim() : '';
    const url = urlInput ? urlInput.value.trim() : '';

    if (!url) {
        alert('URL is required');
        return;
    }

    try {
        if (editingId) {
            // Update existing button
            const response = await fetch(`/api/buttons/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, url, favicon })
            });

            if (response.ok) {
                const updated = await response.json();
                const index = buttons.findIndex(b => b.id === editingId);
                if (index !== -1) {
                    buttons[index] = updated;
                }
                saveButtonsToCache();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to update button');
                return;
            }
        } else {
            // Add new button
            const response = await fetch('/api/buttons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, url, favicon })
            });

            if (response.ok) {
                const newButton = await response.json();
                buttons.push(newButton);
                saveButtonsToCache();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to add button');
                return;
            }
        }

        await renderButtons();
        closeModal();
    } catch (error) {
        console.error('Failed to save button:', error);
        alert('Failed to save button');
    }
}

// Edit Button
function editButton(button) {
    if (isOffline) {
        alert('You are offline. Editing is disabled until the server is reachable again.');
        return;
    }
    openModal(button);
}

// Delete Button
async function deleteButton(id) {
    try {
        await fetch(`/api/buttons/${id}`, {
            method: 'DELETE'
        });

        buttons = buttons.filter(b => b.id !== id);
        closeModal();
        saveButtonsToCache();
        await renderButtons();
    } catch (error) {
        console.error('Failed to delete button:', error);
    }
}

// Save buttons to file (download)
function saveButtons() {
    window.location.href = '/api/buttons/download';
}

// Restore buttons from file
function restoreButtons(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const response = await fetch('/api/buttons/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const restored = await response.json();
                buttons = Array.isArray(restored) ? restored : [];
                saveButtonsToCache();
                await renderButtons();
                alert('Buttons restored from file!');
            } else {
                alert('Failed to restore buttons');
            }
        } catch (error) {
            console.error('Failed to restore buttons:', error);
            alert('Failed to restore buttons');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// Button resize via drag handle
function initResize() {
    const handle = document.querySelector('.resize-handle');
    if (!handle) return;

    const MIN_WIDTH = 80;
    const MAX_WIDTH = 400;
    const MIN_HEIGHT = 80;
    const MAX_HEIGHT = 400;
    const savedWidth = localStorage.getItem('buttonWidth');
    const savedHeight = localStorage.getItem('buttonHeight');

    if (savedWidth) {
        applyButtonWidth(parseInt(savedWidth));
    }
    if (savedHeight) {
        applyButtonHeight(parseInt(savedHeight));
    }

    let startX, startY, startWidth, startHeight;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = getCurrentWidth();
        startHeight = getCurrentHeight();

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    handle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startWidth = getCurrentWidth();
        startHeight = getCurrentHeight();

        document.addEventListener('touchmove', onTouchMove);
        document.addEventListener('touchend', onTouchEnd);
    });

    function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + dx));
        const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + dy));
        applyButtonWidth(newWidth);
        applyButtonHeight(newHeight);
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        localStorage.setItem('buttonWidth', getCurrentWidth());
        localStorage.setItem('buttonHeight', getCurrentHeight());
    }

    function onTouchMove(e) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + dx));
        const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + dy));
        applyButtonWidth(newWidth);
        applyButtonHeight(newHeight);
    }

    function onTouchEnd() {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        localStorage.setItem('buttonWidth', getCurrentWidth());
        localStorage.setItem('buttonHeight', getCurrentHeight());
    }

    function getCurrentWidth() {
        const style = buttonsContainer.style.gridTemplateColumns;
        const match = style.match(/minmax\((\d+)px/);
        return match ? parseInt(match[1]) : 120;
    }

    function getCurrentHeight() {
        const btn = document.querySelector('.app-button');
        return btn ? btn.offsetHeight : 120;
    }

    function applyButtonWidth(size) {
        buttonsContainer.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;
    }

    function applyButtonHeight(size) {
        document.querySelectorAll('.app-button').forEach(btn => {
            btn.style.minHeight = `${size}px`;
        });
    }
}
