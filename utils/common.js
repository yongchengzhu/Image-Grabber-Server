const respond = (res, statusCode, contentType, content) => {
  try {
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

module.exports = { respond };