import { GiteeUpdater } from './gitee';
import { GithubUpdater } from './github';
import { UpdateSource, Updater } from './updater';

export const createUpdater = (src: UpdateSource): Updater => {
  switch (src) {
    case 'Gitee':
      return new GiteeUpdater();
    case 'Github':
    default:
      return new GithubUpdater();
  }
}