import mongoose from "mongoose";

// Pre-load all models so Mongoose .populate() never throws MissingSchemaError in serverless lambdas
import "@/models/Bill";
import "@/models/Person";
import "@/models/Split";
import "@/models/PaymentRequest";
import "@/models/PaymentTransaction";
import "@/models/WhatsAppMessage";
import "@/models/AuditLog";
import "@/models/User";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
