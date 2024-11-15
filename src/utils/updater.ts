import {check} from '@tauri-apps/plugin-updater';
import {relaunch} from '@tauri-apps/plugin-process';
import {info} from "@tauri-apps/plugin-log";
import {ask} from "@tauri-apps/plugin-dialog";
import dayjs from 'dayjs';

export async function checkForAppUpdates(): Promise<void> {
    const update = await check();

    if (!update?.available) {
        return;
    }
    const date = dayjs(update.date, 'YYYY-MM-DD HH:mm:ss.SSS Z').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm')
    await info(
        `found update ${update.version} from ${date} with notes ${update.body}`
    );

    const yes = await ask(`
更新版本: ${update.currentVersion} -> ${update.version}
更新时间: ${date}
        `,
        {
            title: "发现新版本!",
            kind: "info",
            okLabel: "立即更新",
            cancelLabel: "关闭",
        }
    );
    if (!yes) {
        await info('用户未确认更新');
        return;
    }

    let downloaded = 0;
    let contentLength = 0;
    // alternatively we could also call update.download() and update.install() separately
    await update.downloadAndInstall(async (event) => {
        switch (event.event) {
            case 'Started':
                contentLength = event.data.contentLength || 0;
                await info(`started downloading ${event.data.contentLength} bytes`);
                break;
            case 'Progress':
                downloaded += event.data.chunkLength;
                await info(`downloaded ${downloaded} from ${contentLength}`);
                break;
            case 'Finished':
                await info('download finished');
                break;
        }
    });

    await info('update installed');
    await relaunch();
}

