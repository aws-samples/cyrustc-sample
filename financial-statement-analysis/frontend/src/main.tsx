import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyMode, Mode } from '@cloudscape-design/global-styles'
import './index.css'
import App from './App.tsx'
import { fetchConfig, env } from '@/app/config/env'
import { createLogger } from '@/shared/lib/logger'
import { initializeApi } from '@/shared/api/instance'

const logger = createLogger({ module: 'Application' })

// Prepare the root element
const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)

// Show initial loading state
root.render(
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <div>Loading application configuration...</div>
  </div>
)

// Initialize the application
async function initializeApp() {
  try {
    // Fetch configuration from /config endpoint
    const config = await fetchConfig()
    
    // Initialize API with the loaded configuration
    initializeApi(config.apiGateway)
    
    // Log application startup information
    logger.info(`Application starting in ${env.isDevelopment ? 'development' : 'production'} mode`)

    // Apply the light theme by default
    applyMode(Mode.Light)

    // Render the application
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  } catch (error) {
    logger.error('Failed to initialize application', error)
    
    // Display a more detailed error message
    root.render(
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2>Application Configuration Error</h2>
        <p>
          Failed to load application configuration from the <code>/config</code> endpoint.
        </p>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '16px',
          textAlign: 'left',
          width: '100%',
          overflow: 'auto'
        }}>
          <strong>Error:</strong> {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <p style={{ marginTop: '20px' }}>
          Please check that the <code>/config</code> endpoint is properly configured and try again.
        </p>
        {env.isDevelopment && (
          <p style={{ fontSize: '0.9em', marginTop: '20px' }}>
            Note: For local development, set the <code>VITE_CONFIG_URL</code> environment variable in <code>.env.local</code>.
          </p>
        )}
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }
}

// Start the application
initializeApp()
