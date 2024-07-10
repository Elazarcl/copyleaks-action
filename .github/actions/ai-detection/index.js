const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const local = true;

const sampleCode = `
from http.server import BaseHTTPRequestHandler, HTTPServer

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Hello, world!')

def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler):
    server_address = ('127.0.0.1', 8000)
    httpd = server_class(server_address, handler_class)
    print(f'Starting httpd server on {server_address[0]}:{server_address[1]}')
    httpd.serve_forever()

if __name__ == '__main__':
    run()
`;

function getBase64EncodedFileContent(content) {
  return Buffer.from(content).toString('base64');
}

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

async function scanForPlagiarismAsync(token, base64Content) {
  const owner = local ? 'Elazarcl' : github.context.repo.owner;
  const repo = local ? 'copyleaks-action' : github.context.repo.repo;
  const scanId = uuidv4();
  const apiUrl = `https://api.copyleaks.com/v3/scans/submit/file/${scanId}`;
  const webhookUrl = `https://api.github.com/repos/${owner}/${repo}/dispatches`;

  const data = {
    base64: base64Content,
    filename: 'sample_code.py',
    properties: {
      webhooks: {
        status: webhookUrl,
        newResult: webhookUrl,
        newResultHeader: [['Authorization', 'token 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']],
      }
    }
  };

  try {
    const response = await axios.put(apiUrl, data, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return true;
      }
    });

    if (response.status === 201) {
      core.notice('Plagiarism scan request was successful.');
      core.notice(`Webhook will be sent to ${webhookUrl}`);
    } else {
      core.warning(`Plagiarism scan request was not successful. Status code: ${response.status}`);
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

async function scanForAiDetectionAsync(token) {
  const scanId = 'scan_id';
  const apiUrl = `https://api.copyleaks.com/v2/writer-detector/source-code/${scanId}/check`;
  const data = {
    text: sampleCode,
    filename: 'testfile.py'
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

async function getChangedFiles() {
  const client = github.getOctokit(process.env.GITHUB_TOKEN);
  const { owner, repo, number } = github.context.issue;

  try {
    const { data: files } = await client.pulls.listFiles({
      owner: owner,
      repo: repo,
      pull_number: number
    });

    return files.map(file => ({
      filename: file.filename,
      contents_url: file.contents_url
    }));

  } catch (error) {
    console.error('Error fetching changed files:', error.message);
    throw error;
  }
}

async function run() {
  try {
    const email = local ? 'elazarb@copyleaks.com' : core.getInput('email');
    const apiKey = local ? '6f950dfa-9f97-48b0-9fae-8dc9dd2e484b' : core.getInput('api_key');

    core.notice('getting token ...');
    const token = await getTokenAsync(email, apiKey);

    core.notice('running scan ...');
    const base64FileContent = getBase64EncodedFileContent(sampleCode);
    await scanForPlagiarismAsync(token, base64FileContent);

    // const resData = await scanForPlagiarismAsync(token, base64FileContent);
    // core.notice(`res: ${resData}`);
    // if (resData.summary.ai === 1) {
    //   core.setFailed('AI detected in the code. Pipeline failed.');
    // }
  } catch (error) {
    console.error('Failed to complete the request:', error.message);
  }
};

run();