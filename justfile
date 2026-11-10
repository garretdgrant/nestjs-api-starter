# Task shortcuts. Requires just: https://github.com/casey/just
# Run a recipe with `just <recipe>`; list them with `just --list`.

# Rename these when you copy the starter so containers, volumes and databases
# from different projects don't collide. Override per run with e.g.
# `just db_port=5433 start-local-db`.
app := "api-starter"
db_name := "api_starter"
db_port := "5432"
db_password := "devpassword"

# Start a local PostgreSQL container with a persistent volume
start-local-db:
    docker network create {{app}}-net 2>/dev/null || true
    docker run --name {{app}}-postgres \
        --network {{app}}-net \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD={{db_password}} \
        -e POSTGRES_DB={{db_name}} \
        -p {{db_port}}:5432 \
        -v {{app}}-postgres-data:/var/lib/postgresql \
        -d postgres:18
    @echo "Database: postgresql://postgres:{{db_password}}@localhost:{{db_port}}/{{db_name}}"

# Stop and remove the local PostgreSQL container (the data volume is kept)
stop-local-db:
    docker stop {{app}}-postgres || true
    docker rm {{app}}-postgres || true

# Build the Docker image
build:
    docker build -t {{app}} .

# Build the image and run it on port 8000 against the local database container
build-and-run: build
    docker run -d -p 8000:8000 \
        --name {{app}} \
        --network {{app}}-net \
        --env-file .env \
        -e DATABASE_URL=postgresql://postgres:{{db_password}}@{{app}}-postgres:5432/{{db_name}} \
        {{app}}

# Stop and remove the container started by build-and-run
teardown:
    docker stop {{app}} || true
    docker rm {{app}} || true
