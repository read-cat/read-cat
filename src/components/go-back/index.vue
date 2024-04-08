<script setup lang="ts">
import { ElTooltip } from 'element-plus';
import { useRouter } from 'vue-router';
import IconBack from '../../assets/svg/icon-goback-back.svg';
import IconForward from '../../assets/svg/icon-goback-forward.svg';

const router = useRouter();


</script>
<script lang="ts">
export default {
  name: 'GoBack'
}
</script>
<template>
  <div class="container" v-once>
    <ElTooltip effect="light" content="后退" placement="bottom" :show-after="1000">
      <button class="rc-button" @click="router.back">
        <IconBack />
      </button>
    </ElTooltip>
    <ElTooltip effect="light" content="前进" placement="bottom" :show-after="1000">
      <button class="rc-button" @click="router.forward">
        <IconForward />
      </button>
    </ElTooltip>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;

  button {
    width: 25px;
    height: 25px;

    &:first-child {
      margin-right: 3px;
    }
  }
}
</style>