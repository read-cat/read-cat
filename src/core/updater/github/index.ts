import { Updater, Version } from '../updater';
import { get } from '../../request';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../../../store/settings';
import { isString, isUndefined } from '../../is';
import { Release } from './github';


export class GithubUpdater implements Updater {
  async getNewVersion(versionCode: number, branch: 'dev' | 'release'): Promise<Version | null> {
    const settings = useSettingsStore();
    const { options } = settings;
    const { proxy } = storeToRefs(settings);
    let release: Release;
    const url = `https://api.github.com/repos/read-cat/read-cat.github.io/releases${branch === 'release' ? '/latest' : ''}`;
    let { body } = await get(url, {
      proxy: options.enableProxy ? proxy?.value : void 0,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0'
      }
    });
    body = isString(body) ? body : body.toString('utf-8');
    if (branch === 'dev') {
      const releases: Release[] = JSON.parse(body);
      release = releases.filter(r => r.prerelease && !r.draft)
        .map(r => {
          const vs = r.tag_name.slice(1, -4).split('.');
          r.version = Number(`${vs[0]}.${vs.slice(1).join('')}`);
          return r;
        })
        .filter(r => r.version > versionCode)
        .sort((a, b) => b.version - a.version)[0];
    } else {
      release = JSON.parse(body);
    }
    const asset = release?.assets.find(a => a.name.includes('update.gz'));
    return isUndefined(release) ? null : {
      body: release.body,
      downloadUrl: asset?.browser_download_url,
      htmlUrl: release.html_url,
      newVersion: release.tag_name.slice(1)
    };
  }

}