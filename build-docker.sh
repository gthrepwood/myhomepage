#!/bin/bash
# Build Docker image for MyHomepage app

echo "Building Docker image..."
docker build -t myhomepage:latest .

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Docker image built successfully!"
echo ""
echo "To run the container:"
echo "  docker run -d -p 3006:3006 -v /mnt/user/appdata/myhomepage/data:/app/data --restart unless-stopped myhomepage:latest"
echo ""
echo "Or use the helper script:"
echo "  ./docker.sh start"
