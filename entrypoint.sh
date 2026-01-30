#!/bin/bash

# Entrypoint script for Wails development container

# Ensure PATH includes Go and user binaries
export PATH="/home/wailsdev/go/bin:/usr/local/go/bin:$PATH"

# Ensure Node.js and npm are available
export PATH="/usr/bin:$PATH"

# Set up log directory access
if [ -d "/var/log/host" ]; then
    echo "✓ Log directory mounted at: /var/log/host"
    
    # Check for symlinks (log rotation)
    echo "Checking for log symlinks:"
    find /var/log/host -maxdepth 1 -type l -ls 2>/dev/null | head -5
    
    # Show some example logs available
    echo ""
    echo "Sample logs available:"
    ls -lh /var/log/host/*.log 2>/dev/null | head -5
fi

# Print welcome message
echo ""
echo "=========================================="
echo "Wails v3 Development Environment"
echo "Real-time Log Analyzer Ready"
echo "=========================================="
echo "Go version: $(go version)"
echo "Wails version: $(wails3 version 2>/dev/null || echo 'wails3 not found')"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""
echo "Available commands:"
echo "  wails3 [command] - Standard wails commands"
echo "  tail -f /var/log/host/syslog - Monitor system logs"
echo ""
echo "Log directory: /var/log/host"
echo "=========================================="

# Execute the command passed to the container
exec "$@"