import cron from 'node-cron';
import { maintenanceBillingService } from '../services/maintenanceBillingService.js';

/**
 * Initialize all cron jobs
 */
export const initCronJobs = () => {
    console.log('--- Initializing Cron Jobs ---');

    // Run daily at midnight to generate temp bills
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Daily Temp Bill Generation Cron...');
        await maintenanceBillingService.generateTempBills();
    });

    // Run immediately in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log('Running Temp Bill Generation (Helper) for Development...');
        maintenanceBillingService.generateTempBills();
    }

    console.log('Cron Jobs Scheduled successfully.');
};
