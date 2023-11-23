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

const sendImage = (res, filePath) => {
  try {
    if (!require('fs').existsSync(filePath)){
      respond(res, 200, 'text/plain', '');
      return;
    }
    const imageStream = require('fs').createReadStream(filePath);
    imageStream.on('error', (error) => {
      if (error.code === 'ENOENT') {
        // File not found, respond accordingly
        respond(res, 404, 'text/plain', 'File not found');
      } else {
        // Other errors, log and respond with a 500 status
        console.error(error);
        respond(res, 500, 'text/plain', 'Internal Server Error');
      }
    });
    res.setHeader('Content-Type', 'image/png');
    imageStream.pipe(res);
  } catch (error) {
    console.log(error);
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
}

const downloadImage = async (res, { url, userId, index }) => {
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
      timeout: 100000000,
    });
    const fileName = `${userId}_image_${index}.jpg`;
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

const deleteFile = async (res, { userId, page }) => {
  try {
    const filePath = path.join('./', `${userId}_image_${page}.jpg`);
    if (require('fs').existsSync(filePath))
      fs.unlink(filePath);
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
  deleteFile,
};