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
        btn.target = '_blank';
        btn.draggable = true;
        btn.dataset.id = button.id;
        btn.dataset.index = index;
        
        // Icon - try to use website favicon, fallback to first letter
        const initial = button.name.charAt(0).toUpperCase();
        const faviconUrl = 'https://www.google.com/s2/favicons?domain=' + new URL(button.url).hostname + '&sz=64';
        
        btn.innerHTML = `
            <div class="actions">
                <button class="action-btn edit-btn" data-id="${button.id}" title="Edit">✎</button>
                <button class="action-btn delete-btn" data-id="${button.id}" title="Delete">✕</button>
            </div>
            <img src="${faviconUrl}" alt="${button.name}" class="icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="icon-text" style="display:none; background-color: ${button.color}">${initial}</span>
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
    
    document.getElementById('name').value = button ? button.name : '';
    document.getElementById('url').value = button ? button.url : '';
    document.getElementById('color').value = button ? button.color : '#007bff';
    
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
    
    const name = document.getElementById('name').value.trim();
    const url = document.getElementById('url').value.trim();
    const color = document.getElementById('color').value;
    
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
                body: JSON.stringify({ name, url, color })
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
                body: JSON.stringify({ name, url, color })
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
    if (!confirm('Are you sure you want to delete this application?')) return;
    
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
