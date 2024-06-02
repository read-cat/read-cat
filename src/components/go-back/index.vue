<script setup lang="ts">
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
    <button title="后退" class="rc-button" @click="router.back">
      <IconBack />
    </button>
    <button title="前进" class="rc-button" @click="router.forward">
      <IconForward />
    </button>
  </div>
</template>

<style scoped lang="scss">
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