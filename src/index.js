const {
    express,
    app,
    path,
    fs,
    stream,
    PORT,
    REGISTRY_ADDR,
    REGISTRY_PORT,
    RegistryAPI
} = require('./imports');

const API = new RegistryAPI(REGISTRY_ADDR, REGISTRY_PORT);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.originalUrl}`);
    res.removeHeader("x-powered-by");
    next();
});

app.get('/', async (req, res) => {
    try {
        const templatePath = path.join(process.cwd(), 'src/index.html');
        const data = await API.fetchAll();
        let html = (await fs.readFile(templatePath, 'utf-8'))
            .replaceAll('{{CPS_RID}}', process.env.CPS_RID || '')
            .replaceAll('{{CPS_RID_STR}}', process.env.CPS_RID_STR || '')
            .replaceAll('{{MIIT_RID}}', process.env.MIIT_RID || '')
            .replaceAll('{{TITLE}}', process.env.TITLE || 'A Registry')
            .replaceAll('{{DESCRIPTION}}', process.env.DESCRIPTION || 'A Registry')
            .replaceAll('{{KEYWORDS}}', process.env.KEYWORDS || 'Registry,Distribution')
            .replace('{{TABLE_ROWS}}', data);
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (err) {
        console.error(err);
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send('Server Error');
    }
});

async function isBlobJson(path) {
    const handle = await fs.open(path, 'r');
    try {
        const buffer = Buffer.alloc(4096);
        const { bytesRead } = await handle.read(buffer, 0, 4096, 0); // 读取前 4 KB
        const text = buffer.subarray(0, bytesRead).toString('utf-8').trim(); // 转换为字符串并去除首尾空白
        return text.startsWith('{') && text.endsWith('}') || text.includes('"architecture"');
    } finally {
        await handle.close();
    }
}

async function isProtectedPath(method, uri) {
    if (method !== 'GET') return true;
    const match = uri.match(/^\/(.+)\/(.+)\/blobs\/sha256:(.+)$/);
    if (!match) return false;
    const sha256 = match[3];
    const dir = sha256.slice(0, 2);
    const allowedPath = `/www/server/registry/data/docker/registry/v2/blobs/sha256/${dir}/${sha256}/data`;
    const allowedFile = await isBlobJson(allowedPath);
    return allowedFile ? false : true;
}

function checkIfLoggedIn(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return false;
    const [type, token] = authHeader.split(' ');
    if (type !== 'Basic' || !token) return false;
}

app.use('/v2', async (req, res) => {
    try {
        const URI = req.originalUrl.replace('/v2', '');
        const method = req.method;

        const isProtected = await isProtectedPath(req.method, URI);
        const isAuthenticated = checkIfLoggedIn(req);

        if (isProtected && !isAuthenticated) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Registry"');
            return res.status(401).send('Authentication required.');
        }

        const response = await API.request(URI, method, req.headers, req.body);
        res.status(response.status);
        const safeHeaders = {};
        for (const [k, v] of Object.entries(response.headers)) {
            if (v !== null && v !== undefined) safeHeaders[k] = v;
        }
        res.set(safeHeaders);
        stream.pipeline(response.body, res, () => { });
        res.status(200).send();
    } catch (err) {
        console.error(err);
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send('Server Error');
    }
});


app.listen(PORT, () => {
    console.log(`Registry UI listening on port ${PORT}...\n`);
    console.log(`Access the UI at http://${REGISTRY_ADDR}:${PORT}`);
    console.log(`Registry API is at http://${REGISTRY_ADDR}:${REGISTRY_PORT}/v2\n`);
});
