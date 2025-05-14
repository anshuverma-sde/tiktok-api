import mongoose from 'mongoose';
import logger from '../utils/logger.util';

export const connectDatabase = (uri: string, dbName: string) =>
  mongoose
    .connect(uri, { dbName })
    .then((data) => {
      logger.info(`Mongodb connected with server: ${data.connection.host}`);
    })
    .catch((e) => {
      logger.error(`MongoDB connection error: ${e.message}`);
      process.exit(1);
    });
