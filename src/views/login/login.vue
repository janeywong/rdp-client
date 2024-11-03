<template>
  <div class="icon-header">
    <el-space direction="vertical">
      <img src="/tauri.svg" class="icon"/>
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
      <el-form-item prop="serverAddr">
        <el-input v-model="ruleForm.serverAddr" placeholder="服务器IP地址" type="text" autocomplete="off">
          <template #prepend>https://</template>
        </el-input>
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
        <el-button v-loading.fullscreen.lock="fullscreenLoading"
                   element-loading-text="加载中..."
                   class="loginBtn" type="primary"
                   @click.prevent="submitForm(ruleFormRef)">
          登录
        </el-button>
      </el-form-item>
    </el-form>
  </div>

  <div class="footer">
    <div class="mb-4 functions">
      <el-button type="primary" :icon="Setting" @click="goSetting">设置</el-button>
      <el-button type="warning" :icon="SwitchButton" @click.stop="shell">关机</el-button>
      <el-button type="warning" :icon="RefreshLeft" @click.stop="restart">重启</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue';
import type {FormInstance, FormRules} from 'element-plus';
import {RefreshLeft, Setting, SwitchButton} from '@element-plus/icons-vue';
import {useRouter} from "vue-router";

const fullscreenLoading = ref(false);

async function restart() {
  ElMessage({
    message: '功能待开发！',
    type: 'warning',
  })
}

async function shell() {
  ElMessage({
    message: '功能待开发！',
    type: 'warning',
  })
}

const ruleFormRef = ref<FormInstance>();

const ruleForm = reactive({
  serverAddr: '',
  username: '',
  password: '',
  remember: false,
});

const validateServerAddr = (rule: any, value: String, callback: any) => {
  if (value.trim() === '') {
    callback(new Error('请输入服务器IP地址'));
    return;
  }
  const [ip, port = '8006'] = value.split(':');
  let ipRegExp = /^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9])$/;
  let portRegExp = /^(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[1-9])$/;
  if (ipRegExp.test(ip.trim()) && portRegExp.test(port.trim())) {
    callback();
  } else {
    callback(new Error('请输入有效的服务器IP地址'));
  }
}

const rules = reactive<FormRules<typeof ruleForm>>({
  serverAddr: [{validator: validateServerAddr, trigger: 'blur'}],
  username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
  password: [{required: true, message: '请输入密码', trigger: 'blur'}],
});

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  const valid = await formEl.validate().catch(async () => {
    ElMessage({
      message: '表单验证异常！',
      type: 'warning',
    });
  });

  if (!valid) {
    return;
  }

  ElMessage({
    message: '功能待开发！',
    type: 'warning',
  })
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
    width: 160px;
    height: 160px;
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

.footer {
  display: flex;
  justify-content: center;
}
</style>
