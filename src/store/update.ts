import { defineStore } from 'pinia';
import { WindowEvent } from '../components';
import { useMessage } from '../hooks/message';
import { newError } from '../core/utils';
import { sleep } from '../core/utils/timer';
import { Version } from '../core/updater/updater';
import axios from '../core/axios';
import { ElMessageBox } from 'element-plus';
import { useSettingsStore } from './settings';
import { Core } from '../core';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { handlerProxy } from '../core/request';
import { isUndefined } from '../core/is';


export const useUpdateStore = defineStore('Update', {
  state: () => {
    return {
      updateWindowRef: void 0 as WindowEvent | undefined,
      isUpdating: false,
      version: void 0 as Version | undefined,
      isDownloading: false,
      abortController: null as AbortController | null,
      progress: 0,
      updaterName: 'updater.exe'
    }
  },
  getters: {

  },
  actions: {
    async update(showInfo?: boolean) {
      if (this.isUpdating) {
        return;
      }
      this.isUpdating = true;
      const message = useMessage();
      const loading = showInfo ? message.loading('检测更新中') : null;
      try {
        GLOBAL_LOG.info('检测更新');
        await sleep(3000);
        const version = await GLOBAL_UPDATER.getNewVersion(METADATA.branch);
        if (!version) {
          throw newError('无法获取版本信息');
        }
        let newVersionCode;
        if (METADATA.branch === 'dev') {
          const reg = /(\d+)\.(\d+)\.(\d+)\-dev\.(\d+)/.exec(version.newVersion);
          if (!reg) {
            throw newError('版本号解析失败');
          }
          newVersionCode = Number(`${reg[1]}.${reg[2]}${reg[3]}${reg[4]}`);
        } else if (METADATA.branch === 'release') {
          const reg = /(\d+)\.(\d+)\.(\d+)/.exec(version.newVersion);
          if (!reg) {
            throw newError('版本号解析失败');
          }
          newVersionCode = Number(`${reg[1]}.${reg[2]}${reg[3]}`);
        } else {
          throw newError('Unknown branch');
        }
        if (isNaN(newVersionCode)) {
          throw newError('版本号解析失败');
        }
        if (METADATA.versionCode >= newVersionCode) {
          GLOBAL_LOG.info('当前已是最新版本');
          showInfo && message.success('当前已是最新版本');
          return;
        }
        GLOBAL_LOG.info('发现新版本', version.newVersion);
        this.version = version;
        this.updateWindowRef?.show();
      } catch (e: any) {
        GLOBAL_LOG.error('update', e);
        showInfo && message.error(e.message);
      } finally {
        loading?.close();
        this.isUpdating = false;
      }
    },
    async getUpdateLog() {
      if (this.isUpdating) {
        return;
      }
      this.isUpdating = true;
      const message = useMessage();
      const loading = message.loading('正在获取更新日志');
      try {
        await sleep(3000);
        const version = await GLOBAL_UPDATER.getUpdateLog(METADATA.tag);
        if (!version) {
          message.warning('该版本暂无更新日志');
          return;
        }
        version.htmlUrl = '';
        this.version = version;
        this.updateWindowRef?.show();
      } catch (e: any) {
        GLOBAL_LOG.error('update getUpdateLog', e);
        message.error(e.message);
      } finally {
        this.isUpdating = false;
        loading.close();
      }
    },
    async closeUpdateWindow() {
      try {
        await this.closeDownload();
        this.updateWindowRef?.hide();
      } catch (e: any) {
        if (e.name === 'CanceledError') {
          return;
        }
        useMessage().error(e.message);
      }
    },
    openHtmlUrl() {
      window.open(this.version?.htmlUrl);
    },
    async closeDownload() {
      try {
        if (!this.abortController) {
          return;
        }
        await ElMessageBox.confirm('是否取消下载?', '更新', {
          type: 'info',
          confirmButtonText: '是',
          cancelButtonText: '否'
        });
        this.abortController.abort();
        this.abortController = null;
        this.isDownloading = false;
        this.progress = 0;
        await sleep(1000);
        this.deleteUpdaterFile();
      } catch (e: any) {
        if (e === 'cancel') {
          e = newError('cancel');
          e.name = 'CanceledError';
        }
        return Promise.reject(e);
      }
    },
    async download() {
      try {
        if (this.isDownloading) {
          await this.closeDownload().catch(e => {
            if (e.name === 'CanceledError') {
              return;
            }
            return Promise.reject(e);
          });
          return;
        }
        if (!this.version?.downloadUrl) {
          return;
        }
        if (!Core.userDataPath) {
          throw newError('update download, userDataPath is undefined');
        }
        this.progress = 0;
        this.isDownloading = true;
        this.abortController = new AbortController();
        const { update, proxy, options } = useSettingsStore();
        let proxyUrl = update.downloadProxy?.trim() ? update.downloadProxy.trim() : '';
        proxyUrl && (proxyUrl = proxyUrl.endsWith('/') ? proxyUrl : proxyUrl + '/');

        let agent;
        if (options.enableProxy) {
          agent = handlerProxy(proxy);
        } else {
          await axios.head(proxyUrl).catch(e => {
            GLOBAL_LOG.error('无法连接Github加速下载链接', proxyUrl, e);
            return Promise.reject(newError('无法连接Github加速下载链接'));
          });
        }
        const filepath = join(Core.userDataPath, this.updaterName);
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
        let sha256_1, sha256_2;
        if (this.version.hashDownloadUrl) {
          const { data } = await axios.get<string>(`${agent ? '' : proxyUrl}${this.version.hashDownloadUrl}`, {
            responseType: 'text'
          });
          sha256_1 = data;
          GLOBAL_LOG.debug('update download, hash', this.version.hashDownloadUrl, sha256_1);
        }
        sha256_2 = await axios.download(`${agent ? '' : proxyUrl}${this.version.downloadUrl}`, filepath, {
          httpAgent: agent,
          httpsAgent: agent,
          signal: this.abortController.signal,
          onDownloadProgress: (progressEvent) => {
            const { progress } = progressEvent;
            if (!progress) {
              return;
            }
            this.progress = progress;
          },
        });
        GLOBAL_LOG.debug('update download, hash', this.version.downloadUrl, sha256_2);
        if (!isUndefined(sha256_1) && sha256_1.trim() !== sha256_2.trim()) {
          unlink(filepath).catch(e => {
            GLOBAL_LOG.error('update download, unlink', e);
          });
          throw newError('文件损坏');
        }
        for (let i = 1; i <= 3; i++) {
          await sleep(3000);
          try {
            await this.openUpdaterFile();
            break;
          } catch (e) {
            if (i >= 3) throw e;
          }
        }
        this.abortController = null;
        this.isDownloading = false;
        this.progress = 0;
      } catch (e: any) {
        if (e === 'cancel' || e.name === 'CanceledError') {
          return;
        }
        this.abortController = null;
        this.isDownloading = false;
        this.progress = 0;
        useMessage().error(e.message);
        GLOBAL_LOG.error('update download', e);
      }
    },
    async deleteUpdaterFile(ignoreError = false) {
      try {
        if (!Core.userDataPath) {
          return;
        }
        const filepath = join(Core.userDataPath, this.updaterName);
        if (!existsSync(filepath)) {
          return;
        }
        await unlink(filepath);
      } catch (e: any) {
        GLOBAL_LOG.error('update deleteUpdaterFile', e);
        !ignoreError && useMessage().error(e.message);
      }
    },
    openUpdaterFile() {
      return new Promise<void>((reso, reje) => {
        if (!Core.userDataPath) {
          return;
        }
        const filepath = join(Core.userDataPath, this.updaterName);
        if (!existsSync(filepath)) {
          return;
        }
        const proc = spawn(filepath, {
          detached: true
        });
        proc.on('error', e => {
          reje(e);
        });
        proc.on('exit', () => {
          reso();
        });
        proc.stderr.setEncoding('utf-8').on('data', chunk => {
          GLOBAL_LOG.error('update openUpdaterFile', chunk);
        });
      });
    }
  }
});