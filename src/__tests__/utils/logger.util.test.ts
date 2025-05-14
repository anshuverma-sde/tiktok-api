import logger from '../../utils/logger.util';

jest.mock('winston', () => {
  const infoMock = jest.fn();
  const errorMock = jest.fn();
  const warnMock = jest.fn();
  const debugMock = jest.fn();
  
  return {
    format: {
      timestamp: jest.fn().mockReturnValue({}),
      printf: jest.fn().mockReturnValue({}),
      combine: jest.fn().mockReturnValue({}),
      colorize: jest.fn().mockReturnValue({}),
    },
    createLogger: jest.fn().mockReturnValue({
      info: infoMock,
      error: errorMock,
      warn: warnMock,
      debug: debugMock,
    }),
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

jest.mock('winston-daily-rotate-file', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('morganStream', () => {
    it('should have a write method that calls logger.info', () => {
      expect(logger.morganStream).toBeDefined();
      expect(typeof logger.morganStream.write).toBe('function');
      
      const message = '  Test log message with whitespace  ';
      logger.morganStream.write(message);
      
      expect(logger.info).toHaveBeenCalledWith('Test log message with whitespace');
    });
  });
  
  describe('logger methods', () => {
    it('should have basic logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      
      const message = 'Test message';
      logger.info(message);
      logger.error(message);
      logger.warn(message);
      logger.debug(message);
      
      expect(logger.info).toHaveBeenCalledWith(message);
      expect(logger.error).toHaveBeenCalledWith(message);
      expect(logger.warn).toHaveBeenCalledWith(message);
      expect(logger.debug).toHaveBeenCalledWith(message);
    });
  });
}); 