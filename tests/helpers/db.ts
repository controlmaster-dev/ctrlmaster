import mongoose from 'mongoose';
import { connectMongo } from '../../src/lib/mongo';

export async function isMongoAvailable(): Promise<boolean> {
  const uri =
    process.env.MONGODB_URI ??
    'mongodb://127.0.0.1:27017/controlmaster_test?directConnection=true';

  try {
    const connection = await mongoose
      .createConnection(uri, {
        serverSelectionTimeoutMS: Number(
          process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 3000
        ),
      })
      .asPromise();
    await connection.close();
    return true;
  } catch {
    return false;
  }
}

export async function resetDatabase(): Promise<void> {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) return;
  await db.dropDatabase();
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const globalForMongo = globalThis as typeof globalThis & {
    mongoosePromise?: Promise<typeof mongoose>;
  };
  delete globalForMongo.mongoosePromise;
}
