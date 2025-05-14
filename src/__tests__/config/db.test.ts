import mongoose from 'mongoose';
import logger from '../../utils/logger.util';
import { connectDatabase } from '../../config/db';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

jest.mock('../../utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const originalExit = process.exit;
process.exit = jest.fn() as any;

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.exit = originalExit;
  });

  it('should connect to the database successfully', async () => {
    const mockConnection = {
      connection: {
        host: 'mongodb.testhost.com',
      },
    };
    (mongoose.connect as jest.Mock).mockResolvedValue(mockConnection);

    await connectDatabase('mongodb://testdb', 'testdb');

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://testdb', { dbName: 'testdb' });

    expect(logger.info).toHaveBeenCalledWith(
      `Mongodb connected with server: ${mockConnection.connection.host}`
    );
    
    expect(logger.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const mockError = new Error('Connection error');
    (mongoose.connect as jest.Mock).mockRejectedValue(mockError);

    await connectDatabase('mongodb://error-db', 'error-db');

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://error-db', { dbName: 'error-db' });
    expect(logger.error).toHaveBeenCalledWith(`MongoDB connection error: ${mockError.message}`);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
}); 