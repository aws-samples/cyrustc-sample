// Configuration from the /config endpoint
export interface RemoteConfig {
  apiGateway: string
  cognito: {
    region: string
    userPoolId: string
    clientId: string
    domain: string
  }
}

// Runtime configuration
export interface RuntimeConfig {
  isDevelopment: boolean
  isProduction: boolean
  isTesting: boolean
  isLocal: boolean
} 