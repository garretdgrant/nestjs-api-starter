# Task shortcuts. Requires just: https://github.com/casey/just
# Run a recipe with `just <recipe>`; list them with `just --list`.

# Rename these when you copy the starter so containers, volumes and databases
# from different projects don't collide. Override per run with e.g.
# `just db_port=5434 start-local-db`.
app := "api-starter"
db_name := "api_starter"
db_port := "5433"
db_password := "devpassword"
db_url := "postgresql://postgres:" + db_password + "@localhost:" + db_port + "/" + db_name

# Install dependencies, start PostgreSQL, and initialize the local schema
bootstrap: start-local-db
    #!/usr/bin/env sh
    set -eu
    pnpm install
    attempts=0
    until docker exec {{app}}-postgres pg_isready -q -h 127.0.0.1 -U postgres -d {{db_name}}; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 30 ]; then
            echo 'PostgreSQL did not become ready. Check docker logs {{app}}-postgres.' >&2
            exit 1
        fi
        sleep 1
    done
    DATABASE_URL='{{db_url}}' pnpm run prisma:migrate:deploy
    pnpm run prisma:generate

# Start or reuse a local PostgreSQL container with a persistent volume
[default]
start-local-db:
    #!/usr/bin/env sh
    set -eu
    if docker container inspect {{app}}-postgres >/dev/null 2>&1; then
        host_port=$(docker container inspect --format '{{{{(index (index .HostConfig.PortBindings "5432/tcp") 0).HostPort}}' {{app}}-postgres)
        if [ "$host_port" != '{{db_port}}' ]; then
            echo "{{app}}-postgres is configured for port $host_port. Run just stop-local-db before changing ports." >&2
            exit 1
        fi
        docker start {{app}}-postgres >/dev/null
    else
        docker network create {{app}}-net 2>/dev/null || true
        docker run --name {{app}}-postgres \
            --network {{app}}-net \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD={{db_password}} \
            -e POSTGRES_DB={{db_name}} \
            -p {{db_port}}:5432 \
            -v {{app}}-postgres-data:/var/lib/postgresql \
            -d postgres:18
    fi
    echo 'Database: {{db_url}}'

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
