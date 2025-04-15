const AWS = require('aws-sdk');
const https = require('https');
require('dotenv').config();

// Load environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;
const QUICKSIGHT_USER_ARN = process.env.QUICKSIGHT_USER_ARN;
const QUICKSIGHT_DASHBOARD_ID = process.env.QUICKSIGHT_DASHBOARD_ID;
const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'http://localhost:8080').split(',');

// Validate required environment variables
if (!AWS_ACCOUNT_ID || !QUICKSIGHT_USER_ARN || !QUICKSIGHT_DASHBOARD_ID) {
  console.error('Error: Required environment variables are missing.');
  console.error('Please set AWS_ACCOUNT_ID, QUICKSIGHT_USER_ARN, and QUICKSIGHT_DASHBOARD_ID');
  process.exit(1);
}

// Initialize QuickSight client
var quicksightClient = new AWS.Service({
  apiConfig: require('./quicksight-2018-04-01.min.json'),
  region: AWS_REGION,
});

// Generate embedding URL
quicksightClient.generateEmbedUrlForRegisteredUser(
  {
    AwsAccountId: AWS_ACCOUNT_ID,
    ExperienceConfiguration: {
      Dashboard: {
        InitialDashboardId: QUICKSIGHT_DASHBOARD_ID,
      },
    },
    UserArn: QUICKSIGHT_USER_ARN,
    AllowedDomains: ALLOWED_DOMAINS,
    SessionLifetimeInMinutes: 100,
  },
  function (err, data) {
    if (err) {
      console.error('Error generating embedding URL:');
      console.error(err);
      process.exit(1);
    } else {
      console.log('Successfully generated embedding URL:');
      console.log(data);
      
      // Output the URL for easy copying
      if (data.EmbedUrl) {
        console.log('\nEmbedding URL:');
        console.log(data.EmbedUrl);
      }
    }
  },
);
