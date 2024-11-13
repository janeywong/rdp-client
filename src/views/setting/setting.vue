<script setup lang="ts">
import {reactive, toRaw} from 'vue';
import {useRouter} from 'vue-router';
import {CertOptions, RedirectOptions, ResolutionOptions, SecOptions} from "/@/models/constants.ts";
import {open} from '@tauri-apps/plugin-dialog';
import {load, Store} from '@tauri-apps/plugin-store';
import {IClientConf} from "/@/models/setting.model.ts";

const empty: number[] = [];

const form = reactive({
  rdpClientPath: '',
  sec: 'auto',
  redirectChecked: empty,
  bpp: '32',
  scale: '100',
  network: 'auto',
  userMode: false,
  resolution: '/f',
  cert: 'ignore',
  floatbar: false
});

Store.load('store.json').then(store => {
  store.get<IClientConf>('client').then((value) => {
    if (value) {
      form.rdpClientPath = value.rdpClientPath || '';
      form.sec = value.sec || 'auto';
      form.redirectChecked = value.redirectChecked || empty;
      form.bpp = value.bpp || '32';
      form.scale = value.scale || '100';
      form.network = value.network || 'auto';
      form.userMode = value.userMode || false;
      form.resolution = value.resolution || '/f';
      form.cert = value.cert || 'ignore';
      form.floatbar = value.floatbar || false;
    }
  });
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

const onSubmit = async () => {
  const store = await load('store.json');
  // 保留附加配置

  const clientConf = await store.get<IClientConf>('client');
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
    <el-form :model="form" label-width="120" style="max-width: 600px">
      <el-divider content-position="center">客户端配置</el-divider>
      <el-form-item label="RDP客户端路径" prop="rdpClientPath">
        <el-text style="width: 79%">{{form.rdpClientPath}}</el-text>
        <!--<div class="file-selector">
          <el-button type="primary" :icon="Document" @click="fileSelector">浏览</el-button>
        </div>-->
      </el-form-item>
      <el-form-item label="请选择安全协议">
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
      <el-form-item label="色深">
        <el-radio-group v-model="form.bpp">
          <el-radio value="8">8</el-radio>
          <el-radio value="16">16</el-radio>
          <el-radio value="24">24</el-radio>
          <el-radio value="32">32</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="缩放">
        <el-radio-group v-model="form.scale">
          <el-radio value="100">100</el-radio>
          <el-radio value="140">140</el-radio>
          <el-radio value="180">180</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="网络速率">
        <el-radio-group v-model="form.network">
          <el-radio value="auto">auto</el-radio>
          <el-radio value="lan">局域网</el-radio>
          <el-radio value="broadband-low">低速</el-radio>
          <el-radio value="broadband-high">高速</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="用户模式">
        <el-switch v-model="form.userMode" size="large" label="用户"></el-switch>
      </el-form-item>
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
        <el-switch v-if="form.resolution=='/f'" class="floatbar" v-model="form.floatbar" size="large" inline-prompt
                   active-text="开启悬浮条" inactive-text="关闭悬浮条"></el-switch>
      </el-form-item>
      <el-form-item label="证书检查">
        <el-radio-group v-model="form.cert">
          <el-tooltip v-for="item in CertOptions" :content="item.tip">
            <el-radio :key="item.value" :label="item.label" :value="item.value"></el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>
      <el-divider content-position="center">资源设置</el-divider>
      <el-form-item label="重定向">
        <el-checkbox-group v-model="form.redirectChecked">
          <el-checkbox
              name="redirect"
              v-for="item in RedirectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-checkbox-group>
      </el-form-item>
      <div class="footer">
        <el-button type="primary" @click="onSubmit">保存</el-button>
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
    display: flex;
    justify-content: center;
  }

  .floatbar {
    margin-left: 1em;
  }
}
</style>
