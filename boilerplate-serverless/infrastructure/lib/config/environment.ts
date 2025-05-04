import * as cdk from 'aws-cdk-lib';

export interface ApiGatewayConfig {  
  requireApiKey: boolean;
  stageName: string;
  logLevel: string;
}

export interface EnvironmentConfig {
  appName: string;
  appNameShort: string;
  apiGateway: ApiGatewayConfig;
  frontend: string;
}

export function getConfig(scope: cdk.Stack): EnvironmentConfig {
  const environment = scope.node.tryGetContext('environment') || 'local';
  const config = scope.node.tryGetContext(environment);
  config.appNameShort = config.appName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
  
  if (!config) {
    throw new Error(`No configuration found for environment: ${environment}`);
  }
  
  return config;
} 