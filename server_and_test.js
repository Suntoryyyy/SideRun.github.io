const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));

const server = app.listen(8090, async () => {
    console.log('Server running on 8090');
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        
        await page.goto('http://127.0.0.1:8090', { waitUntil: 'networkidle0' });
        await browser.close();
    } catch(e) {
        console.error(e);
    } finally {
        server.close();
    }
});
