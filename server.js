const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 3000);
const apiKey = process.env.NEWS_API_KEY;
const publicFiles = new Set(['/api.html', '/style.css', '/api.js']);

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === '/api/news') {
        if (!apiKey) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: 'error', message: 'NEWS_API_KEY is not configured.' }));
            return;
        }

        const query = url.searchParams.get('q');
        if (!query) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: 'error', message: 'Enter a topic to search.' }));
            return;
        }

        const upstreamUrl = new URL('https://newsapi.org/v2/everything');
        upstreamUrl.searchParams.set('q', query);
        upstreamUrl.searchParams.set('sortBy', 'popularity');
        upstreamUrl.searchParams.set('apiKey', apiKey);

        try {
            const upstream = await fetch(upstreamUrl);
            const data = await upstream.json();
            response.writeHead(upstream.status, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            });
            response.end(JSON.stringify(data));
        } catch (error) {
            response.writeHead(502, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: 'error', message: 'Unable to reach the news service.' }));
        }
        return;
    }

    let pathname = url.pathname === '/' ? '/api.html' : url.pathname;
    if (!publicFiles.has(pathname)) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }

    const filePath = path.join(__dirname, path.basename(pathname));
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }
        response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] });
        response.end(data);
    });
});

server.listen(port, () => {
    console.log(`Daily News running at http://localhost:${port}`);
});
