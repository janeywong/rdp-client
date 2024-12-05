import {IClientConf} from "/@/models/setting.model.ts";
import {platform} from "@tauri-apps/plugin-os";
import {RdpRedirect} from "/@/models/constants.ts";

export abstract class IRdpClient {
    protected server: string;
    protected username: string;
    protected password: string;
    protected conf: IClientConf;

    protected constructor(server: string, username: string, password: string, conf: IClientConf) {
        this.server = server;
        this.username = username;
        this.password = password;
        this.conf = conf;
    };

    async getCurrentPlatform() {
        return platform();
    }

    checkRedirect(redirect: RdpRedirect) {
        return this.conf.redirectChecked?.includes(redirect);
    }

    abstract parseCommand(): Promise<string>;

    abstract connect();
}
