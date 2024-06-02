import { newError } from '../../utils';
import { Updater, Version } from '../updater';

export class GiteeUpdater implements Updater {
  getUpdateLog(tag: string): Promise<Version | null> {
    console.log(tag);
    
    throw new Error('Method not implemented.');
  }
  getNewVersion(branch: 'dev' | 'release'): Promise<Version | null> {
    console.log(branch);
    
    throw newError('Method not implemented.');
  }


}