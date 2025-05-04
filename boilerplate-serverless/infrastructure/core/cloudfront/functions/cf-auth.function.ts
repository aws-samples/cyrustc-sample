export const cfAuthFunction = (
  userPoolId: string,
  clientId: string,
  clientSecret: string,
  cognitoDomain: string
) => `
const https = require('https');
const querystring = require('querystring');

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const queryParams = querystring.parse(request.querystring);

    console.log('Request headers:', JSON.stringify(request.headers));
    console.log('Query parameters:', JSON.stringify(queryParams));

    if (!queryParams.code) {
        return {
            status: '400',
            statusDescription: 'Bad Request',
            body: 'Authorization code missing',
        };
    }

    try {
        // Exchange code for tokens
        const tokenEndpoint = 'https://${cognitoDomain}/oauth2/token';
        const redirectUri = 'https://' + request.headers.host[0].value + '/cf-auth';
        
        console.log('Token endpoint:', tokenEndpoint);
        console.log('Redirect URI:', redirectUri);

        const tokenResponse = await new Promise((resolve, reject) => {
            const postData = querystring.stringify({
                grant_type: 'authorization_code',
                client_id: '${clientId}',
                code: queryParams.code,
                redirect_uri: redirectUri
            });

            console.log('Request body:', postData);

            const req = https.request(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length,
                    'Authorization': 'Basic ' + Buffer.from('${clientId}:${clientSecret}').toString('base64')
                }
            }, (res) => {
                console.log('Response status:', res.statusCode);
                console.log('Response headers:', JSON.stringify(res.headers));

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log('Response body:', data);
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        console.error('Failed to parse response:', e);
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => {
                console.error('Request error:', e);
                reject(e);
            });

            req.write(postData);
            req.end();
        });

        console.log('Token response:', JSON.stringify(tokenResponse));

        if (!tokenResponse.id_token) {
            console.error('No id_token in response:', JSON.stringify(tokenResponse));
            throw new Error('Failed to get tokens');
        }

        // Set cookies and redirect to home
        return {
            status: '302',
            statusDescription: 'Found',
            headers: {
                'location': [{
                    key: 'Location',
                    value: '/'
                }],
                'set-cookie': [{
                    key: 'Set-Cookie',
                    value: \`CognitoAuth=\${tokenResponse.id_token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600\`
                }]
            }
        };
    } catch (error) {
        console.error('Auth error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        return {
            status: '500',
            statusDescription: 'Internal Server Error',
            body: 'Authentication failed: ' + error.message
        };
    }
};
`;
