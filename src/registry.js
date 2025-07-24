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
}

module.exports = {
    RegistryAPI,
};
