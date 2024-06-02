import { Updater, Version } from '../updater';
import { get } from '../../request';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../../../store/settings';
import { Release } from './github';
import { parse } from 'marked';
import { newError } from '../../utils';
import os from 'os';
import { isUndefined } from '../../is';

const lowElectronVersion = Number(process.versions.electron.split('.')[0]) <= 22;

export class GithubUpdater implements Updater {
  async getUpdateLog(tag: string): Promise<Version | null> {
    const settings = useSettingsStore();
    const { options } = settings;
    const { proxy } = storeToRefs(settings);
    const { body } = await get('https://api.github.com/repos/read-cat/read-cat/releases', {
      proxy: options.enableProxy ? proxy.value : void 0,
      responseType: 'json'
    }).catch(e => {
      if (e.responseBody) {
        const { message } = e.responseBody;
        return Promise.reject(newError(message));
      }
      return Promise.reject(e);
    });
    const release = (<Release[]>body).find(r => r.tag_name === tag);
    return !release ? null : {
      body: await parse(release.body),
      htmlUrl: release.html_url,
      newVersion: release.tag_name.slice(1)
    };
  }
  async getNewVersion(branch: 'dev' | 'release'): Promise<Version | null> {
    const settings = useSettingsStore();
    const { options } = settings;
    const { proxy } = storeToRefs(settings);
    let release: Release | null;
    const url = `https://api.github.com/repos/read-cat/read-cat/releases${branch === 'release' ? '/latest' : ''}`;
    const { body } = await get(url, {
      proxy: options.enableProxy ? proxy.value : void 0,
      responseType: 'json'
    }).catch(e => {
      if (e.responseBody) {
        const { message } = e.responseBody;
        return Promise.reject(newError(message));
      }
      return Promise.reject(e);
    });
    if (branch === 'dev') {
      const arr = (<Release[]>body).filter(r => r.prerelease && !r.draft).sort((a, b) => b.id - a.id);
      release = arr && arr.length > 0 ? arr[0] : null;
    } else {
      release = body;
    }
    let downloadUrl: string | undefined,
        hashDownloadUrl: string | undefined;
    if (process.platform === 'win32') {
      const asset = release?.assets.find(a => (
        a.name.endsWith('.exe') &&
        a.name.includes(`${process.platform}-${os.arch()}`) &&
        (lowElectronVersion ? a.name.includes('windows7') : true)
      ));
      downloadUrl = asset?.browser_download_url;
      downloadUrl = downloadUrl?.endsWith('/') ? downloadUrl.slice(0, -1) : downloadUrl;
      const i = release?.assets.findIndex(a => a.browser_download_url === `${downloadUrl}.sha256.txt`);
      if (!isUndefined(i) && i > -1) {
        hashDownloadUrl = `${downloadUrl}.sha256.txt`;
      }
    }
    return !release ? null : {
      body: await parse(release.body),
      htmlUrl: release.html_url,
      newVersion: release.tag_name.slice(1),
      downloadUrl,
      hashDownloadUrl
    };
  }

}