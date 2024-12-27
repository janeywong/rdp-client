import {Command} from "@tauri-apps/plugin-shell";
import {error, info} from "@tauri-apps/plugin-log";
import {platform} from "@tauri-apps/plugin-os";

export const DynamicDrives = 'DynamicDrives';

export interface ILogicalDisk {
    DeviceId: string,
    /**
     * 对应于此逻辑磁盘表示的磁盘驱动器类型的数值
     * 未知 (0)
     * 无根目录 (1)
     * 可移动磁盘 (2)
     * 本地磁盘 (3)
     * 网络驱动器 (4)
     * 光盘 (5)
     * RAM 磁盘 (6)
     */
    DriveType: number,
    VolumeName: string
}

export function tradeDriveValue(drives: string[]) {
    if (!Array.isArray(drives) || drives.length === 0) {
        return '';
    }
    let sort = drives.filter(value => value !== DynamicDrives).sort((a, b) => a.localeCompare(b)).join(';');
    if (drives.includes(DynamicDrives)) {
        if (sort) {
            sort += `;${DynamicDrives}`
        } else {
            sort = DynamicDrives;
        }
    }
    return sort;
}

export function getVolumeName(logicalDisk: ILogicalDisk): string {
    let volumeName = logicalDisk.VolumeName;
    if (!volumeName) {
        switch (logicalDisk.DriveType) {
            case 0:
                volumeName = "未知";
                break;
            case 1:
                volumeName = "无根目录";
                break;
            case 2:
                volumeName = "移动磁盘";
                break;
            case 3:
                volumeName = "本地磁盘";
                break;
            case 4:
                volumeName = "网络驱动器";
                break;
            case 5:
                volumeName = "CD 驱动器";
                break;
            case 6:
                volumeName = "RAM磁盘";
                break;
        }
    }
    return `${volumeName}(${logicalDisk.DeviceId})`;
}

export async function loadLogicalDisk() {
    try {
        const currentPlatform = await platform();
        let json = '';
        if (currentPlatform === 'windows') {
            let args = ['-c'];
            args.push('Get-WmiObject -Class Win32_LogicalDisk | Select DeviceId, DriveType, VolumeName | ConvertTo-Json');

            await info(`execute command: powershell.exe ${args.join(' ')}`);
            const command = Command.create(
                'exec-sh',
                args,
                {encoding: 'GB2312'}
            );
            const {code, stdout, stderr} = await command.execute();
            await info(`loadLogicalDisk ${code}, stdout: ${stdout}, stderr: ${stderr}`);
            json = stdout;
        } else {
            // just test
            json = `[
                {
                    "DeviceId":  "C:",
                    "DriveType":  3,
                    "VolumeName":  ""
                },
                {
                    "DeviceId":  "D:",
                    "DriveType":  5,
                    "VolumeName":  null
                },
                {
                    "DeviceId":  "E:",
                    "DriveType":  3,
                    "VolumeName":  "新加卷"
                },
                {
                    "DeviceId":  "F:",
                    "DriveType":  3,
                    "VolumeName":  "新加卷"
                },
                {
                    "DeviceId":  "G:",
                    "DriveType":  2,
                    "VolumeName":  "Ventoy"
                },
                {
                    "DeviceId":  "H:",
                    "DriveType":  2,
                    "VolumeName":  "VTOYEFI"
                }
            ]`;
        }

        const data = <ILogicalDisk[]>JSON.parse(json);
        /*
        drivestoredirect:s:
        *：全选
        DynamicDrives：稍候插入的驱动器
        C:\;E:\;DynamicDrives：多选
         */
        let map = data.map(item => {
            let label = getVolumeName(item);
            return {value: `${item.DeviceId}\\`, label, type: item.DriveType};
        });
        map.push({value: 'DynamicDrives', type: 3, label: '稍候插入的驱动器'})
        return map;
    } catch (err) {
        await error(`loadLogicalDisk command error: ${JSON.stringify(err)}`);
        return [];
    }
}
