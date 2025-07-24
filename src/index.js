console.log(`
================================================================
CNCF Distribution Registry UI - By DESMG
================================================================
Copyright (C) ${(new Date).getFullYear()} DESMG All rights reserved.
License: AGPLv3 - GNU Affero General Public License v3
         <https://www.gnu.org/licenses/agpl-3.0.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
================================================================
`);

const express = require('express');
const app = express();

const path = require('path');
const fs = require('fs/promises');

const PORT = process.env.PORT || 5001;
const REGISTRY_ADDR = process.env.REGISTRY_ADDR || '127.0.0.1';
const REGISTRY_PORT = process.env.REGISTRY_PORT || 5000;

const { RegistryAPI } = require('./registry');

require('dotenv').config({ encoding: 'utf-8', quiet: true, debug: false, override: true });

app.get('/', async (req, res) => {
    try {
        const templatePath = path.join(process.cwd(), 'src/index.html');
        let html = await fs.readFile(templatePath, 'utf-8');
        html = html
            .replaceAll('{{CPS_RID}}', process.env.CPS_RID || '')
            .replaceAll('{{CPS_RID_STR}}', process.env.CPS_RID_STR || '')
            .replaceAll('{{MIIT_RID}}', process.env.MIIT_RID || '')
            .replaceAll('{{TITLE}}', process.env.TITLE || 'A Registry')
            .replaceAll('{{DESCRIPTION}}', process.env.DESCRIPTION || 'A Registry')
            .replaceAll('{{KEYWORDS}}', process.env.KEYWORDS || 'Registry,Distribution');
        const data = await (new RegistryAPI(REGISTRY_ADDR, REGISTRY_PORT)).fetchAll();
        html = html.replace('{{TABLE_ROWS}}', data);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.use('/login', async (req, res) => {
    try {
        if (req.headers['Authorization']) {
            res.setHeader('Location', '/');
            res.status(302).send();
        }
        res.status(401).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.use('/v2', async (req, res) => {
    try {
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Registry UI listening on port ${PORT}...\n`);
    console.log(`Access the UI at http://${REGISTRY_ADDR}:${PORT}`);
    console.log(`Registry API is at http://${REGISTRY_ADDR}:${REGISTRY_PORT}/v2\n`);
});
