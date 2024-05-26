import { newError } from '../../utils';
import { Updater, Version } from '../updater';

export class GiteeUpdater implements Updater {
  getUpdateLog(version: string): Promise<Version | null> {
    console.log(version);
    
    throw new Error('Method not implemented.');
  }
  getNewVersion(branch: 'dev' | 'release'): Promise<Version | null> {
    console.log(branch);
    
    throw newError('Method not implemented.');
  }


}