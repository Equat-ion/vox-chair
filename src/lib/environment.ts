export type Environment = 'development' | 'staging' | 'production';

export const environment: Environment = 
  (process.env.NEXT_PUBLIC_ENVIRONMENT as Environment) || 'development';

export const baseUrl = 
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const isProduction = environment === 'production';
export const isStaging = environment === 'staging';
export const isDevelopment = environment === 'development';

// Log on startup
if (typeof window !== 'undefined') {
  console.log(`
    🎭 VOX CHAIR TEST ENVIRONMENT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Environment: ${environment}
    Base URL: ${baseUrl}
    ✅ Ready for testing
  `);
}