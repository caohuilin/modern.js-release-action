import path from 'path';
import execa from 'execa';
import { fs, getPackageManager } from '@modern-js/utils';
import { getPackages } from '@manypkg/get-packages';
import packageJson from 'package-json';

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

export const changeDependenceVersion = async (cwd: string = process.cwd()) => {
  const { packages } = await getPackages(cwd);
  const { version: testingPluginVersion } = await packageJson(
    '@modern-js/plugin-testing',
  );
  const { version: moduleToolsVersion } = await packageJson(
    '@modern-js/module-tools',
  );
  const { version: monorepoToolsVersion } = await packageJson(
    '@modern-js/monorepo-tools',
  );
  for (const pkg of packages) {
    const { dir } = pkg;
    const pkgJSON = await fs.readJSON(path.join(dir, 'package.json'));
    if (pkgJSON.devDependencies?.['@modern-js/plugin-testing']) {
      pkgJSON.devDependencies['@modern-js/plugin-testing'] = `^${
        testingPluginVersion as string
      }`;
    }
    if (pkgJSON.dependencies?.['@modern-js/plugin-testing']) {
      pkgJSON.dependencies['@modern-js/plugin-testing'] = `^${
        testingPluginVersion as string
      }`;
    }
    if (pkgJSON.devDependencies?.['@modern-js/module-tools']) {
      pkgJSON.devDependencies['@modern-js/module-tools'] = `^${
        moduleToolsVersion as string
      }`;
    }
    if (pkgJSON.dependencies?.['@modern-js/module-tools']) {
      pkgJSON.dependencies['@modern-js/module-tools'] = `^${
        moduleToolsVersion as string
      }`;
    }
    await fs.writeJSON(path.join(dir, 'package.json'), pkgJSON, 'utf-8');
  }
  const pkgJSON = await fs.readJSON(path.join(cwd, 'package.json'));
  if (pkgJSON.devDependencies['@modern-js/monorepo-tools']) {
    pkgJSON.devDependencies['@modern-js/monorepo-tools'] = `^${
      monorepoToolsVersion as string
    }`;
    await fs.writeJSON(path.join(cwd, 'package.json'), pkgJSON, 'utf-8');
  }
};
