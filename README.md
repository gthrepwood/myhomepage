# MyHomepage

A simple Node.js application for managing quick-access application buttons.

## Features

- **View applications** - Big, colorful buttons displayed in a responsive grid
- **Add applications** - Create new buttons with name, URL, and color
- **Auto-generated names** - Leave name empty and it will be auto-generated from the URL
- **Duplicate prevention** - Cannot add the same URL twice
- **Edit applications** - Modify existing button details
- **Delete applications** - Remove buttons you no longer need
- **Reorder buttons** - Drag and drop to change button order
- **Website favicons** - Buttons display actual website favicons
- **Dark/Light themes** - Toggle between light mode and Star Trek LCARS dark theme
- **Persistent storage** - All changes saved to `data/buttons.json`

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open http://localhost:3000

### Run Tests

```bash
npm test
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or use the scripts
./build-docker.sh
./run-docker.sh
```

Open http://localhost:3000

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm test` | Run all tests |
| `npm run version:patch` | Bump patch version (1.0.0 → 1.0.1) |
| `npm run version:minor` | Bump minor version (1.0.0 → 1.1.0) |
| `npm run version:major` | Bump major version (1.0.0 → 2.0.0) |
| `npm run build:docker` | Build Docker image |
| `npm run publish:docker` | Build and push to Docker Hub |

### Release Workflow

```bash
# Option 1: Bump version and publish in one step
npm run version:patch
npm run publish:docker

# Option 2: Just build locally
npm run build:docker
docker run -p 3000:3000 myhomepage:latest
```

## Usage

### Adding a Button

1. Click **+ Add Application**
2. Enter the URL (required)
3. Enter a name (optional - will auto-generate from URL if left empty)
4. Choose a color (optional)
5. Click **Save**

The button will appear with the website's favicon!

### Themes

- **Light mode** (default): Clean white/gray modern design
- **Dark mode**: Star Trek LCARS themed interface

Click the moon/sun button in the top-right to toggle themes.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buttons` | Get all buttons |
| POST | `/api/buttons` | Add new button |
| PUT | `/api/buttons/reorder` | Update button order |
| PUT | `/api/buttons/:id` | Update button |
| DELETE | `/api/buttons/:id` | Delete button |
| GET | `/api/system-info` | Get system info (for settings page) |

## API Features

- **Auto-name generation**: When adding a button without a name, the server automatically creates a friendly name from the URL hostname
- **Duplicate prevention**: URLs are checked case-insensitively to prevent duplicates
- **URL required**: The URL field is required; name is optional

## VSCode

Press `F5` to run with debugger, or use the built-in run configurations:
- Start Server
- Start Server (Debug)
- Docker: Up / Down / Build

## Project Structure

```
.
├── server.js           # Express backend
├── public/
│   ├── index.html     # Main frontend HTML
│   ├── styles.css     # Styling (light/dark themes)
│   └── app.js        # Frontend JavaScript
├── docs/
│   └── settings.html # npm global settings page
├── test/
│   ├── test-api.js   # API tests
│   └── test-settings.js  # UI tests
├── data/
│   └── buttons.json  # Data storage
├── Dockerfile        # Docker image
├── docker-compose.yml
└── .vscode/
    └── launch.json   # Run configurations
```

## Settings Page

Visit http://localhost:3000/docs/settings.html to configure your npm global prefix. This page displays:
- Your home directory
- Username
- Options to set npm global package location
