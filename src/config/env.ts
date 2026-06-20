/**
 * Centralized environment configuration with feature flags and validation
 * - Enforces type safety on environment variables
 * - Controls feature availability based on app mode
 * - Defaults to safe/sensible values
 */

export type AppMode = 'development' | 'beta' | 'production';

/**
 * Determines the application mode from VITE_APP_MODE environment variable.
 * Defaults to 'development' when building locally, 'production' for prod builds.
 */

/** Human-readable application version shown in the interface. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.6.2';

export const APP_MODE: AppMode = (
  import.meta.env.VITE_APP_MODE as AppMode
) || (import.meta.env.PROD ? 'production' : 'development');

/**
 * Supabase configuration - required for backend connectivity
 */
export const SUPABASE = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  /** Whether Supabase is properly configured (has both URL and key) */
  isConfigured: Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ),
};

/**
 * Feature flags that control behavior based on APP_MODE
 */
export const FEATURES = {
  /** In development: allow demo mode, local-only data, debug features */
  development: {
    allowDemoMode: true,
    allowMockData: true,
    enableDebugLogging: true,
    enableDataReset: true,
    enableDevTools: true,
  },

  /** In beta: require real authentication, use Supabase, allow test data */
  beta: {
    allowDemoMode: false,
    allowMockData: false, // Only pre-created test accounts work
    enableDebugLogging: false,
    enableDataReset: false, // No "Restaurar exemplos" button
    enableDevTools: false,
  },

  /** In production: strict authentication, real data only, no testing features */
  production: {
    allowDemoMode: false,
    allowMockData: false,
    enableDebugLogging: false,
    enableDataReset: false,
    enableDevTools: false,
  },
};

/**
 * Get the current feature set based on APP_MODE
 */
export const CURRENT_FEATURES = FEATURES[APP_MODE];

/**
 * Helper functions to check feature availability
 */
export const can = {
  useDemoMode: () => CURRENT_FEATURES.allowDemoMode,
  useMockData: () => CURRENT_FEATURES.allowMockData,
  debugLog: () => CURRENT_FEATURES.enableDebugLogging,
  resetData: () => CURRENT_FEATURES.enableDataReset,
  useDevTools: () => CURRENT_FEATURES.enableDevTools,
};

/**
 * Validation: Warn if Supabase is not configured in beta/production
 */
if ((APP_MODE === 'beta' || APP_MODE === 'production') && !SUPABASE.isConfigured) {
  console.error(
    `❌ ERROR: Supabase not configured in ${APP_MODE} mode. ` +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

/**
 * Log the current configuration (only in development/beta debug mode)
 */
if (CURRENT_FEATURES.enableDebugLogging) {
  console.log(
    `🚀 LinguaBoard starting in ${APP_MODE} mode\n` +
    `├─ Demo Mode: ${CURRENT_FEATURES.allowDemoMode ? '✅ enabled' : '❌ disabled'}\n` +
    `├─ Mock Data: ${CURRENT_FEATURES.allowMockData ? '✅ enabled' : '❌ disabled'}\n` +
    `├─ Debug Logging: ${CURRENT_FEATURES.enableDebugLogging ? '✅ enabled' : '❌ disabled'}\n` +
    `├─ Data Reset: ${CURRENT_FEATURES.enableDataReset ? '✅ enabled' : '❌ disabled'}\n` +
    `└─ Supabase: ${SUPABASE.isConfigured ? '✅ configured' : '⚠️  not configured'}`
  );
}
