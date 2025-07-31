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
const path = require('path');
const fs = require('fs/promises');
const stream = require('stream');

const app = express();

const PORT = process.env.PORT || 5001;
const REGISTRY_ADDR = process.env.REGISTRY_ADDR || '127.0.0.1';
const REGISTRY_PORT = process.env.REGISTRY_PORT || 5000;

require('dotenv').config({ encoding: 'utf-8', quiet: true, debug: false, override: true });

const { RegistryAPI } = require('./registry');

module.exports = {
    express,
    app,
    path,
    fs,
    stream,
    PORT,
    REGISTRY_ADDR,
    REGISTRY_PORT,
    RegistryAPI
}
