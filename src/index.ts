import path from 'path';
import os from 'os';
import * as core from '@actions/core';
import fs from 'fs-extra';

(async () => {
  const cwd = process.cwd();
  let appDirectory = cwd;
  while (os.homedir() !== appDirectory) {
    console.info('homeDir', os.homedir());
    console.info('appDirectory', appDirectory);
    if (fs.existsSync(path.resolve(appDirectory, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'package-lock.json'))) {
      return 'npm';
    }
    appDirectory = path.join(appDirectory, '..');
  }
  return 'npm';
})().catch(err => {
  console.error(err);
  core.setFailed(err.message);
});
