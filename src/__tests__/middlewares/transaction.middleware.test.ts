import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { withTransaction } from '../../middlewares/transaction.middleware';

jest.mock('mongoose', () => ({
  connection: {
    transaction: jest.fn()
  }
}));

describe('Transaction Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockController: jest.Mock;
  let mockSession: Partial<mongoose.ClientSession>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    mockController = jest.fn();
    mockSession = {};

    jest.clearAllMocks();
  });

  it('should wrap controller in a transaction', async () => {
    const expectedResult = { success: true };
    mockController.mockResolvedValue(expectedResult);

    (mongoose.connection.transaction as jest.Mock).mockImplementation(
      async (callback) => callback(mockSession)
    );

    const wrappedController = withTransaction(mockController);

    const result = await wrappedController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mongoose.connection.transaction).toHaveBeenCalled();
    expect(mockController).toHaveBeenCalledWith(
      mockRequest,
      mockResponse,
      mockSession
    );
    expect(result).toBe(expectedResult);
  });

  it('should pass through controller results', async () => {
    const responseData = { data: 'test' };
    mockController.mockImplementation(async (req, res) => {
      res.status(200).json(responseData);
    });

    (mongoose.connection.transaction as jest.Mock).mockImplementation(
      async (callback) => callback(mockSession)
    );

    const wrappedController = withTransaction(mockController);

    await wrappedController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mongoose.connection.transaction).toHaveBeenCalled();
    expect(mockController).toHaveBeenCalledWith(
      mockRequest,
      mockResponse,
      mockSession
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(responseData);
  });

  it('should propagate errors from the transaction', async () => {
    const expectedError = new Error('Transaction failed');
    
    (mongoose.connection.transaction as jest.Mock).mockRejectedValue(expectedError);

    const wrappedController = withTransaction(mockController);

    await expect(
      wrappedController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )
    ).rejects.toThrow(expectedError);

    expect(mockController).not.toHaveBeenCalled();
  });

  it('should propagate errors from the controller', async () => {
    const controllerError = new Error('Controller error');
    mockController.mockRejectedValue(controllerError);

    (mongoose.connection.transaction as jest.Mock).mockImplementation(
      async (callback) => {
        try {
          return await callback(mockSession);
        } catch (error) {
          throw error;
        }
      }
    );

    const wrappedController = withTransaction(mockController);

    await expect(
      wrappedController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )
    ).rejects.toThrow(controllerError);

    expect(mockController).toHaveBeenCalledWith(
      mockRequest,
      mockResponse,
      mockSession
    );
  });
}); 