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
echo "  docker run -p 3000:3000 myhomepage:latest"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up"
