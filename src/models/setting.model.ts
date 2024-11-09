export interface IAccount{
    serverAddr?:string;
    username?:string;
    password?:string;
    remember?:boolean;
}

export interface IClientConf{
    // rdp客户端路径
    rdpClientPath?:string;
    // 安全协议
    sec?:string;
    // 资源重定向
    redirectChecked?:number[];
    // 色深
    bpp?: string;
    // 缩放
    scale?: string;
    // 网络
    network?: string;
    // 模式
    userMode?: boolean;
    // 分辨率
    resolution?: string;
    // 证书检查
    cert?: string;
    // 附加参数
    additionalOptions?: string;
    // 悬浮条
    floatbar?: boolean;
}
