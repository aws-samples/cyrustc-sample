import axios from "axios";
import axiosRetry from "axios-retry";
import { v4 as uuidv4 } from "uuid";
import { getTokens, refreshTokens } from "@/features/auth/lib/token-manager";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger({ module: 'API' });

// Create API instance with empty baseURL initially
export const api = axios.create({
  baseURL: '', // Will be set by initializeApi
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Function to initialize the API with the loaded config
export const initializeApi = (baseUrl: string): void => {
  // Only set baseURL with the provided value, don't access appConfig directly here
  api.defaults.baseURL = baseUrl;
  logger.info(`API configured with base URL: ${api.defaults.baseURL}`);
};

// Explicitly disable retries
axiosRetry(api, { retries: 0 });

// Add request ID and auth token to each request
api.interceptors.request.use((config) => {
  // Add request ID
  const requestId = uuidv4();
  config.headers["X-Request-Id"] = requestId;
  logger.debug(`Request ${config.method?.toUpperCase()} ${config.url}`, { requestId });

  // Add auth token if available
  const tokens = getTokens();
  if (tokens?.idToken) {
    config.headers["Authorization"] = `Bearer ${tokens.idToken}`;
  }

  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => {
    logger.debug(`Response ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      const { config, response } = error;
      const status = response?.status;
      
      logger.error(`Error ${status} ${config?.method?.toUpperCase()} ${config?.url}`, error.message);

      // Handle 401 Unauthorized errors
      if (status === 401 && !config?.url?.includes('/auth/refresh')) {
        try {
          // Attempt to refresh tokens
          logger.debug('Attempting token refresh due to 401 response');
          await refreshTokens();
          
          // Retry original request with new token
          const tokens = getTokens();
          if (tokens?.idToken && config) {
            config.headers["Authorization"] = `Bearer ${tokens.idToken}`;
            return api(config);
          }
        } catch (refreshError) {
          logger.error('Token refresh failed during 401 handling', refreshError);
          // Handle failed refresh (e.g., redirect to login)
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    
    return Promise.reject(error);
  }
);
