import mongoose from "mongoose";
import { mongoUriFromEnv, resolveMongoUri } from "@/lib/mongodbUri";

const globalForMongo = globalThis as typeof globalThis & {
  mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalForMongo.mongoosePromise) {
    const uri = resolveMongoUri(mongoUriFromEnv());
    globalForMongo.mongoosePromise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 20_000,
    });
  }

  await globalForMongo.mongoosePromise;
  return mongoose;
}
