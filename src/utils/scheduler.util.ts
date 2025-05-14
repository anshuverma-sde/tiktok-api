import cron from 'node-cron';
import { AuthService } from '../services/auth.service';
import logger from './logger.util';

export const initScheduledTasks = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running scheduled cleanup of unverified users');
      await AuthService.cleanupUnverifiedUsers();
      logger.info('Completed cleanup of unverified users');
    } catch (error) {
      logger.error('Error during cleanup of unverified users:', error);
    }
  });

}; 