const { BedrockRuntimeClient, ConverseStreamCommand } = require("@aws-sdk/client-bedrock-runtime");
const { HttpsProxyAgent } = require('https-proxy-agent');

async function converseWithBedrock() {
    const client = new BedrockRuntimeClient({
        region: "us-east-1",
        // If using the proxy, uncomment and configure these lines
        // httpAgent: new HttpsProxyAgent('http://your-nlb-dns:3128'),
        // httpsAgent: new HttpsProxyAgent('http://your-nlb-dns:3128')
    });

    const conversation = [
        {
            role: "user",
            content: [{ text: "tell me a joke" }],
        }
    ];

    const command = new ConverseStreamCommand({
        modelId: "amazon.nova-pro-v1:0",
        messages: conversation,
        inferenceConfig: { 
            maxTokens: 512, 
            temperature: 0.7, 
            topP: 0.9 
        }
    });

    try {
        const response = await client.send(command);

        // Extract and print the streamed response text in real-time
        for await (const item of response.stream) {
            if (item.contentBlockDelta) {
                process.stdout.write(item.contentBlockDelta.delta?.text);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the function
converseWithBedrock();
