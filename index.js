const http = require('http');
const url = require('url');
const path = require('path');

const { sendFile, downloadImage } = require('./utils/file');
const { fetchHTML } = require('./utils/scrape');

const server = http.createServer(async (req, res) => {
  switch (true) {
    case req.url === '/script.js':
      await sendFile(res, 'public/script.js', 'application/javascript');
      break;
    case req.url === '/style.css':
      await sendFile(res, 'public/style.css', 'text/css');
      break;
    case req.url.startsWith('/search?url='):
      await fetchHTML(res, url.parse(req.url, true).query.url);
      break;
    case req.url.startsWith('/image?url='):
      await downloadImage(res, url.parse(req.url, true).query.url);
      break;
    case req.url.startsWith('/images/'):
      await sendFile(res, path.basename(path.join(__dirname, req.url)), 'image/jpg', true);
      break;
    default:
      await sendFile(res, 'public/index.html', 'text/html');
  }
});

server.listen(process.env.PORT || 3000, async () => {
  console.log('Server is up.');
});
