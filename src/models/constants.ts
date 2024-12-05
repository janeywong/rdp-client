export const RdpClientOptions = [
    {
        value: 'mstsc', label: 'mstsc', tip: 'window自带的远程桌面客户端'
    }, {
        value: 'freerdp', label: 'freerdp', tip: '一个免费开源实现的一个远程桌面协议(RDP)工具'
    }
]

export const AudioModeOptions = [
    {value: '0', label: '在本地设备上播放声音'},
    {value: '1', label: '在远程会话中播放声音'},
    {value: '2', label: '不播放声音'},
]

export const SecOptions = [
    {
        value: 'auto', label: 'auto',
    }, {
        value: 'rdp', label: 'rdp',
    }, {
        value: 'tls', label: 'tls',
    }, {
        value: 'nla', label: 'nla',
    }, {
        value: 'ext', label: 'ext',
    }, {
        value: 'aad', label: 'aad',
    },
];

export enum RdpRedirect {
    DRIVER = 2,
    MICROPHONE = 8,
    PRINTER = 16,
    SMART_CARD = 32,
    CLIPBOARD = 64,
    CAMERA = 128
}

export const RedirectOptions = [
    {
        value: 2, label: '驱动器',
    }, {
        value: 16, label: '打印机',
    }, {
        value: 32, label: '智能卡',
    }, {
        value: 8, label: '麦克风',
    }, {
        value: 128, label: '摄像头',
    }, {
        value: 64, label: '剪切板',
    },
    // 稍候插入的驱动器 drivestoredirect:s:DynamicDrives
];

export const ResolutionOptions = [
    {value: '/f', label: '全屏'},
    {value: '1024x768', label: '1024x768'},
    {value: '1280x720', label: '1280x720'},
    {value: '1280x800', label: '1280x800'},
    {value: '1280x1024', label: '1280x1024'},
    {value: '1920x1080', label: '1920x1080'},
];

export const CertOptions = [{
    value: 'ignore', label: 'ignore', tip: '忽略证书检查',
}, {
    value: 'deny', label: 'deny', tip: '仅允许可信任的证书，否则拒绝连接',
}, {
    value: 'tofu', label: 'tofu', tip: '在第一次连接时接受证书，如果证书不受信，则中止后续连接',
}];
