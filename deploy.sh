#!/bin/bash

set -a
source .env
set +a

# Pull the latest image manually
docker pull ghcr.io/intellexal-solutions/waba-internal-service:latest

docker stack deploy -c docker-compose.yaml --with-registry-auth whatsapp-platform