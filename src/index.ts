import * as core from '@actions/core';
import fs from 'fs-extra';
import { gitConfigUser, gitCommitAll, gitPushTags } from './git';
import {
  bumpCanaryVersion,
  changeDependenceVersion,
  runInstall,
  runPrepare,
  runRelease,
  writeNpmrc,
} from './utils';

// eslint-disable-next-line max-statements
(async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  const publishVersion = core.getInput('version');
  console.info('publishVersion', publishVersion);

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN');
    return;
  }

  await gitConfigUser();

  await fs.writeFile(
    `${process.env.HOME as string}/.netrc`,
    `machine github.com\nlogin github-actions[bot]\npassword ${githubToken}`,
  );

  // hack modern.js repo need to change plugin-testing and module-tools version
  const repo = process.env.REPOSITORY;

  if (repo === 'modern-js-dev/modern.js' && publishVersion !== 'canary') {
    await changeDependenceVersion();
  }

  // prepare repo
  await runInstall();
  await runPrepare();

  await writeNpmrc();
  // publish
  if (publishVersion === 'canary') {
    await bumpCanaryVersion(publishVersion);
    await gitCommitAll('publish canary');
    // await runRelease(process.cwd(), 'canary');
  } else if (publishVersion === 'pre') {
    await gitCommitAll('publish pre');
    await runRelease(process.cwd(), 'next');
    // push tags
    await gitPushTags();
  } else {
    await gitCommitAll('publish latest');
    await runRelease();
    // push tags
    await gitPushTags();
  }
})().catch(err => {
  console.error(err);
  core.setFailed(err.message);
});
