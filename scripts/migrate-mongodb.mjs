import { loadEnvConfig } from "@next/env";
import { MongoClient } from "mongodb";

loadEnvConfig(process.cwd());

const sourceUri = process.env.SOURCE_MONGODB_URI || "mongodb://127.0.0.1:27017";
const targetUri = process.env.TARGET_MONGODB_URI;
const sourceDbName = process.env.SOURCE_MONGODB_DB || "social_media";
const targetDbName = process.env.TARGET_MONGODB_DB || "social_media";
const execute = process.argv.includes("--execute");

if (!targetUri) {
  throw new Error("TARGET_MONGODB_URI is required.");
}

if (sourceUri === targetUri && sourceDbName === targetDbName) {
  throw new Error("Source and target databases must be different.");
}

async function migrate() {
  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);
    const collections = await sourceDb.listCollections().toArray();
    const sourceCollections = collections.filter(
      (collection) =>
        !collection.name.startsWith("system.") &&
        collection.type === "collection"
    );

    console.log(
      `${execute ? "Migrating" : "Dry run"} ${sourceCollections.length} collection(s) from ${sourceDbName} to ${targetDbName}.`
    );

    for (const { name } of sourceCollections) {
      const documents = await sourceDb.collection(name).find({}).toArray();
      console.log(`${name}: ${documents.length} source document(s)`);

      if (!execute || documents.length === 0) {
        continue;
      }

      const operations = documents.map((document) => ({
        replaceOne: {
          filter: { _id: document._id },
          replacement: document,
          upsert: true,
        },
      }));

      for (let index = 0; index < operations.length; index += 500) {
        await targetDb
          .collection(name)
          .bulkWrite(operations.slice(index, index + 500), { ordered: false });
      }

      console.log(`${name}: copied without deleting target-only documents`);
    }

    if (!execute) {
      console.log("No changes made. Re-run with --execute to copy the data.");
    }
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
  }
}

migrate().catch((error) => {
  console.error(`MongoDB migration failed: ${error.message}`);
  process.exitCode = 1;
});
