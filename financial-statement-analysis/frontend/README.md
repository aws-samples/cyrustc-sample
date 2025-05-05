# Serverless Boilerplate Frontend

A modern React frontend for the serverless boilerplate application.

## Configuration

This application uses a dynamic configuration system that loads configuration at runtime from the `/config` endpoint.

### Configuration Endpoint

When deployed, the application will fetch its configuration from `{domain}/config`, which should return a JSON object with the following structure:

```json
{
  "apiGateway": "https://api.example.com/",
  "cognito": {
    "region": "us-west-2",
    "userPoolId": "us-west-2_example",
    "clientId": "example-client-id",
    "domain": "auth.example.com"
  }
}
```

All fields are required and the application will throw an error if any field is missing.

### CDN Configuration

In production, the `/config` endpoint is served by the CDN (CloudFront). This configuration approach allows for:

1. Dynamic configuration without rebuilding the application
2. Environment-specific settings
3. Simplified deployment process

The CloudFront distribution should be configured to serve a static JSON file at the `/config` path.

### Local Development

For local development, you need to create a `.env.local` file in the project root with:

```
VITE_CONFIG_URL=https://your-domain.com/config
```

This file should be added to `.gitignore` to keep your personal config URL private. For team reference, a `.env.local.example` file is provided.

## Development

To start the development server:

```bash
npm run dev
```

## Building for Production

To build the application for production:

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Environment Variables

During development, the application recognizes:

- `VITE_CONFIG_URL`: Override URL for the configuration endpoint

In production, no environment variables are used as all configuration is loaded at runtime from the `/config` endpoint.

## Available Scripts

In the project directory, you can run:

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run preview` - Locally preview the production build
- `npm run lint` - Lints the codebase

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
