# Justfile to simplify and organize commonly used bash commands
# Dependencies: just task runner https://www.npmjs.com/package/just-task
# run a just command with `just <COMMAND>`

# Initialize docker network for images to talk to local DB
docker-init-net:
    docker network create peppal-net || true
    docker network connect peppal-net peppal-postgres || true
# Build and run the image on port 8000 with placeholder build args (override manually if needed)
build-and-run:
    docker build \
        --build-arg ENVIRONMENT=dev \
        --build-arg DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
        -t peppal-backend . && \
    docker run -d -p 8000:8000 \
        --name peppal-backend-local \
        --network peppal-net \
        --env-file .env.local \
        peppal-backend

# Build the image only (no run), tagging as latest
docker-buildx-and-push:
    docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg ENVIRONMENT=dev \
    --build-arg DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
    -t ggrant92/peppal-backend:latest \
    --push \
    .

pull-and-run tag:
    docker pull ggrant92/peppal-backend:{{tag}}
    docker ps -q --filter "ancestor=ggrant92/peppal-backend:latest" | xargs -r docker stop
    docker ps -a -q --filter "ancestor=ggrant92/peppal-backend:latest" | xargs -r docker rm
    docker run -d \
        --name peppal-backend \
        --network peppal-net \
        -p 8000:8000 \
        --env-file .env.local \
        ggrant92/peppal-backend:latest


# Tears down and removes the running container from build-and-run
teardown:
    docker stop peppal-backend || true
    docker rm peppal-backend || true
    docker stop peppal-backend-local || true
    docker rm peppal-backend-local || true

start-local-db:
    docker run --name peppal-postgres \
        -e POSTGRES_PASSWORD=devpassword \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_DB=peppal \
        -p 5432:5432 \
        -v peppal-postgres-data:/var/lib/postgresql/data \
        -d postgres:17 \
        && echo "The Dev Database is Running at postgresql://postgres:devpassword@localhost:5432/peppal 😎"

stop-local-db:
    docker stop peppal-postgres || true
    docker rm peppal-postgres || true
