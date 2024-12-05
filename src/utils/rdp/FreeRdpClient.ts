import {IRdpClient} from "/@/utils/rdp/IRdpClient.ts";
import {ClientConf, IClientConf} from "/@/models/setting.model.ts";
import {defaults} from "lodash";
import {error, info} from "@tauri-apps/plugin-log";
import {Command} from "@tauri-apps/plugin-shell";

export class FreeRdpClient extends IRdpClient {
    constructor(server: string, username: string, password: string, conf: IClientConf) {
        super(server, username, password, conf);
    }

    async parseCommand() {
        let args: string[] = [];
        args.push(this.conf?.rdpClientPath || '');
        // TODO 根据rdp协议构建参数，暂时只兼容freerdp
        args.push(`/v:${this.server} /u:${this.username} /p:${this.password}`);

        this.conf = defaults(this.conf, new ClientConf());

        if (!!this.conf) {
            if (this.conf.sec && this.conf.sec !== 'auto') {
                args.push(`/sec:${this.conf.sec}`)
            }
            if (this.conf.bpp) {
                args.push(`/bpp:${this.conf.bpp}`)
            }
            if (this.conf.scale) {
                args.push(`/scale:${this.conf.scale}`)
            }
            if (this.conf.network) {
                args.push(`/network:${this.conf.network}`)
            }
            if (this.conf.adminMode) {
                args.push('+admin');
            }
            // 悬浮条，全屏才显示
            if (this.conf.floatbar) {
                args.push('/floatbar:sticky:off,default:hidden,show:fullscreen');
            }
            if (this.conf.resolution) {
                if (this.conf.resolution === '/f') {
                    args.push(`+dynamic-resolution /f`)
                } else {
                    args.push(`/size:${this.conf.resolution}`)
                }
            }
        }
        if (this.conf.cert) {
            args.push(`/cert:${this.conf.cert}`)
        }
        if (this.conf.additionalOptions) {
            args.push(this.conf.additionalOptions);
        }
        // 重定向配置
        if (Array.isArray(this.conf.redirectChecked) && this.conf.redirectChecked.length > 0) {
            // 多显示器
            if (this.conf.redirectChecked.includes(1)) {
                args.push('/multimon')
            }
            // 驱动器
            if (this.conf.redirectChecked.includes(2)) {
                args.push('+drives +home-drive')
            }
            // 声音
            if (this.conf.redirectChecked.includes(4)) {
                args.push('/sound')
            }
            // 麦克风
            if (this.conf.redirectChecked.includes(8)) {
                args.push('/microphone')
            }
            // 打印机
            if (this.conf.redirectChecked.includes(16)) {
                args.push('/printer')
            }
            // USB
            /*if (this.conf.redirectChecked.includes(32)) {
                // mac
                args.push('/usb:list')
            }*/
            // 剪切板重定向
            if (this.conf.redirectChecked.includes(64)) {
                args.push('+clipboard')
            }
        }
        return args.join(' ');
    }

    async connect() {
        try {
            const currentPlatform = await this.getCurrentPlatform();
            const cmd = currentPlatform === 'windows' ? 'powershell.exe' : 'sh';

            const [user, realm] = this.username.split('@');

            // win11 测试只需要一个\
            const u = currentPlatform === 'windows' ? `${realm}\\${user}` : `${realm}\\\\${user}`;

            let args = ['-c', await this.parseCommand()];

            await info(`execute command: ${cmd} ${args.join(' ')}`)

            const command = Command.create('exec-sh', args);

            const {stdout, stderr} = await command.execute();

            await info('rdp connect stdout: ' + stdout);
            await info('rdp connect stderr: ' + stderr);
        } catch (err) {
            await error(`command error: ${JSON.stringify(err)}`);
        }
    }
}
