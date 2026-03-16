#!/bin/bash
# Cross-platform npm global prefix setup script
# Works on Linux, macOS, and Windows (Git Bash / WSL)

# Get home directory - works on all platforms
get_home_dir() {
    # Try to get home from environment
    if [ -n "$HOME" ]; then
        echo "$HOME"
    elif [ -n "$USERPROFILE" ]; then
        # Windows style in Git Bash
        echo "$USERPROFILE"
    else
        # Fallback to getent
        echo "$(getent passwd $(whoami) | cut -d: -f6)"
    fi
}

# Get username - works on all platforms
get_username() {
    # Try different methods
    if [ -n "$USERNAME" ]; then
        echo "$USERNAME"
    elif [ -n "$USER" ]; then
        echo "$USER"
    elif [ -n "$LOGNAME" ]; then
        echo "$LOGNAME"
    else
        echo "$(whoami)"
    fi
}

# Detect OS and set npm prefix
NPM_PREFIX=$(get_home_dir)

# Set npm global prefix
npm config set prefix "$NPM_PREFIX" --global

echo "========================================="
echo "npm Global Configuration"
echo "========================================="
echo "Username: $(get_username)"
echo "Home directory: $NPM_PREFIX"
echo ""
echo "npm global prefix set to: $NPM_PREFIX"
echo "Global packages will be installed to: $NPM_PREFIX/node_modules"
echo "Global binaries will be in: $NPM_PREFIX/bin"
echo ""
echo "You may need to add $NPM_PREFIX/bin to your PATH"
echo "========================================="
