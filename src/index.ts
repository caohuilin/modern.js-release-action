import * as core from '@actions/core';
import fs from 'fs-extra';
import { gitConfigUser, gitCommitAll, gitPushTags } from './git';
import { bumpCanaryVersion, runInstall, runPrepare, runRelease } from './utils';

(async () => {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN');
    return;
  }

  await gitConfigUser();

  await fs.writeFile(
    `${process.env.HOME as string}/.netrc`,
    `machine github.com\nlogin github-actions[bot]\npassword ${githubToken}`,
  );

  // prepare repo
  await runInstall();
  await runPrepare();

  const publishVersion = core.getInput('version');

  // publish
  if (publishVersion === 'canary') {
    await bumpCanaryVersion(publishVersion);
    await gitCommitAll('publish canary');
    await runRelease(process.cwd(), 'canary');
  } else if (publishVersion === 'pre') {
    await runRelease(process.cwd(), 'next');
  } else {
    await runRelease();
  }

  // push tags
  await gitPushTags();
})().catch(err => {
  console.error(err);
  core.setFailed(err.message);
});
