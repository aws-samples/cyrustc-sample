# QuickSight Dashboard Embedding Example

This project demonstrates how to embed Amazon QuickSight dashboards in a web application using the QuickSight Embedding SDK and a Node.js Express server. The solution enables interactive dashboard embedding with parameter controls and event handling.

## Key Benefits

- **Interactive Dashboard Embedding**: Embed QuickSight dashboards in any web application
- **Parameter Controls**: Update dashboard parameters dynamically from your application
- **Event Handling**: Respond to user interactions with the embedded dashboard
- **Secure Authentication**: Generate secure embedding URLs with AWS SDK
- **Responsive Design**: Embedded dashboards adapt to container size

## Architecture Overview

The solution consists of two main components:

1. **Backend Server**: A Node.js Express server that:

   - Serves the web application
   - Generates secure embedding URLs using AWS SDK
   - Handles authentication and authorization

2. **Frontend Application**: A web page that:
   - Embeds the QuickSight dashboard using the Embedding SDK
   - Provides interactive controls for dashboard parameters
   - Handles dashboard events and user interactions

## Prerequisites

- AWS Account with QuickSight Enterprise subscription
- QuickSight dashboard created and published
- Node.js 14.x or later
- AWS CLI configured with appropriate permissions

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and configure your environment variables:

```bash
cp .env.example .env
# Edit .env with your actual values
```

## Workflow

This demo provides two approaches to embedding QuickSight dashboards:

### Approach 1: Pre-generated Embedding URL (Demo Only)

1. Generate an embedding URL using the provided script:

```bash
node generate.js
```

2. Copy the generated URL and replace the placeholder in `fe.ejs.html`:

```javascript
// Replace this line in fe.ejs.html
const dashboardUrl = "<%= embedUrl %>";

// With the actual URL (for demo purposes only)
const dashboardUrl = "https://your-generated-url-here";
```

3. Start the server:

```bash
node index.js
```

4. Open your browser and navigate to:

```
http://localhost:8080
```

### Approach 2: Dynamic URL Generation (Recommended)

The `index.js` file already implements this approach, which is recommended for production:

1. Configure your environment variables in `.env`
2. Start the server:

```bash
node index.js
```

3. Open your browser and navigate to:

```
http://localhost:8080
```

The server will:

- Generate a fresh embedding URL on each request
- Pass it to the frontend template
- Render the dashboard with the secure, short-lived URL

## Production Best Practices

For production environments, consider the following architecture:

1. **Separate API for Embedding URLs**:

   - Create a dedicated API endpoint for generating embedding URLs
   - Implement proper authentication and authorization
   - Return only the embedding URL, not the full AWS SDK response

2. **Frontend Implementation**:

   - Frontend application fetches the embedding URL from your API
   - Uses the QuickSight Embedding SDK to render the dashboard
   - Handles refresh when the URL expires

3. **Security Enhancements**:
   - Implement JWT or OAuth2 authentication for your API
   - Use HTTPS for all communications
   - Set appropriate CORS headers
   - Implement rate limiting for the embedding URL API

Example production workflow:

```
┌─────────────┐     1. Auth Request     ┌─────────────┐
│             │────────────────────────>│             │
│   Browser   │                         │  Your Auth  │
│             │<────────────────────────│   Service   │
└─────────────┘     2. Auth Token       └─────────────┘
       │
       │ 3. API Request with Auth Token
       ▼
┌─────────────┐     4. Generate URL     ┌─────────────┐
│             │────────────────────────>│             │
│  Your API   │                         │  AWS SDK    │
│             │<────────────────────────│             │
└─────────────┘     5. Embedding URL    └─────────────┘
       │
       │ 6. Return Embedding URL
       ▼
┌─────────────┐     7. Embed Request    ┌─────────────┐
│             │────────────────────────>│             │
│   Browser   │                         │ QuickSight  │
│             │<────────────────────────│   Service   │
└─────────────┘     8. Dashboard        └─────────────┘
```

## Additional Resources

- [QuickSight Embedding SDK Documentation](https://github.com/awslabs/amazon-quicksight-embedding-sdk)
- [AWS QuickSight Embedding Documentation](https://docs.aws.amazon.com/quicksight/latest/user/embedding-overview.html)
- [QuickSight API Reference](https://docs.aws.amazon.com/quicksight/latest/APIReference/Welcome.html)
