const http = require('http');
const fs = require('fs').promises;
const url = require('url');
const stream = require('stream');

const server = http.createServer(async (req, res) => {
  const sendFile = async (path, contentType) => {
    try {
      const fileContent = await fs.readFile(path, 'utf8');
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fileContent);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  };

  let abortController = new AbortController();

  if (req.url === '/') {
    await sendFile('index.html', 'text/html');
  } else if (req.url === '/script.js') {
    await sendFile('script.js', 'application/javascript');
  } else if (req.url === '/style.css') {
    await sendFile('style.css', 'text/css');
  } else if (req.url.startsWith('/search')) {
    const searchURL = url.parse(req.url, true).query.url;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(await (await fetch(searchURL)).text());
  } else if (req.url.startsWith('/image')) {
    abortController.abort();
    abortController = new AbortController();

    const { query } = url.parse(req.url, true);
    const response = await fetch(query.url, {
      signal: abortController.signal,
      headers: {
        "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
      },
      referrer: "https://chapmanganato.com/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "omit",
    });

    if (res.headersSent) {
      console.error('Headers already sent, aborting request');
      return;
    }

    req.on('close', () => {
      console.log('Client disconnected, aborting request');
      abortController.abort();
    });

    res.writeHead(200, { 'Content-Type': 'text/plain' });

    await stream.pipeline(response.body, res, (error) => {
      if (error) {
        console.error('Pipeline failed:', error);
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is up.');
});
