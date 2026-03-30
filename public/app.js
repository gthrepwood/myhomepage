// State
let buttons = [];
let editingId = null;
let draggedItem = null;

// DOM Elements
const buttonsContainer = document.getElementById('buttonsContainer');
const addButton = document.getElementById('addButton');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const buttonForm = document.getElementById('buttonForm');
const cancelBtn = document.getElementById('cancelBtn');
const nameInput = document.getElementById('name');
const urlInput = document.getElementById('url');

// Initialize
document.addEventListener('DOMContentLoaded', loadButtons);

// Event Listeners
addButton.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', () => closeModal());
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
buttonForm.addEventListener('submit', handleSubmit);

// Load buttons from API
async function loadButtons() {
    try {
        const response = await fetch('/api/buttons');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        buttons = Array.isArray(data) ? data : [];
        renderButtons();
        initResize();
    } catch (error) {
        console.error('Failed to load buttons:', error);
        // Show error message to user
        if (buttonsContainer) {
            buttonsContainer.innerHTML = '<div class="alert alert-warning">Failed to load buttons. Please refresh the page or try again later.</div>';
        }
    }
}

// Render buttons
function renderButtons() {
    buttonsContainer.innerHTML = '';
    
    buttons.forEach((button, index) => {
        const btn = document.createElement('a');
        btn.className = 'app-button';
        btn.href = button.url;
        btn.draggable = true;
        btn.dataset.id = button.id;
        btn.dataset.index = index;
        
        // Icon - try to use website favicon, fallback to first letter
        const initial = button.name.charAt(0).toUpperCase();
        let faviconUrl = '';
        try {
            const url = new URL(button.url);
            faviconUrl = 'https://www.google.com/s2/favicons?domain=' + url.hostname + '&sz=32';
        } catch (e) {
            faviconUrl = '';
        }
        
        btn.innerHTML = `
            <div class="actions">
                <button class="action-btn edit-btn" data-id="${button.id}" title="Edit">✎</button>
                <button class="action-btn delete-btn" data-id="${button.id}" title="Delete">✕</button>
            </div>
            ${faviconUrl ? `<img src="${faviconUrl}" alt="${button.name}" class="icon" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
            <span class="icon-text" style="display:${faviconUrl ? 'none' : 'flex'};">${initial}</span>
            <span class="name">${button.name}</span>
        `;
        
        // Prevent link navigation for action buttons
        btn.querySelector('.actions').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Edit button
        btn.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            editButton(button);
        });
        
        // Delete button
        btn.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteButton(button.id);
        });
        
        // Drag and drop events
        btn.addEventListener('dragstart', handleDragStart);
        btn.addEventListener('dragend', handleDragEnd);
        btn.addEventListener('dragover', handleDragOver);
        btn.addEventListener('drop', handleDrop);
        
        buttonsContainer.appendChild(btn);
    });

    // Re-add resize handle
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.title = 'Drag to resize buttons';
    buttonsContainer.appendChild(handle);
}

// Drag and Drop Handlers
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.app-button').forEach(btn => {
        btn.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (this !== draggedItem) {
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        
        // Reorder array
        const [movedItem] = buttons.splice(fromIndex, 1);
        buttons.splice(toIndex, 0, movedItem);
        
        // Save new order to API
        saveButtonOrder();
        
        // Re-render
        renderButtons();
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
    } catch (error) {
        console.error('Failed to save order:', error);
    }
}

// Modal Functions
function openModal(button = null) {
    editingId = button ? button.id : null;
    modalTitle.textContent = button ? 'Edit Application' : 'Add Application';
    
    if (nameInput) nameInput.value = button ? button.name : '';
    if (urlInput) urlInput.value = button ? button.url : '';
    
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
    
    const name = nameInput ? nameInput.value.trim() : '';
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
                body: JSON.stringify({ name, url })
            });
            
            if (response.ok) {
                const updated = await response.json();
                const index = buttons.findIndex(b => b.id === editingId);
                if (index !== -1) {
                    buttons[index] = updated;
                }
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
                body: JSON.stringify({ name, url })
            });
            
            if (response.ok) {
                const newButton = await response.json();
                buttons.push(newButton);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to add button');
                return;
            }
        }
        
        renderButtons();
        closeModal();
    } catch (error) {
        console.error('Failed to save button:', error);
        alert('Failed to save button');
    }
}

// Edit Button
function editButton(button) {
    openModal(button);
}

// Delete Button
async function deleteButton(id) {
    try {
        await fetch(`/api/buttons/${id}`, {
            method: 'DELETE'
        });
        
        buttons = buttons.filter(b => b.id !== id);
        renderButtons();
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
            const buttons = JSON.parse(e.target.result);
            const response = await fetch('/api/buttons/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buttons)
            });
            
            if (response.ok) {
                const data = await response.json();
                buttons = Array.isArray(data) ? data : [];
                renderButtons();
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

    const MIN_SIZE = 80;
    const MAX_SIZE = 400;
    const savedSize = localStorage.getItem('buttonSize');

    if (savedSize) {
        applyButtonSize(parseInt(savedSize));
    }

    let startX, startWidth;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = getCurrentSize();

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    handle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startX = e.touches[0].clientX;
        startWidth = getCurrentSize();

        document.addEventListener('touchmove', onTouchMove);
        document.addEventListener('touchend', onTouchEnd);
    });

    function onMouseMove(e) {
        const dx = e.clientX - startX;
        const newSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, startWidth + dx));
        applyButtonSize(newSize);
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        localStorage.setItem('buttonSize', getCurrentSize());
    }

    function onTouchMove(e) {
        const dx = e.touches[0].clientX - startX;
        const newSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, startWidth + dx));
        applyButtonSize(newSize);
    }

    function onTouchEnd() {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        localStorage.setItem('buttonSize', getCurrentSize());
    }

    function getCurrentSize() {
        const style = buttonsContainer.style.gridTemplateColumns;
        const match = style.match(/minmax\((\d+)px/);
        return match ? parseInt(match[1]) : 120;
    }

    function applyButtonSize(size) {
        buttonsContainer.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;
    }
}
