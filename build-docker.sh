#!/bin/bash

# Ensure Docker is installed and running
if ! command -v docker &> /dev/null
then
    echo "Docker not found. Please install Docker first."
    exit 1
fi

# Print message about Docker login
echo "You must be logged in to Docker to proceed with the build."

# Build and push Docker image for country-service
echo "Starting build for country-service..."
docker buildx build --platform linux/amd64 --tag ghcr.io/intellexal-solutions/country-service:latest --push .

# Notify user that the build is complete
echo "Build for country-service is complete and the image has been pushed."
