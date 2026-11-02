const { MongoClient } = require("mongodb");

async function check() {
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  await client.connect();
  const db = client.db("social_media");
  
  // getNetworkAction simulation for user 0 (followers)
  const user0 = await db.collection("users").findOne({ userId: 0 });
  const followersOf0 = user0.followers; // [4]
  const paginatedIds0 = followersOf0.slice(0, 10);
  
  const users0 = await db.collection("users")
    .find({ userId: { $in: paginatedIds0 } })
    .project({ userId: 1, userName: 1, dp: 1 })
    .toArray();
    
  console.log("Users returned for user 0 followers:", users0);
  
  // getNetworkAction simulation for user 4 (following/followed)
  const user4 = await db.collection("users").findOne({ userId: 4 });
  const followedBy4 = user4.followed; // [0]
  const paginatedIds4 = followedBy4.slice(0, 10);
  
  const users4 = await db.collection("users")
    .find({ userId: { $in: paginatedIds4 } })
    .project({ userId: 1, userName: 1, dp: 1 })
    .toArray();
    
  console.log("Users returned for user 4 following:", users4);
  
  process.exit(0);
}
check().catch(console.dir);
