import {createApp} from "vue";
import App from "./App.vue";
import router from './router';
import {attachConsole} from '@tauri-apps/plugin-log';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

attachConsole().catch(reason => {
    console.error(reason);
});

createApp(App).use(router).mount("#app");
