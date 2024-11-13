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

export const RedirectOptions = [
    {
        value: 1, label: '多显示器',
    }, {
        value: 2, label: '驱动器重定向',
    }, {
        value: 4, label: '声音重定向',
    }, {
        value: 8, label: '麦克风重定向',
    }, {
        value: 16, label: '打印重定向',
    }/*, {
        value: 32, label: 'USB重定向',
    }*/, {
        value: 64, label: '剪切板重定向',
    },
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
