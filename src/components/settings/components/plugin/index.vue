<script setup lang="ts">
import {
  ElInput,
  ElButton,
  ElInputNumber,
  ElTable,
  ElTableColumn,
  ElCheckTag,
  ElPagination,
  ElPopover,
  ElTag,
} from 'element-plus';
import SettingsCard from '../card/index.vue';
import SettingsCardItem from '../card/item/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { isUndefined } from '../../../../core/is';
import IconRedo from '../../../../assets/svg/icon-redo.svg';
import { usePlugin } from './hooks/plugin';
import { PluginType } from '../../../../core/plugins';
import IconLoadingPlay from '../../../../assets/svg/icon-loading-play.svg';
import IconImport from '../../../../assets/svg/icon-import.svg';
import IconDelete from '../../../../assets/svg/icon-delete.svg';
import IconUpdate from '../../../../assets/svg/icon-update.svg';
import IconSearch from '../../../../assets/svg/icon-search.svg';
import { Window, FileDrag, Text, CloseButton } from '../../../../components';
import { usePluginDevtools } from './hooks/plugin-devtools';
import { useDefaultSearch } from '../../../../hooks/default-search';
import { useDefaultPagination } from '../../../../hooks/default-pagination';

const { pluginDevtools, readAloud } = useSettingsStore();
const {
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
  showPluginSettingWindow,
  pluginSettingWindow,
  pluginSettingForm,
  pluginSettingFormKeys,
  pluginSettingName,
  settingPluginRequire,
} = usePlugin();
const { searchKey, searchResult } = useDefaultSearch(plugins);

const {
  totalPage,
  showValue,
  currentPage,
  currentPageChange
} = useDefaultPagination(searchResult);

const {
  openPluginDevtoolsKit,
  start
} = usePluginDevtools();
</script>
<script lang="ts">
export default {
  name: 'SettingsPlugin'
}
</script>

<template>
  <div class="settings-plugin">
    <SettingsCard title="开发">
      <SettingsCardItem v-memo="[pluginDevtools.resourcePath]" title="工具包"
        class-name="settings-card-item-plugin-devtools-resource-path">
        <ElInput v-model="pluginDevtools.resourcePath" size="small" readonly placeholder="未导入工具包">
          <template #append>
            <ElButton @click="openPluginDevtoolsKit">导入</ElButton>
          </template>
        </ElInput>
      </SettingsCardItem>
      <SettingsCardItem v-memo="[pluginDevtools.port]" title="端口号" class-name="settings-card-item-plugin-devtools-port">
        <ElInputNumber v-model="pluginDevtools.port"
          @change="cur => pluginDevtools.port = Math.floor(isUndefined(cur) ? 6028 : cur)" size="small"
          :value-on-clear="6028" :min="0" :max="65535" :step="1" />
      </SettingsCardItem>
      <SettingsCardItem v-once title="">
        <ElButton size="small" type="primary" @click="start">启动</ElButton>
      </SettingsCardItem>
    </SettingsCard>
    <SettingsCard class="plugins-manage-card">
      <template #header>
        <span v-once class="title">管理</span>
        <div style="display: flex; align-items: center;">
          <ElButton v-once title="导入" circle size="small" type="warning" :icon="IconImport" @click="importPlugin" />
          <ElButton v-once title="刷新" circle size="small" type="primary" :icon="IconRedo" @click="refresh" />
          <ElButton v-once title="删除" circle size="small" type="danger" :icon="IconDelete" @click="deleteChecked" />
          <ElButton v-once title="更新" circle size="small" type="success" :icon="IconUpdate" @click="updateChecked" />
          <ElInput v-memo="[searchKey]" class="settings-card-item-plugin-search-input" v-model="searchKey" clearable
            placeholder="请输入搜索关键字" :prefix-icon="IconSearch" />
        </div>
      </template>
      <FileDrag tip="导入插件" :z-index="1000" :to-body="false" width="100%" height="100%" @change="importPluginsFileDragChange">
        <ElTable v-memo="[showValue]" :data="showValue" height="215" @selection-change="handleSelectionChange"
          empty-text="暂无插件">
          <ElTableColumn type="selection" width="30" :selectable="checkSelectable" />
          <ElTableColumn label="ID" width="80">
            <template #default="{ row }">
              <Text :title="row.id" ellipsis max-width="100%">{{ row.id }}</Text>
            </template>
          </ElTableColumn>
          <ElTableColumn label="类型" width="70">
            <template #default="{ row }">
              <ElTag v-if="row.type === PluginType.BOOK_SOURCE">书源</ElTag>
              <ElTag v-else-if="row.type === PluginType.BOOK_STORE">书城</ElTag>
              <ElTag v-else-if="row.type === PluginType.TTS_ENGINE">TTS</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="分组" width="80">
            <template #default="{ row }">
              <Text :title="row.group" ellipsis max-width="100%">{{ row.group }}</Text>
            </template>
          </ElTableColumn>
          <ElTableColumn label="名称" width="90">
            <template #default="{ row }">
              <Text :title="row.name" ellipsis max-width="100%">{{ row.name }}</Text>
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="70">
            <template #default="{ row }">
              <ElCheckTag class="settings-card-item-plugin-state-check-tag" :checked="row.enable" type="primary"
                @click="toggleState(row)">{{ row.enable ? '已启用' : '已禁用' }}</ElCheckTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="版本号" width="70">
            <template #default="{ row }">
              <IconLoadingPlay v-if="row.updating" />
              <Text v-else :title="row.version" ellipsis max-width="100%">{{ row.version }}</Text>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" fixed="right" width="100">
            <template #default="{ row }">
              <ElButton v-if="row.require && Object.keys(row.require).length > 0" link size="small"
                type="info" @click="showPluginSettingWindow(row.id)">设置</ElButton>
              <ElButton v-if="row.type === PluginType.TTS_ENGINE" link size="small" type="primary" @click="useTTSEngine(row.id)">
                {{ row.id === readAloud.use ? '使用中' : '使用' }}
              </ElButton>
              <template v-if="!row.builtIn">
                <ElButton link size="small" type="danger" @click="deletePlugin(row)">删除</ElButton>
                <ElButton link size="small" type="success" @click="updatePlugin(row)">更新</ElButton>
              </template>
            </template>
          </ElTableColumn>
        </ElTable>
      </FileDrag>
      <ElPagination v-memo="[totalPage, currentPage]" layout="prev, pager, next" :page-count="totalPage"
        :current-page="currentPage" @current-change="currentPageChange" hide-on-single-page />
    </SettingsCard>
    <Window width="400" height="400" center-x center-y destroy-on-close :click-hide="false" :z-index="1000" class-name="plugin-setting-window" @event="e => pluginSettingWindow = e">
      <section>
        <header>
          <Text ellipsis max-width="370" :title="pluginSettingName">{{ pluginSettingName }}</Text>
          <CloseButton @click="pluginSettingWindow?.hide()" />
        </header>
        <main class="rc-scrollbar">
          <ul>
            <li v-for="key of pluginSettingFormKeys" :key="key">
              <Text ellipsis max-width="120" :title="key">{{ key }}</Text>
              <ElInput v-model="pluginSettingForm[key]" :placeholder="`请输入${key}`" />
            </li>
          </ul>
        </main>
        <footer>
          <ElButton type="primary" @click="settingPluginRequire">保存</ElButton>
        </footer>
      </section>
    </Window>
    <Window width="400" height="400" centerX centerY destroy-on-close :z-index="1000" @event="e => importErrorWindow = e">
      <p v-once style="margin: 5px 0;font-size: 12px; text-align: center; color: var(--rc-error-color)">插件导入失败列表</p>
      <ElTable v-memo="[importErrorList]" :data="importErrorList" height="380">
        <ElTableColumn label="文件名" width="150">
          <template #default="{ row }">
            <ElPopover trigger="hover" title="文件名" :content="row.name" width="200">
              <template #reference>
                <span class="settings-card-item-plugin-label">{{ row.name }}</span>
              </template>
            </ElPopover>
          </template>
        </ElTableColumn>
        <ElTableColumn label="错误原因" width="250">
          <template #default="{ row }">
            <ElPopover trigger="hover" title="错误原因" width="350">
              <template #reference>
                <span class="settings-card-item-plugin-label">{{ row.error }}</span>
              </template>
              <span style="color: var(--rc-error-color)">{{ row.error }}</span>
            </ElPopover>
          </template>
        </ElTableColumn>
      </ElTable>
    </Window>
  </div>
</template>
<style lang="scss">
.settings-card-item-plugin-search-input {
  margin-left: 10px;

  .el-input__wrapper {
    height: 25px;

    .el-input__inner {
      font-size: 12px;
      height: 15px !important;
    }
  }
}

.settings-card-item-plugin-state-check-tag {
  padding: 5px 10px !important;
  font-size: 12px !important;
}

.settings-card-item-plugin-devtools-resource-path {
  width: 300px;

  .el-input {
    height: 30px;
    font-size: 14px;

    .el-input__wrapper {
      cursor: default;

      .el-input__inner {
        height: 20px !important;
      }

      * {
        cursor: default;
      }
    }
  }

}

.settings-card-item-plugin-devtools-port {
  .el-input {
    height: 30px;
    font-size: 14px;

    .el-input__wrapper {
      cursor: default;

      .el-input__inner {
        height: 20px !important;
      }

      * {
        cursor: default;
      }
    }
  }
}
.plugins-manage-card {
  main {
    position: relative;
  }
}
.plugin-setting-window {
  section {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 0 10px 10px;
    height: 380px;
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-right: 10px;
      span {
        font-size: 14px;
      }
    }
    main {
      
      height: 300px;
      ul {
        padding-right: 10px;
        li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          &+li {
            margin-top: 10px;
          }
          span {
            font-size: 13px;
          }
          .el-input {
            width: 230px;
            .el-input__wrapper {
              height: 30px;
              padding: 0 5px;
              .el-input__inner {
                height: 20px;
              }
            }
          }
        }
      }
    }
    footer {
      padding-right: 10px;
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
<style scoped lang="scss">
.settings-plugin {
  .rc-button {
    width: 20px;
    height: 20px;
    border-radius: 5px;

    &:active {
      transform: scale(0.9);
    }
  }

  :deep(.el-table) {
    .el-table__cell {
      padding: 5px 0;
    }

    .el-table__header-wrapper {
      .el-table-column--selection .cell {
        padding-left: 10px;
      }

      .cell {
        padding: 0 10px;
      }
    }
    th.el-table__cell:is(.el-table-fixed-column--right),
    tr td:is(.el-table-fixed-column--right) {
      --el-table-tr-bg-color: var(--rc-card-bgcolor);
    }
    td.el-table__cell div {
      display: flex;
      align-items: center;
      font-size: 12px;
      padding: 0 0 0 10px;
      span {
        line-height: 15px;
      }
      .el-button+.el-button {
        margin-left: 2px;
      }
    }
  }
}
</style>