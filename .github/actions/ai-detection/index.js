
import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

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

  const response = await axios.post('http://localhost:5290/api/workflow/create-check-run', scanRequestPayload, {
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
    core.setOutput('an error occured when trying to iniate the scan', response)
  }
}

async function run() {
  const email = local ? 'elazarb@copyleaks.com' : core.getInput('email');
  const copyleaksToken = local ? 'D7797ECD1E570E881601FD0DF997E3DB1A6B7B6CAFB33B6EA61499BAE1C107B6' : core.getInput('api_key');
  const installationId = local ? '52790603' : core.getInput('installation_id');
  const owner = local ? 'Elazarcl' : github.context.repo.owner;
  const repo = local ? 'copyleaks-action' : github.context.repo.repo;
  const commitSha = local ? '3b25b74e380d7242d7979fa009017c3e5aa689a9' : github.context.sha;

  await initScanAsync(copyleaksToken, installationId, owner, repo, commitSha)
};

run();