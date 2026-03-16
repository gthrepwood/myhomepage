#!/bin/bash
# Run MyHomepage app using Docker Compose

echo "Starting MyHomepage container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "Failed to start container!"
    exit 1
fi

echo ""
echo "MyHomepage is running!"
echo "Open http://localhost:3005 in your browser"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
