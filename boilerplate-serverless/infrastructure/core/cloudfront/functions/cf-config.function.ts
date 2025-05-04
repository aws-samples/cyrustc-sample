export const cfConfigFunction = (
  apiEndpoint: string,
  userPoolId: string,
  clientId: string,
  cognitoDomain: string,
  cognitoRegion: string
) => `
function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var origin = headers.origin ? headers.origin.value : '';
  var isLocalhost = origin.includes('localhost');
  
  // Check if the request is for the config endpoint
  if (request.uri === '/config') {
    return {
      statusCode: 200,
      statusDescription: 'OK',
      headers: {
        'content-type': { value: 'application/json' },
        'cache-control': { value: 'no-cache' },
        'access-control-allow-origin': { value: isLocalhost ? origin : request.headers.host.value },
        'access-control-allow-methods': { value: 'GET, OPTIONS' },
        'access-control-allow-headers': { value: 'Content-Type' },
        'access-control-max-age': { value: '86400' }
      },
      body: JSON.stringify({
        apiGateway: '${apiEndpoint}',
        cognito: {
          region: '${cognitoRegion}',
          userPoolId: '${userPoolId}',
          clientId: '${clientId}',
          domain: '${cognitoDomain}'
        }
      })
    };
  }
  
  // Not a config request, continue normally
  return request;
}
`; 