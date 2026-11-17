#!/bin/bash
# Docker helper script for MyHomepage

IMAGE_NAME="docker.io/gthrepwood/myhomepage"
TAG="latest"
CONTAINER_NAME="myhomepage"
HOST_PORT=3006
CONTAINER_PORT=3006
DATA_DIR="/mnt/user/appdata/myhomepage/data"

usage() {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  build   - Build Docker image"
    echo "  start   - Start container"
    echo "  stop    - Stop and remove container"
    echo "  restart - Restart container"
    echo "  push    - Push image to Docker Hub"
    echo "  pull    - Pull image from Docker Hub"
    echo "  logs    - Show container logs"
    echo "  clean   - Stop and remove container, volumes, and image"
    echo "  help    - Show this help"
}

cmd_build() {
    echo "Building Docker image..."
    docker build -t "${IMAGE_NAME}:${TAG}" .
}

cmd_start() {
    docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
    docker run -d \
        --name "${CONTAINER_NAME}" \
        -p "${HOST_PORT}:${CONTAINER_PORT}" \
        -v "${DATA_DIR}:/app/data" \
        --restart unless-stopped \
        "${IMAGE_NAME}:${TAG}"
}

cmd_stop() {
    docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
}

cmd_restart() {
    cmd_stop
    cmd_start
}

cmd_push() {
    docker push "${IMAGE_NAME}:${TAG}"
}

cmd_pull() {
    docker pull "${IMAGE_NAME}:${TAG}"
}

cmd_logs() {
    docker logs -f "${CONTAINER_NAME}"
}

cmd_clean() {
    cmd_stop
    docker rmi "${IMAGE_NAME}:${TAG}" 2>/dev/null || true
}

case "${1:-help}" in
    build)   cmd_build ;;
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    restart) cmd_restart ;;
    push)    cmd_push ;;
    pull)    cmd_pull ;;
    logs)    cmd_logs ;;
    clean)   cmd_clean ;;
    help|*)  usage ;;
esac