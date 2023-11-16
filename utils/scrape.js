const { respond } = require('./common');

const fetchHTML = async (res, url) => {
  try {
    respond(res, 200, 'text/plain', await (await fetch(url)).text());
  } catch (error) {
    respond(res, 500, 'text/plain', 'Internal Server Error');
  }
}

module.exports = { fetchHTML };