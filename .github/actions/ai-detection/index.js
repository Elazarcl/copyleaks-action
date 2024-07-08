const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const axios = require('axios');

async function getTokenAsync(email, apiKey) {
  const loginUrl = 'https://id.copyleaks.com/v3/account/login/api';
  const credentials = {
    email: email,
    key: apiKey
  };

  try {
    const response = await axios.post(loginUrl, credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

async function scanForAiDetectionAsync(token) {
  const scanId = 'scan_id';
  const apiUrl = `https://api.copyleaks.com/v2/writer-detector/${scanId}/check`;
  const data = {
    text: 'Lions, often referred to as the "King of the Jungle," are among the most iconic and revered creatures in the animal kingdom. Known for their impressive strength, majestic appearance, and complex social structures, these magnificent big cats have fascinated humans for centuries. This essay delves into the biology, behavior, and cultural significance of lions, exploring why they continue to captivate our imaginations..'
  };

  try {
    const response = await axios.post(apiUrl, data, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

async function run() {
  try {
    const email = core.getInput('email');
    const apiKey = core.getInput('api_key');
    core.notice('getting token ...');
    const token = await getTokenAsync(email, apiKey);
    core.notice('running scan ...');
    const resData = await scanForAiDetectionAsync(token);
    core.notice(`res: ${resData}`);
    if (resData.summary.ai === 1) {
      core.setFailed('AI detected in the code. Pipeline failed.');
    }
  } catch (error) {
    console.error('Failed to complete the request:', error.message);
  }
};

run();