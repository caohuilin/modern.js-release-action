import { execaWithStreamLog } from './utils';

export const gitConfigUser = async () => {
  await execaWithStreamLog('git', [
    'config',
    '--global',
    'user.name',
    `"github-actions[bot]"`,
  ]);
  await execaWithStreamLog('git', [
    'config',
    '--global',
    'user.email',
    `"github-actions[bot]@users.noreply.github.com"`,
  ]);
};

export const gitPushTags = async () => {
  await execaWithStreamLog('git', ['push', 'origin', '--tags']);
};

export const gitCommitAll = async (message: string) => {
  await execaWithStreamLog('git', ['add', '.']);
  await execaWithStreamLog('git', ['commit', '-m', message]);
};
