<script setup lang="ts">
import {computed, onMounted, reactive, ref, toRaw} from 'vue';
import {useRouter} from 'vue-router';
import {
  AudioModeOptions,
  CertOptions,
  RdpClientOptions,
  RedirectOptions,
  ResolutionOptions,
  SecOptions
} from "/@/models/constants.ts";
import {open} from '@tauri-apps/plugin-dialog';
import {load, Store} from '@tauri-apps/plugin-store';
import {IClientConf} from "/@/models/setting.model.ts";
import {platform} from "@tauri-apps/plugin-os";
import type {FormInstance, FormRules} from "element-plus";
import {isV4Format} from "ip";

const currentPlatform = ref("");
const redirectOptions = computed(() => {
  return RedirectOptions.filter(item => item.value !== 2 || currentPlatform.value != 'windows');
});

const defaultRedirect: number[] = [8, 16, 32, 64, 128];
const ruleFormRef = ref<FormInstance>();

const form = reactive({
  serverAddr: '',
  clientType: 'mstsc',
  autoConnect: true,
  useMultiMon: false,
  smartSizing: false,
  audioMode: '0',
  rdpClientPath: '',
  sec: 'auto',
  redirectChecked: defaultRedirect,
  bpp: '32',
  scale: '100',
  network: 'auto',
  adminMode: false,
  resolution: '/f',
  cert: 'ignore',
  floatbar: false
});

onMounted(async () => {
  currentPlatform.value = await platform();
  console.log(currentPlatform.value);
  // 配置文件加载配置
  const store = await Store.load('store.json')
  const clientConf = await store.get<IClientConf>('client')
  if (clientConf) {
    form.serverAddr = clientConf.serverAddr || '';
    form.clientType = clientConf.clientType || 'mstsc';
    form.autoConnect = clientConf.autoConnect ?? true;
    form.useMultiMon = clientConf.useMultiMon ?? false;
    form.smartSizing = clientConf.smartSizing ?? false;
    form.audioMode = clientConf.audioMode ?? '0';
    form.rdpClientPath = clientConf.rdpClientPath || '';
    form.sec = clientConf.sec || 'auto';
    form.redirectChecked = clientConf.redirectChecked || defaultRedirect;
    form.bpp = clientConf.bpp || '32';
    form.scale = clientConf.scale || '100';
    form.network = clientConf.network || 'auto';
    form.adminMode = clientConf.adminMode ?? false;
    form.resolution = clientConf.resolution || '/f';
    form.cert = clientConf.cert || 'ignore';
    form.floatbar = clientConf.floatbar ?? false;
  }
})

const validateServerAddr = (rule: any, value: String, callback: any) => {
  if (value.trim() === '') {
    callback(new Error('请输入服务器IP地址'));
    return;
  }
  const [ip, port = '8006'] = value.split(':');
  let portRegExp = /^(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[1-9])$/;
  if (isV4Format(ip.trim()) && portRegExp.test(port.trim())) {
    callback();
  } else {
    callback(new Error('请输入有效的服务器IP地址'));
  }
}

const rules = reactive<FormRules<typeof form>>({
  serverAddr: [{validator: validateServerAddr, trigger: 'blur'}],
});

const fileSelector = async () => {
  const filePath = await open({
    multiple: false,
    directory: false,
  });
  if (filePath) {
    form.rdpClientPath = filePath || '';
  }
};

const handleUseMultiMonChange = value => {
  console.log(value);
}

const onSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) {
    ElMessage({
      message: '参数异常，请重启应用后重试！',
      type: 'warning',
    });
    return;
  }
  try {
    const valid = await formEl.validate();
    console.log(valid);
  } catch (e) {
    ElMessage({
      message: '表单验证失败！',
      type: 'warning',
    });
    return;
  }

  const store = await load('store.json');
  // 保留附加配置

  const clientConf = await store.get<IClientConf>('client');
  console.log({
    ...toRaw(form),
    additionalOptions: clientConf?.additionalOptions || ''
  });
  await store.set('client', {
    ...toRaw(form),
    additionalOptions: clientConf?.additionalOptions || ''
  });

  onReturn();
};

const router = useRouter();
const onReturn = () => {
  router.push({
    path: '/login',
  });
};
</script>

<template>
  <div class="form-container">
    <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="180" label-position="right"
             style="max-width: 600px">
      <el-form-item label="客户端">
        <el-radio-group v-model="form.clientType">
          <el-tooltip v-for="item in RdpClientOptions" :content="item.tip" placement="top">
            <el-radio :key="item.value" :label="item.label" :value="item.value"></el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>
      <el-tabs type="border-card">
        <el-tab-pane label="常规">
          <el-form-item prop="serverAddr" label="服务器IP地址">
            <el-input v-model="form.serverAddr" placeholder="请输入服务器IP地址" type="text" autocomplete="off">
            </el-input>
          </el-form-item>
          <el-form-item label="RDP客户端路径" prop="rdpClientPath" v-if="form.clientType=='freerdp'">
            <el-text style="width: 79%">{{ form.rdpClientPath }}</el-text>
          </el-form-item>
          <el-form-item label="请选择安全协议" v-if="form.clientType=='freerdp'">
            <el-select
                v-model="form.sec"
                clearable
                placeholder="安全协议"
                style="width: 140px"
            >
              <el-option
                  v-for="item in SecOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="证书检查" v-if="form.clientType=='freerdp'">
            <el-radio-group v-model="form.cert">
              <el-tooltip v-for="item in CertOptions" :content="item.tip">
                <el-radio :key="item.value" :label="item.label" :value="item.value"></el-radio>
              </el-tooltip>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="如何连接中断，则重新连接">
            <el-switch v-model="form.autoConnect" size="default"/>
          </el-form-item>
          <el-form-item label="连接到管理会话">
            <el-switch v-model="form.adminMode" size="default"/>
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane label="显示">
          <el-form-item label="分辨率">
            <el-select
                v-model="form.resolution"
                clearable
                placeholder="分辨率"
                style="width: 140px"
            >
              <el-option
                  v-for="item in ResolutionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="全屏显示时显示连接栏">
            <el-switch v-model="form.floatbar" size="default" :disabled="form.useMultiMon"/>
          </el-form-item>
          <el-form-item label="使会话适应窗口大小" v-if="currentPlatform == 'macos'">
            <el-switch v-model="form.smartSizing" size="default"/>
          </el-form-item>
          <el-form-item label="使用所有监视器">
            <el-switch v-model="form.useMultiMon" size="default" @change="handleUseMultiMonChange"/>
          </el-form-item>
          <el-form-item label="颜色质量">
            <el-radio-group v-model="form.bpp">
              <el-radio value="32">最高质量(32位)</el-radio>
              <el-radio value="24">真彩色(24位)</el-radio>
              <el-radio value="16">增强色(16位)</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane class="local" label="本地资源">
          <el-form-item label="重定向">
            <el-checkbox-group class="local-group" v-model="form.redirectChecked">
              <el-checkbox
                  name="redirect"
                  class="redirect-checkbox"
                  v-for="item in redirectOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="远程音频播放">
            <el-radio-group v-model="form.audioMode">
              <el-radio v-for="item in AudioModeOptions" :key="item.value" :label="item.label"
                        :value="item.value"></el-radio>
            </el-radio-group>
          </el-form-item>
        </el-tab-pane>
      </el-tabs>

      <div class="footer">
        <el-button type="primary" @click="onSubmit(ruleFormRef)">保存</el-button>
        <el-button type="info" @click="onReturn">返回</el-button>
      </div>
    </el-form>
  </div>

</template>

<style scoped lang="less">
.form-container {
  display: flex;
  justify-content: center;
}

.el-form {
  .file-selector {
    float: right;
    width: 20%;
    text-align: right;
  }

  .footer {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .floatbar {
    margin-left: 1em;
  }

  :deep(.el-tabs__nav-scroll) {
    width: 50%;
    margin: 0 auto
  }

  .el-tab-pane {
    min-width: 580px;
  }

  .local-group {
    width: 210px;
  }
}
</style>
