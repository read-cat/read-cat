import axios from '../../../../../core/axios';
import { handlerProxy } from '../../../../../core/request';
import { useMessage } from '../../../../../hooks/message';
import { useSettingsStore } from '../../../../../store/settings';

export const useTestProxy = () => {
  const message = useMessage();
  const { proxy } = useSettingsStore();
  let testing = false;
  const test = () => {
    if (testing) {
      return;
    }
    if (!proxy.testUrl.trim()) {
      message.warning('请输入测试链接');
      return;
    }
    const loading = message.loading('正在测试代理连接');
    testing = true;
    const httpAgent = handlerProxy(proxy);
    axios.head(proxy.testUrl, {
      httpAgent
    }).then(() => {
      message.success('该代理可使用');
    }).catch(e => {
      message.error(`该代理不可使用, ${e.message}`);
    }).finally(() => {
      testing = false;
      loading.close();
    });
  }

  return {
    test
  }
}