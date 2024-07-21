
import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

const local = true;

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA6bNiUap+nRxKs6ocwEO+JSlfRcuc+AtovxPq0Du4/nvDwX1A
414sEPuGwK7ae1uqfgb+s8u+3INx2G2zaBXiX03e2XvOHy8xooW9yrsunsfbvZom
GhUFFrEKtbEseiqdaHJrpZlSBeKtvH0QRTgriTPSLbJpt88xwZdbdcopaBfAFsru
YgB1CwWH0ipdGvzDyw3ywZOmId9YIAZT2pBsuDFu8Lkn1FcYjQoea2WI14L21J7T
wczNHLuPJRHKZ/U7sMN9O6zebeDWVa8wm7vXwTD/+qNXtstRCVL2MpsuKu3NJna6
azApL8Yt0t6vdM5Np5JM35wnWdcNxIjVaOXTxwIDAQABAoIBACddRt9Yp5ERNegD
bGpaPsoFqP2ZqWwCh/c/hJrkpGmBMV0DGw3xS9zkcTM9gKGstBAcX4Sreg+suF1r
RP/wR7wj4rihaPvJuEOW4XwngVfPdE0AjRBxn/TNh29JU6OUUAVK2KUBKVbCct8/
9aCjMHog13NJDROf+9KPCyHRFp5opz+299hpTBDAv2EBn2MXnvfeAJldOKAFT775
meIowkPwfzuHk3MZR8XwTtsGHR9NxFvENnUu4i/GF0nKC6GWXJoOktaZ/m4tW2TN
swNXy4xcdDHLGtdAXn6FVB2gGmQ7hfuo4YIl3eWFJ/6DqQvXDGaw1e+jEMxnHHCz
hbvh0qECgYEA/89FMwNkFfAnsZs3dTlezobgBSaqFlDk3YmndYExahj4GYh+/TRy
rki+dlglw+baU7QtZKgiWXRimcSAQEHaGwIvBbR+N4qTo/S5+o6gN1cHCIiWW+Rw
FFdVtDhDDCuD2Jz3ARi8q1qRfYgVZ3wMhA/S7hwQOYQyH1zr15VVDhECgYEA6d/m
9Otrlz99GyptCoLoJKIaBRavKxgmzSORzFXsjiSfCw7JLs5xHWiKWGKJxE3jG7pq
MX9BadUxBeRCeTSB51J2k6dxseZAbcQSaYh8YUNpnJRRwIPr1fbA1On9aUEdVCum
bMrwuB/ylXH2iTfbLOx666KdtMB5MpbUee7BTFcCgYEAsAPIU4+TwFyck2J/yFMP
XwADCMhP5EcJEz5yUTHx9FT18WuwJT1/Y1h+ZSPF6IPh2hJx4X6nE/I3HiLNNGmb
T1YzULOe3UymxfvQNA0LRMjG+CIzg0stq3FkcTr9N1SBxfxLISAKQcVxsnR+ddQv
MHdK5be9mjXR3y6qwI3qFmECgYEAtFMJ/b/jFhxCtwZwStGCcnR2QYQrDbwydqs9
SGLb4QFFi74byrYsKzOmr91SQgSX3pJOPNnUsuhJQzSrOE8O9i/z84cAt91Dwh6S
38H3vPrAXJVTr29IEJKQPdoopNYq6fI6ANo83orrfOUA5O4nVS0E3dhlZq+dAy+e
pmE7s0MCgYEAo/XnjdV7iGAzzKGiO8L0K9HvYjC9f5uWL6uq8KcJ4UsV2rHnE+Sp
VXzRN4EgEkT1J8MLCv1tdQwLjURFq13z3vuTNOf2WbCND3YsGotFbIatJgT67AGs
dYFCzV1ffsBs3ro3QTSuplu5z8HuZE1UK7gWYK6jP5nPZJS5NUHhZKY=
-----END RSA PRIVATE KEY-----
`

async function runCheckAsync() {
  const appId = local ? '944685' : process.env.GITHUB_APP_ID;
  const installationId = local ? '52790603' : process.env.GITHUB_INSTALLATION_ID;
  const detailsUrl = "https://copyleaks.com";

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId
  });

  const installationAccessToken = await auth({ type: "installation" });

  const octokit = new Octokit({
    auth: installationAccessToken.token
  });

  const owner = local ? 'Elazarcl' : github.context.repo.owner;
  const repo = local ? 'copyleaks-action' : github.context.repo.repo;
  const sha = local ? '3b25b74e380d7242d7979fa009017c3e5aa689a9' : github.context.sha;

  let checkRun;
  try {
    checkRun = await octokit.checks.create({
      owner,
      repo,
      name: "Copyleaks scan",
      head_sha: sha,
      status: "in_progress",
      started_at: new Date().toISOString(),
      details_url: detailsUrl
    });

    core.notice(`Check run created: ${checkRun.data.html_url}`);
  } catch (error) {
    core.setFailed(`Failed to create check run: ${error.message}`);
    return;
  }

  const checkRunId = checkRun.data.id;

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status: "in_progress",
      output: {
        title: "Copyleaks Scan",
        summary: "The check is currently in progress...",
        text: "This is an update indicating that the check is still running."
      },
      details_url: detailsUrl
    });

    core.notice("Check run updated to in_progress");
  } catch (error) {
    core.setFailed(`Failed to update check run: ${error.message}`);
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status: "completed",
      conclusion: "failure",
      completed_at: new Date().toISOString(),
      output: {
        title: "Custom Check",
        summary: "The check has completed successfully.",
        text: "Detailed information about the check results."
      },
      details_url: detailsUrl
    });

    core.notice("Check run marked as completed");
  } catch (error) {
    core.setFailed(`Failed to mark check run as completed: ${error.message}`);
  }
}

async function run() {
  try {
    const email = local ? 'elazarb@copyleaks.com' : core.getInput('email');
    const apiKey = local ? '6f950dfa-9f97-48b0-9fae-8dc9dd2e484b' : core.getInput('api_key');
    const ghToken = core.getInput('gh_token');

    core.notice('running scan ...');
    await runCheckAsync();

  } catch (error) {
    console.error('Failed to complete the request:', error.message);
  }
};

run();