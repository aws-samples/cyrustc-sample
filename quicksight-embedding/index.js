const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

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

// Static Middleware
app.use(express.static(path.join(__dirname, 'public')));

// View Engine Setup
app.set('views', path.join(__dirname));
app.set('view engine', 'ejs');

// Initialize QuickSight client
const quicksightClient = new AWS.Service({
  apiConfig: require('./quicksight-2018-04-01.min.json'),
  region: AWS_REGION,
});

app.get('/', async function (req, res) {
  try {
    // Generate embedding URL
    const embedData = await generateEmbedUrl();
    res.render('fe', { embedUrl: embedData.EmbedUrl });
  } catch (error) {
    console.error('Error generating embedding URL:', error);
    res.status(500).send('Error generating QuickSight embedding URL');
  }
});

// Function to generate QuickSight embedding URL
function generateEmbedUrl() {
  return new Promise((resolve, reject) => {
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
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}

app.listen(port, function (error) {
  if (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
  console.log(`Server running on http://localhost:${port}`);
});
