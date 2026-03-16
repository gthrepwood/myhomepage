const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load configuration
const config = require('./config.json');

const app = express();
const PORT = process.env.PORT || config.port || 3006;
const DATA_FILE = path.join(__dirname, 'data', 'buttons.json');
const BACKUP_FILE = path.join(__dirname, 'data', 'buttons.backup.json');

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
        { id: 1, name: 'GitHub', url: 'https://github.com' },
        { id: 2, name: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { id: 3, name: 'YouTube', url: 'https://youtube.com' },
        { id: 4, name: 'Gmail', url: 'https://gmail.com' }
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
        const { name, url } = req.body;
        
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
            url
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
        const { name, url } = req.body;
        
        const buttons = getButtons();
        const index = buttons.findIndex(b => b.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Button not found' });
        }
        
        buttons[index] = {
            ...buttons[index],
            name: name || buttons[index].name,
            url: url || buttons[index].url
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

// POST - Save buttons to backup file
app.post('/api/buttons/save', (req, res) => {
    try {
        const buttons = getButtons();
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(buttons, null, 2));
        res.json({ success: true, message: 'Buttons saved to backup file' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save buttons' });
    }
});

// GET - Download buttons as JSON file
app.get('/api/buttons/download', (req, res) => {
    try {
        const buttons = getButtons();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=buttons.json');
        res.send(JSON.stringify(buttons, null, 2));
    } catch (error) {
        res.status(500).json({ error: 'Failed to download buttons' });
    }
});

// POST - Restore buttons from uploaded JSON file
app.post('/api/buttons/restore', express.raw({ type: 'application/json', limit: '10mb' }), (req, res) => {
    try {
        const buttons = JSON.parse(req.body.toString());
        if (!Array.isArray(buttons)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        
        // If current data file exists, backup it with timestamp
        if (fs.existsSync(DATA_FILE)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(__dirname, 'data', `backup_${timestamp}.json`);
            fs.copyFileSync(DATA_FILE, backupFile);
        }
        
        saveButtons(buttons);
        res.json(buttons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to restore buttons' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
