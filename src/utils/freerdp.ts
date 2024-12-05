import {ClientConf, IClientConf} from "/@/models/setting.model.ts";
import {platform} from "@tauri-apps/plugin-os";
import {error, info} from "@tauri-apps/plugin-log";
import {Command} from "@tauri-apps/plugin-shell";
import {defaults} from "lodash";

export function parseCommand(hostIp: string, username: string, password: string, clientConf: IClientConf): string {
    let args: string[] = [];
    args.push(clientConf?.rdpClientPath || '');
    // TODO 根据rdp协议构建参数，暂时只兼容freerdp
    args.push(`/v:${hostIp} /u:${username} /p:${password}`);

    clientConf = defaults(clientConf, new ClientConf());

    if (!!clientConf) {
        if (clientConf.sec && clientConf.sec !== 'auto') {
            args.push(`/sec:${clientConf.sec}`)
        }
        if (clientConf.bpp) {
            args.push(`/bpp:${clientConf.bpp}`)
        }
        if (clientConf.scale) {
            args.push(`/scale:${clientConf.scale}`)
        }
        if (clientConf.network) {
            args.push(`/network:${clientConf.network}`)
        }
        if (clientConf.adminMode) {
            args.push('+admin');
        }
        // 悬浮条，全屏才显示
        if (clientConf.floatbar) {
            args.push('/floatbar:sticky:off,default:hidden,show:fullscreen');
        }
        if (clientConf.resolution) {
            if (clientConf.resolution === '/f') {
                args.push(`+dynamic-resolution /f`)
            } else {
                args.push(`/size:${clientConf.resolution}`)
            }
        }
    }
    if (clientConf.cert) {
        args.push(`/cert:${clientConf.cert}`)
    }
    if (clientConf.additionalOptions) {
        args.push(clientConf.additionalOptions);
    }
    // 重定向配置
    if (Array.isArray(clientConf.redirectChecked) && clientConf.redirectChecked.length > 0) {
        // 多显示器
        if (clientConf.redirectChecked.includes(1)) {
            args.push('/multimon')
        }
        // 驱动器
        if (clientConf.redirectChecked.includes(2)) {
            args.push('+drives +home-drive')
        }
        // 声音
        if (clientConf.redirectChecked.includes(4)) {
            args.push('/sound')
        }
        // 麦克风
        if (clientConf.redirectChecked.includes(8)) {
            args.push('/microphone')
        }
        // 打印机
        if (clientConf.redirectChecked.includes(16)) {
            args.push('/printer')
        }
        // USB
        /*if (clientConf.redirectChecked.includes(32)) {
            // mac
            args.push('/usb:list')
        }*/
        // 剪切板重定向
        if (clientConf.redirectChecked.includes(64)) {
            args.push('+clipboard')
        }
    }
    return args.join(' ');
}

export async function connect(hostIp: string, username: string, password: string, clientConf: IClientConf) {
    try {
        const currentPlatform = await platform();
        const cmd = currentPlatform === 'windows' ? 'powershell.exe' : 'sh';

        const [user, realm] = username.split('@');

        // win11 测试只需要一个\
        const u = currentPlatform === 'windows' ? `${realm}\\${user}` : `${realm}\\\\${user}`;

        let args = ['-c', parseCommand(hostIp, u, password, clientConf)];

        await info(`execute command: ${cmd} ${args.join(' ')}`)

        const command = Command.create('exec-sh', args);

        const {stdout, stderr} = await command.execute();

        await info('rdp connect stdout: ' + stdout);
        await info('rdp connect stderr: ' + stderr);
    } catch (err) {
        await error(`command error: ${JSON.stringify(err)}`);
    }
}
