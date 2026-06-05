
import { config } from "dotenv";
import { resolve } from "node:path";
import type { Model } from "mongoose";

config({ path: resolve(process.cwd(), ".env") });

async function syncModelIndexes(model: Model<unknown>): Promise<void> {
  const diff = await model.diffIndexes();
  for (const indexName of diff.toDrop) {
    try {
      await model.collection.dropIndex(indexName);
      console.log(`  dropped ${indexName}`);
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if (code !== 27) throw err; // IndexNotFound
    }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await model.createIndexes();
      return;
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if (code !== 85) throw err;
      const errmsg = String((err as { errorResponse?: { errmsg?: string } }).errorResponse?.errmsg ?? "");
      const match = errmsg.match(/existing index:.*name: "([^"]+)"/);
      const indexName = match?.[1];
      if (!indexName) throw err;
      try {
        await model.collection.dropIndex(indexName);
        console.log(`  dropped conflicting ${indexName} (TTL/options mismatch)`);
      } catch (dropErr: unknown) {
        const dropCode = (dropErr as { code?: number }).code;
        if (dropCode !== 27) throw dropErr;
      }
    }
  }
}

async function main() {
  const mongoUri = process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    console.error("Falta MONGODB_URI (o MONGO_URI) en .env (ver .env.example)");
    process.exit(1);
  }
  const { connectMongo } = await import("../src/lib/mongo");
  const { ALL_MODELS } = await import("../src/models");
  await connectMongo();
  for (const model of ALL_MODELS) {
    console.log(`[indexes] ${model.collection.name}`);
    await syncModelIndexes(model as Model<unknown>);
  }
  console.log("Índices sincronizados.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
