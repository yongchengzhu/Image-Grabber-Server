const fs = require('fs').promises;

const { respond } = require('./common');

const sendFile = async (res, path, contentType, isDelete=false) => {
  try {
    respond(res, 200, contentType, await fs.readFile(path));
    isDelete && await fs.unlink(path);
  } catch (error) {
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
};

const downloadImage = async (res, url) => {
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
    const fileName = `image_${Date.now()}.jpg`;
    await fs.writeFile(fileName, Buffer.from(await response.arrayBuffer()));
    respond(res, 200, 'text/plain', fileName);
  } catch (error) {
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
};

const fetchHTML = async (res, url) => {
  try {
    respond(res, 200, 'text/plain', await (await fetch(url)).text());
  } catch (error) {
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
}

module.exports = {
  sendFile,
  downloadImage,
  fetchHTML,
};