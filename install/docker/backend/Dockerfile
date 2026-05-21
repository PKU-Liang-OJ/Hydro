FROM node:22

WORKDIR /opt/hydro

COPY . /opt/hydro
COPY install/docker/backend/entrypoint.sh /root/entrypoint.sh

RUN corepack enable && \
    corepack prepare yarn@4.9.2 --activate && \
    yarn install --mode=skip-build && \
    node build/prepare.js && \
    yarn build:ui:production && \
    cd language-server && npm install --omit=dev && \
    npm install -g pm2 && \
    ln -sf /opt/hydro/packages/hydrooj/bin/hydrooj.js /usr/local/bin/hydrooj && \
    chmod +x /root/entrypoint.sh

ENTRYPOINT ["/root/entrypoint.sh"]
