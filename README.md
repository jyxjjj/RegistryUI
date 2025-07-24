# DESMG - CNCF Registry UI

A [CNCF Distribution](https://github.com/distribution/distribution) Registry proxy that
distinguishes config blobs from layer blobs to apply authentication only when needed.

And display all images and tags in a html UI, with delete capability.

> [!WARNING]
> Unstaged, not production ready.

## Installation

```bash
cd /www/server/registry/proxy/
ln -sf /www/server/registry/proxy/registryui.service /etc/systemd/system/registryui.service
systemctl daemon-reload
sudo -u www npm i
systemctl enable --now registryui.service
```

## LICENSE

[AGPL-3.0-Only](LICENSE)
