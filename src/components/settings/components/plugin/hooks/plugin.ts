import { ref } from 'vue';
import { isNull, isUndefined } from '../../../../../core/is';
import { useMessage } from '../../../../../hooks/message';
import { ElMessageBox } from 'element-plus';
import { PluginType } from '../../../../../core/plugins';
import { WindowEvent } from '../../../../window/index.vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../../../../../store/settings';
import { chunkArray } from '../../../../../core/utils';
import { readFile } from 'fs/promises';

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
  ttsEngineRequire?: Record<string, string>
}

export const usePlugin = () => {
  const handler = () => {
    return GLOBAL_PLUGINS.getAllPlugins().map<Plugin>(({ enable, props, builtIn }) => {
      let typeLabel: string;
      switch (props.TYPE) {
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
      return {
        enable,
        builtIn,
        id: props.ID,
        type: props.TYPE,
        group: props.GROUP,
        name: props.NAME,
        version: props.VERSION,
        ttsEngineRequire: props.TTS_ENGINE_REQUIRE,
        updating: false,
        searchIndex: `${props.ID} ${typeLabel} ${props.GROUP} ${props.NAME} ${enable ? '启用' : '禁用'}`
      }
    });
  }
  const message = useMessage();
  const plugins = ref<Plugin[]>(handler());
  const checked = ref<string[]>([]);
  const { threadsNumber } = storeToRefs(useSettingsStore());
  const importErrorList = ref<{ name: string, error: string }[]>();
  const importErrorWindow = ref<WindowEvent>();
  const refresh = () => {
    plugins.value = handler();
  }

  const toggleState = (val: Plugin) => {
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
  const updatePlugin = (val: Plugin) => {
    const { id } = val;
    const p = plugins.value.find(p => p.id === id);
    if (isUndefined(p)) {
      message.error(`无法获取插件, 插件ID:${id}`);
      return;
    }
    p.updating = true;
    setTimeout(() => p.updating = false, 3000);
  }

  const updateChecked = () => {
    // console.log(checked.value);

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
      for (const items of chunkArray(checked.value, threadsNumber.value)) {
        const ps = [];
        for (const item of items) {
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
      if (error === 0) {
        message.success(`已删除 ${checked.value.length} 个插件`);
      } else {
        message.info(`已删除 ${checked.value.length - error} 个插件, ${error} 个插件删除失败`);
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
    showOpenFilePicker({
      multiple: true,
      excludeAcceptAllOption: true,
      types: [{
        description: 'ReadCat插件',
        accept: {
          'text/javascript': ['.js'],
        }
      }],
    }).catch(e => {
      message.warning(e.message);
      return Promise.resolve(null);
    }).then(async handles => {
      if (isNull(handles)) {
        return;
      }
      await imports(handles.map(h => ([h.name, h.getFile().then(f => f.text())])));
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
    importPluginsFileDragChange
  }
}