require('dotenv').config();
const http = require('http');
const url = require('url');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { sendFile, sendImage, downloadImage, fetchHTML, deleteAllFilesWithPrefix, deleteFile } = require('./utils/browse');

const mongoURI = process.env.MONGO_URI;
let db;

const connectToDatabase = async () => {
  try {
    const client = new MongoClient(mongoURI);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

const parseRequestBody = async (req) => {
  return new Promise((resolve) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (error) {
        console.error('Error parsing JSON request body:', error);
        resolve(null);
      }
    });
  });
};

const saveToList = async (data) => {
  try {
    const collection = db.collection('list');
    await collection.deleteMany({ userId: data.userId, title: data.title });
    await collection.insertOne(data);
  } catch (error) {
    console.error('Error saving/updating data to MongoDB:', error);
  }
}

const getList = async (userId, title, chapter) => {
  try {
    const collection = db.collection('list');
    const query = { userId };
    if (title)
      query.title = title;
    if (chapter)
      query.chapter = chapter;
    const lists = await collection.find(query).toArray();
    return lists;
  } catch (error) {
    console.error('Error getting lists from MongoDB:', error);
    return [];
  }
}

const deleteListById = async (id) => {
  try {
    const collection = db.collection('list');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      console.log(`List with _id ${id} deleted successfully`);
      return true;
    } else {
      console.log(`List with _id ${id} not found`);
      return false;
    }
  } catch (error) {
    console.error('Error deleting list from MongoDB:', error);
    return false;
  }
}

connectToDatabase();

const server = http.createServer(async (req, res) => {
  switch (true) {
    case req.method === 'POST' && req.url === '/list':
      const body = await parseRequestBody(req);
      if (body) {
        await saveToList(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Data saved successfully' }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
      break;
    case req.method === 'GET' && req.url.startsWith('/list?'):
      const { userId, title, chapter } = url.parse(req.url, true).query;
      const lists = await getList(userId, title, chapter);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(lists));
      break;
    case req.method === 'DELETE' && req.url.startsWith('/list?id='):
      const idToDelete = url.parse(req.url, true).query.id;
      console.log(idToDelete);
      const isDeleted = await deleteListById(idToDelete);
      res.writeHead(isDeleted ? 200 : 404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: isDeleted }));
      break;
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
      await downloadImage(res, url.parse(req.url, true).query);
      break;
    case req.method === 'GET' && req.url.startsWith('/images/'):
      sendImage(res, path.basename(path.join(__dirname, req.url)));
      break;
    case req.method === 'DELETE' && req.url.startsWith('/images?userId='):
      await deleteAllFilesWithPrefix(res, url.parse(req.url, true).query.userId);
      break;
    case req.method === 'DELETE' && req.url.startsWith('/image?userId='):
      await deleteFile(res, url.parse(req.url, true).query);
      break;
    default:
      await sendFile(res, 'public/index.html', 'text/html');
  }
});

server.listen(process.env.PORT || 3000, async () => {
  console.log('Server is up.');
});
