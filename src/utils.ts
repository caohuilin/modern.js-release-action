import execa from 'execa';
import { fs, getPackageManager } from '@modern-js/utils';

export function execaWithStreamLog(
  command: string,
  args: string[],
  options?: Record<string, any>,
) {
  const promise = execa(command, args, {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    ...options,
  });
  return promise;
}

export const runInstall = async (cwd: string = process.cwd()) => {
  const packageManager = getPackageManager(cwd);
  await execaWithStreamLog('npm', ['install', '-g', packageManager], { cwd });
  await execaWithStreamLog(packageManager, ['install', '--ignore-scripts'], {
    cwd,
  });
};

export const runPrepare = async (cwd: string = process.cwd()) => {
  const packageManager = getPackageManager(cwd);
  if (packageManager === 'pnpm') {
    await execaWithStreamLog(
      'pnpm',
      ['run', 'prepare', '--filter', './packages'],
      { cwd },
    );
  } else {
    await execaWithStreamLog('npm', ['install', '-g', 'lerna'], { cwd });
    await execaWithStreamLog('lerna', ['run', 'prepare'], { cwd });
  }
};

export const bumpCanaryVersion = async (cwd: string = process.cwd()) => {
  const packageManager = getPackageManager(cwd);
  if (packageManager === 'pnpm') {
    await execaWithStreamLog(packageManager, [
      'run',
      'bump',
      '--',
      '--snapshot',
      'canary',
    ]);
  } else {
    await execaWithStreamLog(packageManager, [
      'run',
      'bump',
      '--snapshot',
      'canary',
    ]);
  }
};

export const runRelease = async (cwd: string = process.cwd(), tag?: string) => {
  const packageManager = getPackageManager(cwd);
  const params: string[] = ['run', 'release'];
  if (tag) {
    if (packageManager === 'pnpm') {
      params.push('--');
    }
    params.push('--tag', tag);
  }
  await execaWithStreamLog(packageManager, params, {
    cwd,
  });
};

export const writeNpmrc = async () => {
  await fs.writeFile(
    '.npmrc',
    `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN as string}
registry=https://registry.npmjs.org/
always-auth=true`,
    'utf-8',
  );
};
