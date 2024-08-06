const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function initScanAsync(copyleaksApiKey, copyleaksEmail, installationId, owner, repo, headCommitSha, pullRequestNumber) {

  if (!installationId) {
    throw new Error('Installation ID must be provided.');
  }

  const scanRequestPayload = {
    InstallationId: installationId,
    Owner: owner,
    Repo: repo,
    HeadCommitSha: headCommitSha,
    PullRequestNumber: pullRequestNumber,
    CopyleaksApiKey: copyleaksApiKey,
    CopyleaksEmail: copyleaksEmail
  };

  const response = await axios.post('https://3d439d1cd1d1.ngrok.app/api/workflow/github/submit', scanRequestPayload, {
    headers: {
      'Content-Type': 'application/json'
    },
    validateStatus: function (status) {
      return true;
    }
  });

  if (response.status == 201) {
    core.setOutput('scan initated successfully');
  } else {
    core.setOutput('an error occured when trying to initiate the scan', response.status)
  }
}

async function run() {
  const eventName = github.context.eventName; 
  if (eventName !== 'pull_request') {
    throw new Error(`Expected a pull_request event, but got ${eventName}`);
  }

  const copyleaksEmail = core.getInput('copyleaks_email');
  const copyleaksApiKey = core.getInput('copyleaks_api_key');
  const installationId = core.getInput('installation_id');
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  const headCommitSha = github.context.payload.pull_request.head.sha;
  const pullRequestNumber = github.context.payload.pull_request.number;
  await initScanAsync(copyleaksApiKey, copyleaksEmail, installationId, owner, repo, headCommitSha, pullRequestNumber);
};

run();