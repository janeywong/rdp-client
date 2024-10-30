<template>
  <div class="icon-header">
    <el-space direction="vertical">
      <!--      <el-image src="../../../assets/svg/electron.svg" />-->
      <img src="/tauri.svg" class="icon"/>
      <el-text class="mx-1 title" type="primary">欢迎使用云桌面</el-text>
    </el-space>
  </div>
  <p>stdout: {{ stdoutMsg }}</p>
  <p>stderr: {{ stderrMsg }}</p>

  <div class="form-container">
    <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        status-icon
        :rules="rules"
        label-width="20"
        class="demo-ruleForm"
    >
      <el-form-item prop="serverAddr">
        <el-input v-model="ruleForm.serverAddr" placeholder="服务器地址" type="text" autocomplete="off"/>
      </el-form-item>
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
          自动登录
        </el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button class="loginBtn" type="primary" @click.prevent="submitForm(ruleFormRef)">
          登录
        </el-button>
      </el-form-item>
    </el-form>
  </div>

  <div class="footer">
    <div class="mb-4 functions">
      <el-button type="primary" :icon="Setting" @click="goSetting">设置</el-button>
      <el-button type="warning" :icon="SwitchButton" @click.stop="shell">关机</el-button>
      <el-button type="warning" :icon="RefreshLeft">重启</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue';
import type {FormInstance, FormRules} from 'element-plus';
import {useRouter} from 'vue-router';
import {RefreshLeft, Setting, SwitchButton} from '@element-plus/icons-vue';
import {Store} from '@tauri-apps/plugin-store';
import {Command} from '@tauri-apps/plugin-shell';
import {IAccount} from "/@/models/setting.model.ts";
import {error, info,} from '@tauri-apps/plugin-log';
import {platform} from '@tauri-apps/plugin-os';

const stdoutMsg = ref("");
const stderrMsg = ref("");

async function shell() {
  stderrMsg.value = '';
  stdoutMsg.value = '';
  const currentPlatform = await platform();
  await info("current platform: " + currentPlatform);
  const firstArg = currentPlatform === 'windows' ? '/c' : '-c';
  await info('exec-sh first arg is: ' + firstArg);

  const {stdout, stderr} = await Command.create('exec-sh', [
    firstArg,
    // "xfreerdp /v:10.0.151.10:3389 /u:administrator /p:lingling@2021 /t:'Server 10.0.151.10:3389' /sec:rdp",
    // "xfreerdp --help"
    "echo 'Hello World!'",
  ]).execute();
  console.log(stdout, stderr);
  await info('stdout: ' + stdout);
  await info('stderr: ' + stderr);
  stderrMsg.value = stderr;
  stdoutMsg.value = stdout;
}

const ruleFormRef = ref<FormInstance>();

const ruleForm = reactive({
  serverAddr: '',
  username: '',
  password: '',
  remember: false,
});

Store.load('store.json').then(store => {
  store.get<IAccount>('account').then((res) => {
    if (res && res.remember) {
      ruleForm.serverAddr = res.serverAddr || '';
      ruleForm.username = res.username || '';
      ruleForm.password = res.password || '';
      ruleForm.remember = res.remember || false;
    }
  });
});

const rules = reactive<FormRules<typeof ruleForm>>({
  serverAddr: [{required: true, message: '请输入服务器地址', trigger: 'blur'}],
  username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
  password: [{required: true, message: '请输入密码', trigger: 'blur'}],
});

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate((valid) => {
    info('valid: ' + valid).catch((err) => {
      console.error(err);
    })
    console.log(valid);
    if (valid) {
      const command = Command.sidecar('binaries/freerdp', [
        '--help'
      ]);
      command.execute().then(async ({stdout, stderr}) => {
        console.log(stdout, stderr);
        await info(stdout);
        await info(stderr);
        stdoutMsg.value = stdout;
        stderrMsg.value = stderr;
      });
      // window.api.send('rdpClient:connect', toRaw(ruleForm));
    } else {
      console.log('error submit!');
      error('error submit!').catch((err) => {
        console.error(err)
      });
    }
  });
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

  .icon {
    width: 200px;
    height: 200px;
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
  min-width: 12.5em;
  max-width: 12.5em;
  text-align: center;

  .loginBtn {
    margin: 0 auto;
    min-width: 100px;
  }
}

.footer {
  display: flex;
  justify-content: center;
}
</style>
