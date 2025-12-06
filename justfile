# Justfile to simplify and organize commonly used bash commands
# Dependencies: just task runner https://www.npmjs.com/package/just-task
# run a just command with `just <COMMAND>`

# Build and run the image on port 8000
build-and-run:
    docker build -t nestjs-api-starter . && \
    docker run -d -p 8000:8000 nestjs-api-starter

# Tears down and removes the running container from build-and-run
teardown:
    docker ps -q --filter "ancestor=nestjs-api-starter" | xargs -r docker stop
    docker ps -a -q --filter "ancestor=nestjs-api-starter" | xargs -r docker rm

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
