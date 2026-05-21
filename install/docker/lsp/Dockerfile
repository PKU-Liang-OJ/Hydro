FROM node:22

COPY language-server /tmp/language-server

RUN apt-get -qq update && \
    apt-get install -y \
    clangd \
    libz3-dev \
    python3-pip && \
    python3 -m pip install --break-system-packages --no-cache-dir -U 'python-lsp-server[all]' z3-solver && \
    yarn global add hydrooj /tmp/language-server

ENTRYPOINT ["node", "/usr/local/share/.config/yarn/global/node_modules/@hydrooj/language-server/bin/hydro-language-server.js", "9999"]
