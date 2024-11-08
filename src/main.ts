import {createApp} from "vue";
import App from "./App.vue";
import router from './router';
import {attachConsole} from '@tauri-apps/plugin-log';

await attachConsole();

createApp(App).use(router).mount("#app");
