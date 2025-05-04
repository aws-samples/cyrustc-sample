import type { RemoteConfig } from './types'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger({ module: 'Config' })

// Empty configuration to be filled by fetchConfig
let config: RemoteConfig = {
  apiGateway: '',
  cognito: {
    region: '',
    userPoolId: '',
    clientId: '',
    domain: ''
  }
}

// Function to get the config URL with potential override from environment variable
function getConfigUrl(): string {
  // In development mode, check for environment variable
  if (import.meta.env.MODE === 'development' && import.meta.env.VITE_CONFIG_URL) {
    logger.info(`Using config URL from environment variable: ${import.meta.env.VITE_CONFIG_URL}`)
    return import.meta.env.VITE_CONFIG_URL as string
  }
  
  // Default to current origin with /config path
  return `${window.location.origin}/config`
}

// Function to fetch configuration from /config endpoint
export async function fetchConfig(): Promise<RemoteConfig> {
  const configUrl = getConfigUrl()
  logger.info(`Fetching configuration from ${configUrl}`)
  
  try {
    const response = await fetch(configUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`)
    }
    
    const configData = await response.json()
    
    // Validate required fields
    validateConfig(configData)
    
    logger.info('Successfully loaded configuration')

    // Update the global config
    config = configData
    return configData
  } catch (error) {
    logger.error('Failed to fetch configuration:', error)
    throw error
  }
}

// Validate that all required fields are present
function validateConfig(config: any): asserts config is RemoteConfig {
  if (!config) {
    throw new Error('Configuration is empty')
  }
  
  if (!config.apiGateway) {
    throw new Error('Missing required config: apiGateway')
  }
  
  if (!config.cognito) {
    throw new Error('Missing required config: cognito')
  }
  
  const { cognito } = config
  
  if (!cognito.region) {
    throw new Error('Missing required config: cognito.region')
  }
  
  if (!cognito.userPoolId) {
    throw new Error('Missing required config: cognito.userPoolId')
  }
  
  if (!cognito.clientId) {
    throw new Error('Missing required config: cognito.clientId')
  }
  
  if (!cognito.domain) {
    throw new Error('Missing required config: cognito.domain')
  }
}

// Create a proxy to access the configuration
export const appConfig: RemoteConfig = new Proxy(config, {
  get(target, prop) {
    const value = target[prop as keyof RemoteConfig]
    
    // Throw error if accessing config before it's loaded
    if (value === undefined || (typeof value === 'string' && value === '')) {
      throw new Error(`Accessing uninitialized config property: ${String(prop)}. Make sure fetchConfig() has completed.`)
    }
    
    return value
  }
})

// For runtime environment detection
export const env = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  isTesting: import.meta.env.MODE === 'test',
  isLocal: window.location.hostname === 'localhost',
  MODE: import.meta.env.MODE,
  AUTH: {
    COGNITO_DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN || config.cognito.domain,
    COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || config.cognito.clientId,
    REDIRECT_SIGN_IN: import.meta.env.VITE_REDIRECT_SIGN_IN || `${window.location.origin}/auth/callback`,
    REDIRECT_SIGN_OUT: import.meta.env.VITE_REDIRECT_SIGN_OUT || window.location.origin
  }
} 