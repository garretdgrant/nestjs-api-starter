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
