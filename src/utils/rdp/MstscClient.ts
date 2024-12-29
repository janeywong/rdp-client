import {IRdpClient} from "/@/utils/rdp/IRdpClient.ts";
import {IClientConf} from "/@/models/setting.model.ts";
import {currentMonitor} from '@tauri-apps/api/window';
import {RdpRedirect} from "/@/models/constants.ts";
import {create} from '@tauri-apps/plugin-fs';
import {BaseDirectory, tempDir} from '@tauri-apps/api/path';
import {path} from "@tauri-apps/api";
import {Command} from "@tauri-apps/plugin-shell";
import {info} from "@tauri-apps/plugin-log";
import {tradeDriveValue} from "/@/utils/rdp/WindowsUtil.ts";

export class MstscClient extends IRdpClient {
    constructor(server: string, username: string, password: string, conf: IClientConf) {
        super(server, username, password, conf);
    }

    async parseCommand(): Promise<string> {
        let rdpFileTemplate = `winposstr:s:0,1,0,0,1296,838
compression:i:1
keyboardhook:i:2
videoplaybackmode:i:1
connection type:i:7
networkautodetect:i:1
bandwidthautodetect:i:1
enableworkspacereconnect:i:0
disable wallpaper:i:0
allow font smoothing:i:0
allow desktop composition:i:0
disable full window drag:i:1
disable menu anims:i:1
disable themes:i:0
disable cursor setting:i:0
bitmapcachepersistenable:i:1
audiomode:i:0
redirectcomports:i:0
redirectwebauthn:i:1
redirectposdevices:i:0
prompt for credentials:i:0
negotiate security layer:i:1
remoteapplicationmode:i:0
alternate shell:s:
shell working directory:s:
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:0
gatewaybrokeringtype:i:0
use redirection server name:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:
enablerdsaadauth:i:0
`;

        // 常规
        // 如何连接中断，则重新连接 1：启用。0：不启用
        rdpFileTemplate += "autoreconnection enabled:i:1\n";
        // mac 连接到管理会话
        const platform = await this.getCurrentPlatform();
        // 显示
        // windows /admin
        if (this.conf.adminMode && platform === 'macos') {
            rdpFileTemplate += "administrative session:i:1\n";
            rdpFileTemplate += "connect to console:i:1\n";
            // 使会话适用窗口大小
            rdpFileTemplate += "smart sizing:i:1\n";
        }
        // 使用所有监视器
        rdpFileTemplate += `use multimon:i:${this.conf.useMultiMon ? '1' : '0'}\n`;
        const monitor = await currentMonitor();
        // 全屏 1：远程会话将显示在窗口中。2：远程会话全屏显示。
        if (this.conf.resolution === '/f') {
            rdpFileTemplate += "screen mode id:i:2\n";
            rdpFileTemplate += `desktopwidth:i:${monitor!.size.width / monitor!.scaleFactor}\n`;
            // fixme mac 远程桌面适应窗口高度需考虑 刘海屏(notch)
            rdpFileTemplate += `desktopheight:i:${monitor!.size.height / monitor!.scaleFactor}\n`;
        } else {
            rdpFileTemplate += "screenmode:id:i:1\n";
            const [width, height] = this.conf.resolution?.split('x');
            rdpFileTemplate += `desktopwidth:i:${width}\n`;
            rdpFileTemplate += `desktopheight:i:${height}\n`;
        }

        // 颜色质量
        rdpFileTemplate += `session bpp:i:${this.conf.bpp}\n`;
        // 全屏显示时显示连接栏 0：不显示。1：显示
        // mstsc全屏显示时不显示连接栏，开始菜单那里能断开
        rdpFileTemplate += `displayconnectionbar:i:0\n`;
        rdpFileTemplate += `pinconnectionbar:i:0\n`;

        // 重定向
        // 驱动器
        if (platform !== 'windows') {
            rdpFileTemplate += `drivestoredirect:s:${this.checkRedirect(RdpRedirect.DRIVER) ? '*' : ''}\n`;
        } else {
            rdpFileTemplate += `drivestoredirect:s:${tradeDriveValue(this.conf.drivestoredirect)}\n`;
        }
        // 打印机 0：本地设备上的打印机不会重定向到远程会话。1：本地设备上的打印机会重定向到远程会话。
        rdpFileTemplate += `redirectprinters:i:${this.checkRedirect(RdpRedirect.PRINTER) ? 1 : 0}\n`;
        // 智能卡 0：本地设备上的智能卡不会重定向到远程会话。1：本地设备上的智能卡会重定向到远程会话。
        rdpFileTemplate += `redirectsmartcards:i:${this.checkRedirect(RdpRedirect.SMART_CARD) ? 1 : 0}`;
        // 剪切板 0：本地设备上的剪贴板在远程会话中不可用。1：本地设备上的剪贴板在远程会话中可用。
        rdpFileTemplate += `redirectclipboard:i:${this.checkRedirect(RdpRedirect.CLIPBOARD) ? 1 : 0}\n`;
        // 远程音频录制 0：不录制。1：从此计算机进行录制。
        rdpFileTemplate += `audiocapturemode:i:1\n`;
        // mac 摄像头 *：重定向所有相机。
        rdpFileTemplate += `camerastoredirect:s:${this.checkRedirect(RdpRedirect.CAMERA) ? '*' : ''}\n`;
        // 先默认0 远程音频播放 0：在本地设备上播放声音。1：在远程会话中播放声音。2：不播放声音。
        // rdpFileTemplate += "audiomode:i:0\n";
        // 先默认开启 持久化位图缓存 1：启用。0：不启用
        // rdpFileTemplate += "bitmapcachepersistenable:i:1\n";
        // 服务器身份验证：0：连接并且不显示警告。1：不连接。2：显示警告。
        rdpFileTemplate += "authentication level:i:0\n";
        rdpFileTemplate += `username:s:${this.username}\n`;
        rdpFileTemplate += `full address:s:${this.server}\n`;

        const rdpFilename = `${this.server}.rdp`;
        const file = await create(rdpFilename, {baseDir: BaseDirectory.Temp,});
        await file.write(new TextEncoder().encode(rdpFileTemplate));
        await file.close();

        const tempPath = await tempDir();

        return path.join(tempPath, rdpFilename);
    }

    async connect() {
        const platform = await this.getCurrentPlatform();
        let cmd;

        let args = ['-c'];

        const rdpFilePath = await this.parseCommand();
        if (platform === 'windows') {
            cmd = 'powershell.exe';
            // 添加windows凭证
            args.push(`cmdkey /generic:"TERMSRV/${this.server}" /user:"${this.username}" /pass:"${this.password}";`);
            args.push('mstsc');
            args.push(rdpFilePath);
            if (this.conf.adminMode) {
                args.push('/admin');
            }
        } else {
            cmd = 'sh';
            args.push('open');
            args.push(rdpFilePath);
        }

        await info(`execute command: ${cmd} ${args.join(' ')}`);

        const command = Command.create('exec-sh', args, {encoding: 'GB2312'});

        const {stdout, stderr} = await command.execute();
        await info(`${this.conf?.clientType} connect stdout: ${stdout}'`);
        await info(`${this.conf?.clientType} connect stderr: ${stderr}'`);
    }
}
