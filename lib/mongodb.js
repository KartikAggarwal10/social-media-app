import { MongoClient } from "mongodb";

let client;
let connection;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB || "social_media";

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not configured. Add it to .env.local before starting the app."
    );
  }

  if (!client) {
    client = new MongoClient(uri);
    connection = client.connect();
  }

  await connection;
  return client.db(databaseName);
}