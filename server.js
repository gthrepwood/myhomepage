const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'buttons.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/docs', express.static('docs'));

// API: Get system info (home directory, username)
app.get('/api/system-info', (req, res) => {
    res.json({
        homeDir: os.homedir(),
        username: os.userInfo().username,
        platform: os.platform()
    });
});

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize default buttons if file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const defaultButtons = [
        { id: 1, name: 'GitHub', url: 'https://github.com', color: '#333' },
        { id: 2, name: 'Stack Overflow', url: 'https://stackoverflow.com', color: '#f48024' },
        { id: 3, name: 'YouTube', url: 'https://youtube.com', color: '#ff0000' },
        { id: 4, name: 'Gmail', url: 'https://gmail.com', color: '#ea4335' }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultButtons, null, 2));
}

// Helper function to read buttons
function getButtons() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Helper function to save buttons
function saveButtons(buttons) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(buttons, null, 2));
}

// API Routes

// GET - Get all buttons
app.get('/api/buttons', (req, res) => {
    try {
        const buttons = getButtons();
        res.json(buttons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load buttons' });
    }
});

// POST - Add a new button
app.post('/api/buttons', (req, res) => {
    try {
        const { name, url, color } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const buttons = getButtons();
        
        // Check for duplicate URL
        const existingButton = buttons.find(b => b.url.toLowerCase() === url.toLowerCase());
        if (existingButton) {
            return res.status(400).json({ error: 'This URL already exists' });
        }
        
        // Generate friendly name if not provided
        let buttonName = name ? name.trim() : '';
        if (!buttonName) {
            try {
                const urlObj = new URL(url);
                // Use hostname as the name, without www. prefix
                buttonName = urlObj.hostname.replace(/^www\./, '');
                // Capitalize first letter
                buttonName = buttonName.charAt(0).toUpperCase() + buttonName.slice(1);
            } catch (e) {
                buttonName = 'New Application';
            }
        }
        
        const newButton = {
            id: Date.now(),
            name: buttonName,
            url,
            color: color || '#007bff'
        };
        
        buttons.push(newButton);
        saveButtons(buttons);
        
        res.status(201).json(newButton);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add button' });
    }
});

// PUT - Update button order
app.put('/api/buttons/reorder', (req, res) => {
    try {
        const { buttons } = req.body;
        
        if (!Array.isArray(buttons)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        
        saveButtons(buttons);
        res.json(buttons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reorder buttons' });
    }
});

// PUT - Update a button
app.put('/api/buttons/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, color } = req.body;
        
        const buttons = getButtons();
        const index = buttons.findIndex(b => b.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Button not found' });
        }
        
        buttons[index] = {
            ...buttons[index],
            name: name || buttons[index].name,
            url: url || buttons[index].url,
            color: color || buttons[index].color
        };
        
        saveButtons(buttons);
        res.json(buttons[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update button' });
    }
});

// DELETE - Remove a button
app.delete('/api/buttons/:id', (req, res) => {
    try {
        const { id } = req.params;
        let buttons = getButtons();
        
        const index = buttons.findIndex(b => b.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Button not found' });
        }
        
        buttons = buttons.filter(b => b.id != id);
        saveButtons(buttons);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete button' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
