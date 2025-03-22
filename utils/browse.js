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
    console.log('url', url);
    const response = await fetch(url, {
      "headers": {
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "accept-language": "en",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "image",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "cross-site",
        "Referer": "https://www.natomanga.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
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
    respond(res, 200, 'text/plain', await (await fetch(url, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en",
        "cache-control": "max-age=0",
        // "if-modified-since": "Sat, 22 Mar 2025 00:05:22 GMT",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        // "cookie": "__cflb=02DiuHeaTueuYie8hq3xjy9ZBKxoR3jpwAtLvEZsjYtWo; XSRF-TOKEN=eyJpdiI6ImdrSlduOFpuTXY4RGhidHNmbG5mTGc9PSIsInZhbHVlIjoiZjJhS2Iyc0E2dHhWM3FKSURpSncxZjljd2NhdlJ4ZHlPUTY3ZFpiY2JoakZKbDErUkUxZGtPWDl0bE9CTmtzY1FncFJkajVacFZLMTlrUVBiUlJnZ3ZLMlYvTEIzZUdROXJnRi91RVVMVzUzNzVDWTRCSFE0cHZzVkpoVkhlQXIiLCJtYWMiOiIwMTg1ZGFhYjA4YmQ1OGFiNTdjZTVhY2Y0ZDk5NjFmMWM4NWJjNTZjMTk0MDIwYTU5NWVmNmNiNWFkOGE4ZjdkIn0%3D; mangakakalot_session=eyJpdiI6ImtpK0J3SjVkRlFGbVVaUGhudEIwR1E9PSIsInZhbHVlIjoiSEVoeWN6Y2xKN3RkMGlyQjBLSEdwZUc5SGpLZUw4OTM5bSs0UUpKT2hVdFd3Vm40OFo3aldaWjVocUFJSkEvZVZ1Y0hWWEFCWXpkOVlSOGwvNnk5bVlnOWdFaEE5aENMZ1N5Nm1rREtRUC9GQ3VmTmxGR1lzbTU5RDFSOCtCVHYiLCJtYWMiOiI3NTFlODIxMTVjOWE1NjY1NTIzYWJhZDYzMDM5ZTMwYjY2Njg0OWFjOGU4YTU3OTFhMGNhOGU1YTlkOTE3MjBmIn0%3D",
        "Referer": "https://www.natomanga.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    })).text());
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