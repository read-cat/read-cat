<script setup lang="ts">
import {
  ElSwitch,
  ElInputNumber,
  ElInput,
  ElSelect,
  ElOption
} from 'element-plus';
import SettingsCard from '../card/index.vue';
import SettingsCardItem from '../card/item/index.vue';
import { useSettingsStore } from '../../../../store/settings';
import { isUndefined } from '../../../../core/is';

const { options, proxy } = useSettingsStore();
</script>
<script lang="ts">
export default {
  name: 'SettingsProxy'
}
</script>

<template>
  <div class="settings-proxy">
    <SettingsCard title="配置">
      <SettingsCardItem title="协议" v-memo="[proxy.protocol]">
        <ElSelect style="width: 100px" v-model="proxy.protocol" placeholder="请选择代理协议" size="small">
          <ElOption v-for="item of ['http', 'https', 'socks4', 'socks5']" :key="item" :label="item" :value="item" />
        </ElSelect>
      </SettingsCardItem>
      <SettingsCardItem title="主机" v-memo="[proxy.host]">
        <ElInput v-model="proxy.host" placeholder="请输入主机(host)" />
      </SettingsCardItem>
      <SettingsCardItem title="端口号" v-memo="[proxy.port]">
        <ElInputNumber v-model="proxy.port" @change="cur => proxy.port = Math.floor(isUndefined(cur) ? 7890 : cur)"
          size="small" :value-on-clear="7890" :min="0" :max="65535" :step="1" />
      </SettingsCardItem>
      <SettingsCardItem title="用户名" v-memo="[proxy.username]">
        <ElInput v-model="proxy.username" placeholder="请输入用户名(可选)" />
      </SettingsCardItem>
      <SettingsCardItem title="密码" v-memo="[proxy.password]">
        <ElInput v-model="proxy.password" placeholder="请输入密码(可选)" />
      </SettingsCardItem>
      <SettingsCardItem title="开启" v-memo="[options.enableProxy]">
        <ElSwitch :validate-event="false" v-model="options.enableProxy" />
      </SettingsCardItem>
    </SettingsCard>

  </div>
</template>

<style scoped lang="scss">
.settings-proxy {


  :deep(.el-select__wrapper) {
    font-size: 14px;
    height: 25px;
    line-height: 25px;
  }
  :deep(.el-input) {
    height: 25px;

    .el-input__wrapper {
      cursor: default;

      .el-input__inner[type="text"] {
        height: 15px !important;
        text-align: right;
      }
      .el-input__inner[type="number"] {
        font-size: 14px;
      }
    }
  }

}
</style>