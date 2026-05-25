#!/bin/sh

ROOT=/root/.hydro

node -e "const fs=require('fs');const p='$ROOT/addon.json';let a=[];try{a=JSON.parse(fs.readFileSync(p,'utf8'))}catch{};a=a.filter((x)=>!['@hydrooj/ui-default','@hydrooj/language-server'].includes(x));for(const x of ['/opt/hydro/packages/ui-default','/opt/hydro/language-server'])if(!a.includes(x))a.push(x);fs.writeFileSync(p,JSON.stringify(a,null,2));"

if [ ! -f "$ROOT/config.json" ]; then
    echo '{"host": "oj-mongo", "port": "27017", "name": "hydro", "username": "", "password": ""}' > "$ROOT/config.json"
fi

if [ ! -f "$ROOT/first" ]; then
    echo "for marking use only!" > "$ROOT/first"

    hydrooj cli user create systemjudge@systemjudge.local judge examplepassword 2
    hydrooj cli user setJudge 2
fi

# In Docker, nginx reaches the backend through the container network. Keep this
# outside the first-run block so a rebuilt Mongo volume cannot reset the server
# to loopback-only while the backend volume still has the first-run marker.
hydrooj cli system set server.host 0.0.0.0

pm2-runtime start hydrooj
