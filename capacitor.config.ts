import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dalilacabeza.expensetracker',
  appName: 'Expense Tracker',
  webDir: 'public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
