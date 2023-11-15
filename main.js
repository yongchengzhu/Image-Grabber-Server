const http = require('http');
const fs = require('fs').promises;
const url = require('url');
const path = require('path');

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

  const downloadImage = async (url) => {
    try {
      const response = await fetch(url, {
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

      if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const fileName = `image_${Date.now()}.jpg`;
      const filePath = `./images/${fileName}`;

      await fs.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  };

  if (req.url === '/script.js') {
    await sendFile('script.js', 'application/javascript');
  } else if (req.url === '/style.css') {
    await sendFile('style.css', 'text/css');
  } else if (req.url.startsWith('/search?url=')) {
    const searchURL = url.parse(req.url, true).query.url;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(await (await fetch(searchURL)).text());
  } else if (req.url.startsWith('/image?url=')) {
    const { query } = url.parse(req.url, true);
    const startPerformance = performance.now();
    const imagePath = await downloadImage(query.url);
    const endPerformance = performance.now();
    const executionTimePerformance = endPerformance - startPerformance;
    console.log(`Execution time: ${executionTimePerformance} milliseconds`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(imagePath);
  } else if (req.url.startsWith('/images/')) {
    const filePath = path.join(__dirname, req.url);
    try {
      console.log('filepath', filePath)
      const fileContent = await fs.readFile(filePath);
      const contentType = 'image/jpg';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fileContent);
      await fs.unlink(filePath);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  } else {
    await sendFile('index.html', 'text/html');
  }
});

server.listen(process.env.PORT || 3000, async () => {
  await fs.mkdir(path.join(__dirname, 'images'), { recursive: true });
  console.log('Server is up.');
});
