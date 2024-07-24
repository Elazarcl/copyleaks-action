const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function initScanAsync(copyleaksApiKey, copyleaksEmail, installationId, owner, repo, commitSha) {

  if (!installationId) {
    throw new Error('Installation ID must be provided.');
  }

  const scanRequestPayload = {
    InstallationId: installationId,
    Owner: owner,
    Repo: repo,
    CommitSha: commitSha,
    CopyleaksApiKey: copyleaksApiKey,
    CopyleaksEmail: copyleaksEmail
  };

  const response = await axios.post('https://cd5a42e31c40.ngrok.app/api/workflow/create-check-run', scanRequestPayload, {
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
  // const headCommitSha = github.context.payload.pull_request.head.sha;
  const mergeCommitSha = github.context.payload.pull_request.merge_commit_sha;
  console.log(mergeCommitSha);
  await initScanAsync(copyleaksApiKey, copyleaksEmail, installationId, owner, repo, mergeCommitSha);
};

run();