<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const goLogin = () => {
  router.push({
    path: "/login"
  });
};
</script>

<template>
  <div>这里是首页</div>
  <el-button @click="goLogin">去登录页</el-button>
</template>

<style scoped>

</style>
