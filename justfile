# Justfile to simplify and organize commonly used bash commands
# Dependencies: just task runner https://www.npmjs.com/package/just-task
# run a just command with `just <COMMAND>`

# Initialize docker network for images to talk to local DB
docker-init-net:
    docker network create edc-net || true
    docker network connect edc-net edc-portal-postgres || true
# Build and run the image on port 8000 with placeholder build args (override manually if needed)
build-and-run:
    docker build \
        --build-arg ENVIRONMENT=dev \
        --build-arg DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
        -t nestjs-api-starter . && \
    docker run -d -p 8000:8000 \
        --name edcw-backend-local \
        --network edc-net \
        --env-file .env.local \
        nestjs-api-starter

# Build the image only (no run), tagging as latest
docker-buildx-and-push:
    docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg ENVIRONMENT=dev \
    --build-arg DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
    -t ggrant92/edcw-backend:latest \
    --push \
    .

pull-and-run:
    docker pull ggrant92/edcw-backend:latest
    docker ps -q --filter "ancestor=ggrant92/edcw-backend:latest" | xargs -r docker stop
    docker ps -a -q --filter "ancestor=ggrant92/edcw-backend:latest" | xargs -r docker rm
    docker run -d \
        --name edcw-backend \
        --network edc-net \
        -p 8000:8000 \
        --env-file .env.local \
        ggrant92/edcw-backend:latest


# Tears down and removes the running container from build-and-run
teardown:
    docker stop edcw-backend || true
    docker rm edcw-backend || true
    docker stop edcw-backend-local || true
    docker rm edcw-backend-local || true

start-local-db:
    docker run --name edc-portal-postgres \
        -e POSTGRES_PASSWORD=devpassword \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_DB=edc_portal \
        -p 5432:5432 \
        -v edc-portal-data:/var/lib/postgresql/data \
        -d postgres:17 \
        && echo "The Dev Database is Running at postgresql://postgres:devpassword@localhost:5432/edc_portal 😎"

stop-local-db:
    docker stop edc-portal-postgres || true
    docker rm edc-portal-postgres || true
