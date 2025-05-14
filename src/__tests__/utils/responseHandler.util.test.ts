import { Response } from 'express';
import { ResponseHandler } from '../../utils/responseHandler.util';
import { HttpStatus, SuccessMessages } from '../../constants/http.constants';

describe('ResponseHandler', () => {
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    } as Partial<Response>;
  });

  describe('success', () => {
    it('should send success response with default status code', () => {
      ResponseHandler.success(mockResponse as Response);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true });
    });

    it('should send success response with custom status code', () => {
      ResponseHandler.success(mockResponse as Response, HttpStatus.CREATED);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true });
    });

    it('should include data if provided', () => {
      const data = { id: 1, name: 'Test' };
      ResponseHandler.success(mockResponse as Response, HttpStatus.OK, data);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true, data });
    });

    it('should include message if provided', () => {
      const message = 'Test success message';
      ResponseHandler.success(mockResponse as Response, HttpStatus.OK, undefined, message);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true, message });
    });

    it('should include both data and message if provided', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Test success message';
      ResponseHandler.success(mockResponse as Response, HttpStatus.OK, data, message);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true, data, message });
    });
  });

  describe('created', () => {
    it('should send created response with default message', () => {
      ResponseHandler.created(mockResponse as Response);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonSpy).toHaveBeenCalledWith({ 
        success: true, 
        message: SuccessMessages.CREATED 
      });
    });

    it('should send created response with data', () => {
      const data = { id: 1, name: 'Test' };
      ResponseHandler.created(mockResponse as Response, data);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonSpy).toHaveBeenCalledWith({ 
        success: true, 
        data, 
        message: SuccessMessages.CREATED 
      });
    });

    it('should send created response with custom message', () => {
      const message = 'Custom created message';
      ResponseHandler.created(mockResponse as Response, undefined, message);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true, message });
    });
  });

  describe('updated', () => {
    it('should send updated response with default message', () => {
      ResponseHandler.updated(mockResponse as Response);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ 
        success: true, 
        message: SuccessMessages.UPDATED 
      });
    });

    it('should send updated response with data', () => {
      const data = { id: 1, name: 'Test' };
      ResponseHandler.updated(mockResponse as Response, data);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ 
        success: true, 
        data, 
        message: SuccessMessages.UPDATED 
      });
    });

    it('should send updated response with custom message', () => {
      const message = 'Custom updated message';
      ResponseHandler.updated(mockResponse as Response, undefined, message);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true, message });
    });
  });

  describe('info', () => {
    it('should send info response with default status code', () => {
      ResponseHandler.info(mockResponse as Response);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true });
    });

    it('should send info response with custom status code', () => {
      ResponseHandler.info(mockResponse as Response, HttpStatus.OK);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true });
    });

    it('should include message if provided', () => {
      const message = 'Test info message';
      ResponseHandler.info(mockResponse as Response, HttpStatus.NO_CONTENT, message);
      
      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(jsonSpy).toHaveBeenCalledWith({ success: true, message });
    });
  });
}); 