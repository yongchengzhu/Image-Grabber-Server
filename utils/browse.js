const fs = require('fs').promises;
const path = require('path');

const { respond } = require('./common');

const sendFile = async (res, path, contentType, isDelete=false) => {
  try {
    respond(res, 200, contentType, await fs.readFile(path));
    isDelete && await fs.unlink(path);
  } catch (error) {
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
};

const sendImage = (res, path) => {
  try {
    console.log('path', path);
    const imageStream = require('fs').createReadStream(path);
    res.setHeader('Content-Type', 'image/png');
    imageStream.pipe(res);
  } catch (error) {
    console.log(error);
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
}

const downloadImage = async (res, { url, userId }) => {
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
    const fileName = `${userId}_image_${Date.now()}.jpg`;
    await fs.writeFile(fileName, Buffer.from(await response.arrayBuffer()));
    respond(res, 200, 'text/plain', fileName);
  } catch (error) {
    console.log("Failed to download image", error);
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

const deleteAllFilesWithPrefix = async (res, prefix) => {
  try {
    await Promise.all((await fs.readdir('./')).filter(file => file.startsWith(prefix))
        .map(file => fs.unlink(path.join('./', file))));
    respond(res, 200, 'text/plain', ''); 
  } catch (error) {
    console.log(error);
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
}

module.exports = {
  sendFile,
  sendImage,
  downloadImage,
  fetchHTML,
  deleteAllFilesWithPrefix,
};