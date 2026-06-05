import { config } from 'dotenv';
import { resolve } from 'node:path';
import mongoose from 'mongoose';

config({ path: resolve(process.cwd(), '.env') });

type CollectionHealth = {
  name: string;
  count: number;
};

async function main() {
  const mongoUri = process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    console.error('Falta MONGODB_URI (o MONGO_URI) en .env');
    process.exit(1);
  }

  const { connectMongo } = await import('../src/lib/mongo');
  const { ALL_MODELS, SessionTokenModel, RateLimitModel } = await import('../src/models');

  await connectMongo();
  await mongoose.connection.db!.admin().ping();

  const now = new Date();
  const collections: CollectionHealth[] = [];

  for (const model of ALL_MODELS) {
    const count = await model.estimatedDocumentCount();
    collections.push({ name: model.collection.name, count });
  }

  const expiredSessions = await SessionTokenModel.countDocuments({
    expiresAt: { $lt: now },
  });
  const staleRateLimits = await RateLimitModel.countDocuments({
    resetAt: { $lt: now },
  });

  const indexSummary = await Promise.all(
    ALL_MODELS.map(async (model) => {
      const indexes = await model.collection.indexes();
      return {
        collection: model.collection.name,
        indexes: indexes.map((idx) => idx.name).filter(Boolean),
      };
    })
  );

  const report = {
    status: 'ok',
    checkedAt: now.toISOString(),
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    collections: collections.sort((a, b) => a.name.localeCompare(b.name)),
    maintenance: {
      expiredSessionTokens: expiredSessions,
      staleRateLimitEntries: staleRateLimits,
    },
    indexes: indexSummary,
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: 'error',
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    })
  );
  process.exit(1);
});
