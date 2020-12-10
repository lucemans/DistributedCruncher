FROM lucemans/docker-deno:alpine

COPY ./index.ts ./index.ts

CMD ["deno", "run", "-A", "--unstable", "./index.ts"]