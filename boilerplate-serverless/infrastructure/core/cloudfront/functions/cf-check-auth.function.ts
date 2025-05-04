export const checkAuthFunction = (cognitoDomain: string, clientId: string) => `
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    var cookies = request.cookies;

    // Skip auth check for cf-auth path
    if (request.uri === '/cf-auth') {
        return request;
    }

    // Check for auth cookie
    if (!cookies['CognitoAuth']) {
        // Redirect to Cognito login
        return {
            statusCode: 302,
            statusDescription: 'Found',
            headers: {
                location: {
                    value: 'https://${cognitoDomain}/login?client_id=${clientId}&response_type=code&redirect_uri=' + 
                           encodeURIComponent('https://' + event.request.headers.host.value + '/cf-auth')
                }
            }
        };
    }

    return request;
}
`;
