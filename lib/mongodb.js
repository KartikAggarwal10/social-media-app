import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017";  // Local MongoDB — NO ENV FILE
const client = new MongoClient(uri);

export async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
    console.log("Connected to LOCAL MongoDB");
  }
  return client.db("social_media");
}