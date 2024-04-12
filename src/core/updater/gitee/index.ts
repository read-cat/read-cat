import { Updater, Version } from '../updater';

export class GiteeUpdater implements Updater {
  getNewVersion(versionCode: number, branch: 'dev' | 'release'): Promise<Version | null> {
    console.log(versionCode, branch);
    
    throw new Error('Method not implemented.');
  }


}