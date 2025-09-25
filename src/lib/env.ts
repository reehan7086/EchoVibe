// Create src/lib/env.ts for environment validation
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_REDIRECT_URL?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export const validateEnv = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ] as const;

  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    const error = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error('❌ Environment Validation Failed:', error);
    
    // In development, show helpful message
    if (import.meta.env.DEV) {
      console.log('📝 Please check your .env file contains:');
      missingVars.forEach(varName => {
        console.log(`   ${varName}=your_value_here`);
      });
    }
    
    throw new Error(error);
  }

  console.log('✅ Environment variables validated successfully');
  return true;
};

export const getEnvVar = (key: keyof ImportMetaEnv, fallback?: string): string => {
  const value = import.meta.env[key];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return (value || fallback) as string;
};