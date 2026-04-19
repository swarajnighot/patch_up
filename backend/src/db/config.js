const { MongoClient } = require("mongodb");

const MONGO_DB = process.env.MONGO_DB || "mydatabase";

let mongoUri;

if (process.env.MONGO_URI) {
  mongoUri = process.env.MONGO_URI;
} else {
  const MONGO_HOST = process.env.MONGO_HOST || "localhost";
  const MONGO_PORT = process.env.MONGO_PORT || "27017";
  const MONGO_USER = process.env.MONGO_USER || "";
  const MONGO_PASS = process.env.MONGO_PASS || "";

  if (MONGO_USER && MONGO_PASS) {
    mongoUri = `mongodb://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASS)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
  } else {
    mongoUri = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
  }
}

const client = new MongoClient(mongoUri);

async function connectToDB() {
  await client.connect();
  return client.db(MONGO_DB);
}

module.exports = {
  client,
  connectToDB,
};
