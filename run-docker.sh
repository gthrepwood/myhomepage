#!/bin/bash
# Run MyHomepage app using plain docker

IMAGE_NAME="docker.io/gthrepwood/myhomepage"
TAG="latest"
CONTAINER_NAME="myhomepage"
HOST_PORT=3006
CONTAINER_PORT=3006
DATA_DIR="/mnt/user/appdata/myhomepage/data"

echo "Starting MyHomepage container..."
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

docker run -d \
    --name "${CONTAINER_NAME}" \
    -p "${HOST_PORT}:${CONTAINER_PORT}" \
    -v "${DATA_DIR}:/app/data" \
    --restart unless-stopped \
    "${IMAGE_NAME}:${TAG}"

if [ $? -ne 0 ]; then
    echo "Failed to start container!"
    exit 1
fi

echo ""
echo "MyHomepage is running!"
echo "Open http://192.168.100.227:${HOST_PORT} in your browser"
echo ""
echo "To view logs: docker logs -f ${CONTAINER_NAME}"
echo "To stop: docker stop ${CONTAINER_NAME}"