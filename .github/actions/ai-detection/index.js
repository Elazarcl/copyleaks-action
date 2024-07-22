const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const local = true;

async function initScanAsync(copyleaksToken, installationId, owner, repo, commitSha) {

  if (!installationId) {
    throw new Error('Installation ID must be provided.');
  }

  const scanRequestPayload = {
    InstallationId: installationId,
    Owner: owner,
    Repo: repo,
    CommitSha: commitSha,
    CopyleaksToken: copyleaksToken
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
    core.setOutput('an error occured when trying to iniate the scan', response.status)
  }
}

async function run() {
  const email = core.getInput('email');
  const copyleaksToken = core.getInput('copyleaks_token');
  const installationId = core.getInput('installation_id');
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);  
  await initScanAsync(copyleaksToken, installationId, owner, repo, commitSha)
};

run();