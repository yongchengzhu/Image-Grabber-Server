const http = require('http');
const fs = require('fs');
const url = require('url');
const stream = require('stream');

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else if (req.url === '/script.js') {
    const scriptContent = fs.readFileSync('script.js', 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(scriptContent);
  } else if (req.url === '/style.css') {
    const styleContent = fs.readFileSync('style.css', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(styleContent);
  } else if (req.url.startsWith('/search')) {
    const searchURL = url.parse(req.url, true).query.url;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(await (await fetch(searchURL)).text());
  } else if (req.url.startsWith('/image')) {
    const response = await fetch(url.parse(req.url, true).query.url, {
      "headers": {
        "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\""
      },
      "referrer": "https://chapmanganato.com/",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "omit"
    });

    req.on('close', () => {
      console.log('Client disconnected, aborting request');
      if (!response.body.locked) {
        response.body.cancel();
      }
    });

    res.writeHead(200, { 'Content-Type': 'text/plain' });

    await stream.pipeline(response.body, res, (error) => {
      if (error) {
        console.error('Pipeline failed:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is up.');
})