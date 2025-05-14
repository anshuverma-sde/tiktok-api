import cron from 'node-cron';
import { AuthService } from '../../services/auth.service';
import logger from '../../utils/logger.util';
import { initScheduledTasks } from '../../utils/scheduler.util';

jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../../services/auth.service', () => ({
  AuthService: {
    cleanupUnverifiedUsers: jest.fn(),
  },
}));

jest.mock('../../utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Scheduler Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should schedule unverified users cleanup task', () => {
    initScheduledTasks();
    
    expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
  });
  
  it('should run cleanupUnverifiedUsers on schedule', async () => {
    initScheduledTasks();
    
    const scheduledFunction = (cron.schedule as jest.Mock).mock.calls[0][1];
    
    await scheduledFunction();
    
    expect(AuthService.cleanupUnverifiedUsers).toHaveBeenCalled();
    
    expect(logger.info).toHaveBeenCalledWith('Running scheduled cleanup of unverified users');
    expect(logger.info).toHaveBeenCalledWith('Completed cleanup of unverified users');
  });
  
  it('should handle errors during task execution', async () => {
    const mockError = new Error('Test error');
    (AuthService.cleanupUnverifiedUsers as jest.Mock).mockRejectedValueOnce(mockError);
    
    initScheduledTasks();
    
    const scheduledFunction = (cron.schedule as jest.Mock).mock.calls[0][1];
    
    await scheduledFunction();
    
    expect(logger.error).toHaveBeenCalledWith('Error during cleanup of unverified users:', mockError);
  });
}); 