const { MongoClient } = require("mongodb");

async function check() {
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  await client.connect();
  const db = client.db("social_media");
  
  const user0 = await db.collection("users").findOne({ userId: 0 });
  const user4 = await db.collection("users").findOne({ userId: 4 });
  
  console.log("User 0 followers:", user0?.followers);
  console.log("User 0 followed:", user0?.followed);
  console.log("User 0 request_came:", user0?.request_came);
  console.log("User 0 request_sent:", user0?.request_sent);
  
  console.log("User 4 followers:", user4?.followers);
  console.log("User 4 followed:", user4?.followed);
  console.log("User 4 request_came:", user4?.request_came);
  console.log("User 4 request_sent:", user4?.request_sent);
  
  process.exit(0);
}
check().catch(console.dir);
