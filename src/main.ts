import {createApp} from "vue";
import App from "./App.vue";
import router from './router';
import {attachConsole} from '@tauri-apps/plugin-log';

attachConsole().catch(reason => {
    console.error(reason);
});

createApp(App).use(router).mount("#app");
