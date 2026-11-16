import { MongoClient } from "mongodb";

let client;
let clientPromise;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB || "social_media";

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not configured. Add it to your environment variables."
    );
  }

  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;

  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(databaseName);
  } catch (err) {
    global._mongoClientPromise = null;
    throw err;
  }
}