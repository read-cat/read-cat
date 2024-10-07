import { ref } from 'vue';
import { isUndefined, isNewerVersionPlugin, isNumber, isString } from '../../../../../core/is';
import { useMessage } from '../../../../../hooks/message';
import { ElMessageBox } from 'element-plus';
import { PluginType } from '../../../../../core/plugins';
import { WindowEvent } from '../../../../window/index.vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../../../../../store/settings';
import { chunkArray, cloneByJSON, newError } from '../../../../../core/utils';
import { readFile } from 'fs/promises';
import { usePluginsStore } from '../../../../../store/plugins';
import { showOpenFileDialog } from '../../../../../core/utils/file';
import { useReadAloudStore } from '../../../../../store/read-aloud';
import axios from '../../../../../core/axios';
import { sleep } from '../../../../../core/utils/timer';
import { RequireItem } from '../../../../../core/plugins/defined/plugins';

export type Plugin = {
  enable: boolean
  id: string
  type: number
  group: string
  name: string
  version: string
  updating: boolean
  searchIndex: string
  builtIn: boolean
  // require?: Record<string, string>
  require?: Record<string, RequireItem | string>
  deprecated?: boolean
}

export const usePlugin = () => {
  const handler = () => {
    return GLOBAL_PLUGINS.getAllPlugins().map<Plugin>(({ enable, pluginClass, builtIn }) => {
      let typeLabel: string;
      switch (pluginClass.TYPE) {
        case PluginType.BOOK_SOURCE:
          typeLabel = '书源';
          break;
        case PluginType.BOOK_STORE:
          typeLabel = '书城';
          break;
        case PluginType.TTS_ENGINE:
          typeLabel = 'TTS';
          break;
        default:
          typeLabel = '';
          break;
      }
      return new Proxy({
        enable,
        builtIn,
        id: pluginClass.ID,
        type: pluginClass.TYPE,
        group: pluginClass.GROUP,
        name: pluginClass.NAME,
        version: pluginClass.VERSION,
        require: pluginClass.REQUIRE,
        deprecated: pluginClass.DEPRECATED,
        updating: false,
        searchIndex: `${pluginClass.ID} ${typeLabel} ${pluginClass.GROUP} ${pluginClass.NAME} ${pluginClass.DEPRECATED ? '已弃用' : (enable ? '已启用' : '已禁用')}`
      }, {
        set(target, key, newValue) {
          if (key === 'updating') {
            GLOBAL_PLUGINS.setUpdating(target.id, newValue);
          }
          Reflect.set(target, key, newValue);
          return true;
        },
        get(target, key) {
          if (key === 'updating') {
            return GLOBAL_PLUGINS.getUpdating(target.id);
          }
          return Reflect.get(target, key);
        },
      });
    });
  }
  const message = useMessage();
  const plugins = ref<Plugin[]>(handler());
  const checked = ref<string[]>([]);
  const settingsStore = useSettingsStore();
  const { threadsNumber } = storeToRefs(settingsStore);
  const { setRequire, getRequire } = usePluginsStore();
  const importErrorList = ref<{ name: string, error: string }[]>();
  const importErrorWindow = ref<WindowEvent>();
  const refresh = () => {
    plugins.value = handler();
  }

  const toggleState = (val: Plugin) => {
    if (val.deprecated) {
      message.warning('该插件已弃用');
      return;
    }
    let exec: (id: string) => Promise<void>;
    if (val.enable) {
      exec = GLOBAL_PLUGINS.disable.bind(GLOBAL_PLUGINS);
    } else {
      exec = GLOBAL_PLUGINS.enable.bind(GLOBAL_PLUGINS);
    }
    exec(val.id).catch(e => {
      message.error(e.message);
    }).finally(() => {
      refresh();
    });
  }

  const handleSelectionChange = (val: Plugin[]) => {
    checked.value = val.map(v => v.id);
  }
  const checkSelectable = (val: Plugin) => {
    return !val.builtIn;
  }

  const deletePlugin = (val: Plugin) => {
    const { id, name } = val;
    const p = plugins.value.find(p => p.id === id);
    if (isUndefined(p)) {
      message.error(`无法获取插件, 插件ID:${id}`);
      return;
    }
    if (p.updating) {
      message.warning(`插件正在更新中，无法删除`);
      return;
    }
    ElMessageBox.confirm(`<p>是否删除插件 ${name}</p><p>插件ID:${id}</p>`, '提示', {
      dangerouslyUseHTMLString: true,
      type: 'info',
      cancelButtonText: '取消',
      confirmButtonText: '删除'
    }).then(() => {
      GLOBAL_PLUGINS.delete(id).catch(e => {
        message.error(e.message);
      }).finally(() => {
        refresh();
      });
    }).catch(() => { });
  }

  const update = async (id: string) => {
    const p = plugins.value.find(p => p.id === id);
    const props = GLOBAL_PLUGINS.getPluginPropsById(id);
    if (isUndefined(p) || !props) {
      throw newError(`无法获取插件, 插件ID:${id}`);
    }
    if (!props.PLUGIN_FILE_URL.trim() || p.updating) {
      return;
    }
    try {
      p.updating = true;
      await sleep(1000);
      const { data } = await axios.get<string>(props.PLUGIN_FILE_URL, {
        responseType: 'text'
      });
      const { PluginClass } = await GLOBAL_PLUGINS.checkout(data);
      if (props.VERSION_CODE >= PluginClass.VERSION_CODE) {
        return;
      }
      await GLOBAL_PLUGINS.importJSCode(data, {
        force: true,
        enable: true,
        minify: true
      });
    } finally {
      p && (p.updating = false);
      refresh();
    }
  }
  const updatePlugin = (id: string) => {
    update(id).catch(e => message.error(e.message));
  }

  const updateChecked = async () => {
    if (checked.value.length <= 0) {
      message.warning('未选择插件');
      return;
    }
    const pluginIdList = plugins.value.filter(({ id }) => checked.value.includes(id)).map(({ id }) => id);
    let error = 0;
    for (const arr of chunkArray(pluginIdList, threadsNumber.value)) {
      const ps = [];
      for (const id of arr) ps.push(update(id).catch(e => {
        e.id = id;
        return Promise.reject(e);
      }));

      for (const result of await Promise.allSettled(ps)) {
        if (result.status === 'rejected') {
          error++;
          GLOBAL_LOG.error('Plugin update id:', result.reason.id, result.reason);
        }
      }
    }
    if (error > 0) {
      message.info(`${error} 个插件更新失败`);
    }
  }
  const deleteChecked = async () => {
    if (checked.value.length <= 0) {
      message.warning('未选择插件');
      return;
    }
    try {
      await ElMessageBox.confirm(`已选择 ${checked.value.length} 个插件, 是否将这些插件删除?`, '提示', {
        cancelButtonText: '取消',
        confirmButtonText: '删除',
        type: 'info'
      });

      let error = 0;
      let skip = 0;
      for (const items of chunkArray(checked.value, threadsNumber.value)) {
        const ps = [];
        for (const item of items) {
          const plugin = plugins.value.find(p => p.id === item);
          if (!plugin || plugin.updating) {
            skip++;
            continue;
          }
          ps.push(GLOBAL_PLUGINS.delete(item).catch(e => {
            e.id = item;
            return Promise.reject(e);
          }));
        }
        for (const item of await Promise.allSettled(ps)) {
          if (item.status === 'rejected') {
            error += 1;
            GLOBAL_LOG.error('Plugin delete id:', item.reason.id, item.reason);
          }
        }
      }
      if (error + skip === 0) {
        message.success(`已删除 ${checked.value.length} 个插件`);
      } else {
        message.info(`已删除 ${checked.value.length - error - skip} 个插件, ${error} 个插件删除失败, 跳过 ${skip} 个插件`);
      }
    } catch (e) { } finally {
      refresh();
    }
  }

  const imports = async (files: [string, Promise<string>][]) => {
    const ps: Promise<void>[] = [];
    for (const file of files) {
      ps.push(new Promise<void>(async (reso, reje) => {
        try {
          await GLOBAL_PLUGINS.importJSCode(await file[1], {
            minify: true,
            enable: true,
            force: true
          });
          return reso();
        } catch (e: any) {
          e.name = file[0];
          return reje(e);
        }
      }));
    }
    const list: { name: string, error: string }[] = [];
    for (const item of await Promise.allSettled(ps)) {
      if (item.status === 'rejected') {
        const { name, message } = item.reason;
        list.push({
          name,
          error: message
        });
      }
    }
    importErrorList.value = list;
    if (importErrorList.value.length > 0) {
      importErrorWindow.value?.show();
    } else {
      message.success(`已成功导入${files.length}个插件`);
    }
  }

  const importPlugin = () => {
    showOpenFileDialog({
      multiple: true,
      excludeAcceptAllOption: true,
      types: [{
        description: 'ReadCat插件',
        accept: {
          'text/javascript': ['.js'],
        }
      }],
    }).then(async handles => {
      await imports(handles.map(h => ([h.name, h.text()])));
    }).catch(e => {
      if (e.name === 'CanceledError') {
        return;
      }
      message.error(e.message);
    }).finally(() => {
      refresh();
    });
  }

  const importPluginsFileDragChange = (files: File[]) => {
    files = files.filter(f => f.name.endsWith('.js'));
    if (files.length < 1) {
      message.warning('拖入文件未包含插件文件');
      return;
    }
    imports(files.map(f => ([f.name, readFile(f.path, { encoding: 'utf-8' })]))).finally(() => {
      refresh();
    });
  }

  const { stop } = useReadAloudStore();
  const useTTSEngine = (id: string) => {
    if (id === settingsStore.readAloud.use) {
      return;
    }
    stop();
    settingsStore.readAloud.use = id;
  }

  const pluginSettingWindow = ref<WindowEvent>();
  // const pluginSettingForm = ref<Record<string, string>>({});
  const pluginSettingForm = ref<Record<string, RequireItem | string>>({});
  const pluginSettingFormKeys = ref<string[]>([]);
  const pluginSettingName = ref('');
  const pluginSettingId = ref('');
  const showPluginSettingWindow = (id: string) => {
    const props = GLOBAL_PLUGINS.getPluginPropsById(id);
    if (!props?.REQUIRE || Object.keys(props.REQUIRE).length < 1) {
      return;
    }
    pluginSettingForm.value = props.REQUIRE;
    pluginSettingId.value = id;
    pluginSettingName.value = props.NAME;
    pluginSettingFormKeys.value = Object.keys(props.REQUIRE);
    for (const key of pluginSettingFormKeys.value) {
      // pluginSettingForm.value[key] = '';
      // 初始化配置为默认值
      // 为兼容旧插件，检查设置项内容是 string 或 RequireItem
      // 如果为旧版插件
      if (isNewerVersionPlugin(pluginSettingForm.value[key])) {
        pluginSettingForm.value[key].value = pluginSettingForm.value[key].default;
      }
      else {
        pluginSettingForm.value[key] = '';
      }
      const item = getRequire(id);
      if (!item) {
        continue;
      }
      // pluginSettingForm.value[key] = item[key] || '';

      // 设置配置值，如果为空使用默认值
      // 如果是新版插件
      if (isNewerVersionPlugin(pluginSettingForm.value[key])) {
        if (isNumber(item[key])) {
          pluginSettingForm.value[key].value = isNaN(item[key]) ? pluginSettingForm.value[key].default : item[key];
        } else if (isString(item[key])) {
          pluginSettingForm.value[key].value = item[key];
        } else {
          pluginSettingForm.value[key].value = item[key] || pluginSettingForm.value[key].default;
        }
      }
      // 为兼容旧版插件
      else {
        pluginSettingForm.value[key] = item[key] || ''
      }
    }
    pluginSettingWindow.value?.show();
  }

  const settingPluginRequire = () => {
    if (!pluginSettingId.value) {
      return;
    }

    // 生成要保存的键值对
    let keys: Record<string, string> = {};
    pluginSettingFormKeys.value.forEach((key) => {
      // 兼容新旧插件
      keys[key] = isNewerVersionPlugin(pluginSettingForm.value[key]) ? pluginSettingForm.value[key].value : pluginSettingForm.value[key];
    })
    // setRequire(pluginSettingId.value.trim(), cloneByJSON(pluginSettingForm.value));
    // 保存配置
    setRequire(pluginSettingId.value.trim(), cloneByJSON(keys));
    pluginSettingWindow.value?.hide();
  }

  return {
    plugins,
    refresh,
    handleSelectionChange,
    checkSelectable,
    toggleState,
    deletePlugin,
    updatePlugin,
    updateChecked,
    deleteChecked,
    importPlugin,
    importErrorList,
    importErrorWindow,
    importPluginsFileDragChange,
    useTTSEngine,
    settingPluginRequire,
    showPluginSettingWindow,
    pluginSettingWindow,
    pluginSettingForm,
    pluginSettingFormKeys,
    pluginSettingName,
  }
}