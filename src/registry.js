const { buildTableRows } = require('./table');
const { formatAgo, formatSize } = require('./utils');

class RegistryAPI {
    constructor(addr, port) {
        this.rows = [];
        this.REGISTRY_ADDR = addr;
        this.REGISTRY_PORT = port;
        this.REGISTRY_URL = `http://${addr}:${port}/v2`;
    }

    async fetchAll() {
        this.rows = [];
        const res = await fetch(`${this.REGISTRY_URL}/_catalog`);
        const data = await res.json();
        const repos = [
            ...data.repositories.filter(r => r.startsWith('library')).sort(),
            ...data.repositories.filter(r => !r.startsWith('library')).sort()
        ];
        for (const repo of repos) {
            await this.fetchRepoTags(repo);
        }
        return buildTableRows(this.rows);
    }

    async fetchRepoTags(repo) {
        const res = await fetch(`${this.REGISTRY_URL}/${repo}/tags/list`);
        const data = await res.json();
        for (const tags of (data.tags || [])) {
            await this.fetchTagManifest(repo, tags);
        }
    }

    async fetchTagManifest(repo, tag) {
        const res = await fetch(`${this.REGISTRY_URL}/${repo}/manifests/${tag}`, { headers: { Accept: 'application/vnd.oci.image.manifest.v1+json' } });
        const data = await res.json();
        const hash = data.config?.digest || '-';
        const size = formatSize(data.layers?.reduce((acc, l) => acc + (l.size || 0), 0) || 0);
        await this.fetchConfigBlob(repo, tag, hash, size);
    }

    async fetchConfigBlob(repo, tag, hash, size) {
        const res = await fetch(`${this.REGISTRY_URL}/${repo}/blobs/${hash}`);
        const data = await res.json();
        const arch = data.architecture || '-';
        const created = data.created ? formatAgo(data.created) : '-';
        this.addRow(repo, size, hash, tag, arch, created);
    }

    addRow(repo, size, hash, tag, arch, created) {
        const row = { repo, tag, arch, hash, size, created };
        this.rows.push(row);
    }

    async request(URI, method, headers, body) {
        const url = `${this.REGISTRY_URL}${URI}`;
        const options = {
            method: method,
            headers: {
                'Accept': headers['accept'] || null,
                'Accept-Encoding': headers['accept-encoding'] || null,
                'Accept-Language': headers['accept-language'] || null,
                'Content-Type': headers['content-type'] || null,
                'Host': headers['host'],
                'X-Forwarded-Proto': headers['x-forwarded-proto'] || null,
                'X-Forwarded-For': headers['x-forwarded-for'] || null,
                'User-Agent': headers['user-agent'] || null,
                'SEC-CH-UA': headers['sec-ch-ua'] || null,
                'IF-None-Match': headers['if-none-match'] || null,
                'Authorization': headers['authorization'] || null,
            },
            body: method === 'get' ? null : body
        };
        const res = await fetch(url, options);
        return {
            status: res.status,
            headers: {
                'Content-Type': res.headers.get('content-type') || 'application/json',
                'Content-Length': res.headers.get('content-length') || null,
                'Docker-Content-Digest': res.headers.get('docker-content-digest') || null,
                'Docker-Distribution-Api-Version': res.headers.get('docker-distribution-api-version') || null,
                'ETag': res.headers.get('etag') || null,
                'Last-Modified': res.headers.get('last-modified') || null,
            },
            body: res.body
        };
    }
}

module.exports = {
    RegistryAPI,
};
