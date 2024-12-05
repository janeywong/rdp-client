<template>
  <div class="icon-header">
    <span class="version">v{{ version }}</span>
    <el-button class="setting-btn" type="warning" :icon="Setting" circle @click="goSetting"></el-button>
    <el-space direction="vertical">
      <img src="/hi-new.jpg" class="icon"/>
      <el-text class="mx-1 title" type="primary">欢迎使用云桌面</el-text>
    </el-space>
  </div>

  <div class="form-container">
    <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        status-icon
        :rules="rules"
        label-width="20"
        class="demo-ruleForm"
    >
      <el-form-item prop="username">
        <el-input v-model="ruleForm.username" placeholder="用户名" type="text" autocomplete="off"/>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
            v-model="ruleForm.password"
            placeholder="密码"
            type="password"
            autocomplete="off"
        />
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="ruleForm.remember" name="type" size="large">
          记住账号
        </el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button v-loading.fullscreen.lock="fullscreenLoading"
                   element-loading-text="加载中..."
                   class="loginBtn" type="primary"
                   @click.prevent="submitForm(ruleFormRef)">
          登录
        </el-button>
      </el-form-item>
    </el-form>
  </div>

  <el-dialog v-model="dialogVisible" title="虚拟机列表" width="800" :close-on-click-modal="false"
             :close-on-press-escape="false">
    <el-button class="btn-refresh-vm" @click.stop="loadVmList" type="success">刷新列表</el-button>
    <div class="vm-container gap-4">
      <el-card v-for="vm in vmList" :key="vm.id" style="width: 300px" shadow="never" @click.stop="connectRdp(vm)">
        <img :src="getVmIcon(vm)" class="vm-icon"/>
        <div style="text-align: center">{{ vm.name }}（{{ vm.node }}）</div>
      </el-card>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, Ref, ref, toRaw} from 'vue';
import type {FormInstance, FormRules} from 'element-plus';
import {Setting} from '@element-plus/icons-vue';
import {useRouter} from "vue-router";
import {app} from "@tauri-apps/api";
import {load, Store} from '@tauri-apps/plugin-store';
import {ClientConf, IAccount, IClientConf} from "/@/models/setting.model.ts";
import proxmoxApi from "/@/pve/constructor.ts";
import {error, info} from "@tauri-apps/plugin-log";
import {defaults, flattenDeep} from "lodash";
import {Proxmox} from "/@/pve";
import {cidrSubnet} from 'ip';
import {PveInterface} from "/@/models/pve.model.ts";
import {checkForAppUpdates} from '/@/utils/updater.ts'
import {RdpClientFactory} from "/@/utils/rdp/RdpClientFactory.ts";

const version = ref("");

onMounted(async () => {
  version.value = await app.getVersion();
  const tauriVersion = await app.getTauriVersion();
  await info(`appVersion: ${version.value}, tauriVersion: ${tauriVersion}`);
  const store = await Store.load('store.json');
  let account = await store.get<IAccount>('account');
  if (account?.remember) {
    ruleForm.username = account?.username || '';
    ruleForm.password = account?.password || '';
    ruleForm.remember = account.remember || false;
  }
  let clientConf = await store.get<IClientConf>('client');
  if (!clientConf?.clientType) {
    clientConf = defaults(clientConf, new ClientConf());
    await store.set('client', {
      ...clientConf,
      additionalOptions: clientConf?.additionalOptions || ''
    });
  }

  if (!clientConf?.serverAddr) {
    ElMessage({
      message: '请先配置服务器IP地址！',
      type: 'warning',
    })
    goSetting();
  }

  await checkForAppUpdates();
})

let proxmox: Proxmox.Api;
const fullscreenLoading = ref(false);
const dialogVisible = ref(false);
const vmList: Ref<Proxmox.clusterResourcesResources[]> = ref([]);

const getVmIcon = computed(() => (vm: Proxmox.clusterResourcesResources) => {
  return vm.status === 'running' ? '/computer_active.svg' : '/computer_deactive.svg';
});

const ruleFormRef = ref<FormInstance>();

const ruleForm = reactive({
  username: '',
  password: '',
  remember: false,
});

const rules = reactive<FormRules<typeof ruleForm>>({
  username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
  password: [{required: true, message: '请输入密码', trigger: 'blur'}],
});

let timerId;
let intervalId;

const connectRdp = async (vm: Proxmox.clusterResourcesResources) => {
  fullscreenLoading.value = true;
  if (vm.status === 'stopped') {
    // 类似响应：UPID:pve:002C74B4:161F4203:672CC8D4:qmstart:101:root@pam:
    const startResponse = await proxmox.nodes.$(vm.node!).qemu.$(vm.vmid!).status.start.$post();
    await info(`${vm.name} start response: ${startResponse}`);

    if (startResponse.includes("qmstart")) {
      ElMessage({
        message: '已发送开机指令，1分钟后会自动尝试连接！',
        type: 'success',
      })
    }

    // 定时刷新虚机状态，1分钟超时
    if (!!intervalId) {
      clearInterval(intervalId);
    }

    if (!!timerId) {
      clearInterval(timerId);
    }

    intervalId = setInterval(async () => {
      const currentStatus = await proxmox.nodes.$(vm.node!).qemu.$(vm.vmid!).status.current.$get();
      if (currentStatus.status === 'running') {
        await info(`${vm.name} current status ${currentStatus.status}`);
        // 重新加载虚机列表刷新状态
        await loadVmList();
        clearInterval(intervalId);

        timerId = setTimeout(async () => {
          fullscreenLoading.value = false;
          await info(`${vm.name} 开始尝试远程 vm: ${JSON.stringify(vm)}`);
          await connectRdp({...vm, status: 'running'});
          clearTimeout(timerId);
        }, 60000);
      }
    }, 5000);
    return;
  }
  const store = await Store.load('store.json')
  const clientConf = await store.get<IClientConf>('client')
  const [host] = clientConf!.serverAddr.split(':');

  const conf = await proxmox.nodes.$(vm.node!).qemu.$(vm.vmid!).config.$get();
  if (!conf.ostype?.startsWith('win')) {
    fullscreenLoading.value = false;
    await info(`${vm.name} unsupported operating system ostype: ${conf.ostype}`);
    ElMessage({
      message: '暂时只支持windows系统！',
      type: 'warning',
    })
    return;
  }

  try {
    const interfaces = await proxmox.nodes.$(vm.node!).qemu.$(vm.vmid!).agent["network-get-interfaces"].$get();
    const addresses = flattenDeep<PveInterface>(interfaces.result.map(item => item['ip-addresses']));
    await info(`get network interfaces: ${JSON.stringify(addresses)}`);

    // 筛选与pve主机为同网段的ipv4地址
    const findLast = addresses.findLast(
        ({'ip-address-type': ipAddressType, 'ip-address': ipAddress, prefix}) =>
            ipAddressType === 'ipv4' && cidrSubnet(`${host}/${prefix}`).contains(ipAddress)
    );
    if (!findLast) {
      ElMessage({
        message: '没有找到ip，请联系管理员！',
        type: 'warning',
      });
      fullscreenLoading.value = false;
      return;
    }

    await info(`filter interfaces: ${JSON.stringify(findLast)}`);

    fullscreenLoading.value = false;

    const store = await load('store.json');
    const clientConf = await store.get<IClientConf>('client');

    await info(`client: ${JSON.stringify(clientConf)}, rdpClientPath: ${clientConf?.rdpClientPath}`);

    if (!clientConf?.rdpClientPath) {
      goSetting();
      return;
    }

    await RdpClientFactory.create(findLast['ip-address'], ruleForm.username, ruleForm.password, clientConf).connect();
  } catch (err) {
    fullscreenLoading.value = false;
    await info(`${vm.name} get network interfaces error: ${err}`);
    ElMessage({
      message: `${err}`,
      type: 'warning',
    })
    return;
  }
}

const loadVmList = async () => {
  vmList.value = [];
  fullscreenLoading.value = true;
  try {
    const resources = await proxmox.cluster.resources.$get({type: 'vm'});
    vmList.value = resources;
    fullscreenLoading.value = false;
    dialogVisible.value = true;
    for (let resource of resources) {
      await info(`resource ${resource.name} ${JSON.stringify(resource)}`);
    }
  } catch (err) {
    fullscreenLoading.value = false;
    await error(`load vm resources failed: ${JSON.stringify(err)}`);
  }
}

const submitForm = async (formEl: FormInstance | undefined) => {
  fullscreenLoading.value = true;

  await info(`login params: ${JSON.stringify(toRaw(ruleForm))}`);
  if (!formEl) {
    fullscreenLoading.value = false;
    return;
  }

  try {
    const valid = await formEl.validate();
    if (!valid) {
      fullscreenLoading.value = false;
      ElMessage({
        message: '表单验证失败！',
        type: 'warning',
      });
      return;
    }
  } catch (e) {
    fullscreenLoading.value = false;
    ElMessage({
      message: '表单验证异常！',
      type: 'warning',
    });
    await error(`login form validation failed: ${JSON.stringify(e)}`);
    return;
  }

  await info('save account info')
  const store = await load('store.json');

  const clientConf = await store.get<IClientConf>('client');
  console.log(clientConf);

  const [host, port = '8006'] = clientConf!.serverAddr.split(':');

  try {
    // 记住账号
    if (ruleForm.remember) {
      await store.set('account', toRaw(ruleForm));
    }
  } catch (e) {
    fullscreenLoading.value = false;
    await error(`save account failed: ${JSON.stringify(e)}`);
  }

  await info('begin init proxmox api');

  proxmox = proxmoxApi({
    host,
    port: Number(port),
    username: ruleForm.username,
    password: ruleForm.password
  });

  await info('end init proxmox api');

  try {
    await info('begin get pve versions');
    const version = await proxmox.version.$get();
    await info(`pve version: ${JSON.stringify(version)}`);

    await loadVmList();
  } catch (err) {
    ElMessage({
      message: `${err}`,
      type: 'warning'
    });
    await error(`get pve version failed: ${JSON.stringify(err)}`);
  }
  fullscreenLoading.value = false;
};

const router = useRouter();

const goSetting = () => {
  router.push({
    path: '/setting',
  });
};
</script>

<style scoped lang="less">
.icon-header {
  text-align: center;

  .setting-btn {
    position: absolute;
    right: 20px;
    top: 5px;

    :deep(.el-icon) {
      font-size: 20px;
    }
  }

  .version {
    position: absolute;
    right: 5px;
    bottom: 0;
    color: gray;
  }

  .icon {
    width: 180px;
    height: 120px;
  }

  .title {
    font-size: 25px;
    margin: 10px 0;
  }
}

.form-container {
  display: flex;
  justify-content: center;
}

.el-form {
  min-width: 18em;
  max-width: 18em;
  text-align: center;

  .loginBtn {
    margin: 0 auto;
    min-width: 100px;
  }
}

.btn-refresh-vm {
  margin-bottom: 20px;
}

.vm-container {
  display: flex;
  flex-direction: row;
  column-gap: 10px;
  overflow-x: scroll;
  overflow-y: hidden;
  flex-wrap: nowrap;
  text-align: center;

  .vm-icon {
    max-width: 200px;
    width: 95%;
    height: 95%;
  }

  .el-card {
    max-width: 270px;
    flex-shrink: 0;
    margin-bottom: 20px;
  }
}
</style>
