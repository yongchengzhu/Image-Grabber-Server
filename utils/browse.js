const fs = require('fs').promises;
const path = require('path');

const { respond } = require('./common');

const sendFile = async (res, path, contentType, isDelete=false) => {
  try {
    respond(res, 200, contentType, await fs.readFile(path));
    isDelete && await fs.unlink(path);
  } catch (error) {
    console.log("Failed to send file.", error);
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
        "accept-language": "en-US,en;q=0.9",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
//        "cookie": "_ga_SFMBZBJXPJ=GS1.1.1743277461.1.0.1743277461.0.0.0; _ga=GA1.1.330194431.1743277461; XSRF-TOKEN=eyJpdiI6Ilg0RTh3NTdJYzN2MVhwQnFocFRjVlE9PSIsInZhbHVlIjoicWlpam0yRFFuTUFVZjhES09SNEQ0M2VpeWZidGFhUy9LMkh4b2hDb1hLR3F5cFFnRVNDb2V2NitRMFZVTGo3WURFNzl4Ni9Cc3ZHOVVlVEUzbnprVjFUYUR5TllCUzMzT1JFRmN6Q2IrdldYaGVRajBrNWUzbEt2VHpxUlRVUnUiLCJtYWMiOiI5YTFjNDkxYjg0NjQyZjM3Y2Y1YzFlODVhYjc1NzQ3MTkyMDkxM2E3ZDIzMzEzZWNlZTUwODkzZmFmZTAxN2RmIn0%3D; mangakakalot_session=eyJpdiI6ImJOTlBCR2dRNkk4VUc0cFFFSlpFd0E9PSIsInZhbHVlIjoiRmI2T3VOUEl3SWlFanlJS1NkbC9BSWUxUmIvY1N6Nk9Xak0reG5UZXNhUi9kMTFTYUVJTU92Q1k3WWc3RGlxTWFyOFh1TGlENlQ0NlR1MlJYN0JyKzBCNHZ2di9TdG9UbDBQeHdqaTNHdzQvSVc3U2Q2ZnVpdjlpaVZTZVU1S28iLCJtYWMiOiJkYmU0ZjA5MjczMTVhY2Y5Yzk1MTZiMzVhMGU5Y2Y3ODM0MjI4Y2FlMzhiZGU0ZTdiZDJkZjdiZTdmMWViZDgzIn0%3D; __cflb=02DiuHeaTueuYie8hq4o5ScYiR5h8sSK2fkA7o5xQ2XXh",
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
    console.log("Failed to delete all files with prefix", error);
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
    console.log("Failed to delete file", error);
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