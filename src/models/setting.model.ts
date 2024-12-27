export interface IAccount {
    username?: string;
    password?: string;
    remember?: boolean;
}

type RdpClientType = 'mstsc' | 'freerdp';

export interface IClientConf {
    serverAddr: string,
    clientType: RdpClientType,
    autoConnect: boolean,
    useMultiMon: boolean,
    smartSizing: boolean,
    audioMode: string,
    // rdp客户端路径
    rdpClientPath?: string;
    // 安全协议
    sec: string;
    // 资源重定向
    redirectChecked: number[];
    // 色深
    bpp: string;
    // 缩放
    scale: string;
    // 网络
    network: string;
    // 模式
    adminMode: boolean;
    // 分辨率
    resolution: string;
    // 证书检查
    cert: string;
    // 附加参数
    additionalOptions?: string;
    // 悬浮条
    floatbar: boolean;
    drivestoredirect: string[];
}

export class ClientConf implements IClientConf {
    constructor(
        public serverAddr: string = '',
        public clientType: RdpClientType = 'mstsc',
        public autoConnect: boolean = true,
        public useMultiMon: boolean = false,
        public smartSizing: boolean = false,
        public audioMode: string = '0',
        public rdpClientPath?: string,
        public sec: string = 'auto',
        public redirectChecked: number[] = [8, 16, 32, 64, 128],
        public bpp: string = '32',
        public scale: string = '100',
        public network: string = 'auto',
        public adminMode: boolean = false,
        public resolution: string = '/f',
        public cert: string = 'ignore',
        public floatbar: boolean = true,
        public drivestoredirect: string[] = [],
    ){
        this.serverAddr = serverAddr;
        this.clientType = clientType;
        this.autoConnect = autoConnect;
        this.useMultiMon = useMultiMon;
        this.smartSizing = smartSizing;
        this.audioMode = audioMode;
        this.rdpClientPath = rdpClientPath;
        this.sec = sec;
        this.redirectChecked = redirectChecked;
        this.bpp = bpp;
        this.scale = scale;
        this.network = network;
        this.adminMode = adminMode;
        this.resolution = resolution;
        this.cert = cert;
        this.floatbar = floatbar;
        this.drivestoredirect = drivestoredirect;
    }
}
