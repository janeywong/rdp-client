import {IRdpClient} from "/@/utils/rdp/IRdpClient.ts";
import {ClientConf, IClientConf} from "/@/models/setting.model.ts";
import {MstscClient} from "/@/utils/rdp/MstscClient.ts";
import {FreeRdpClient} from "/@/utils/rdp/FreeRdpClient.ts";
import {defaults} from "lodash";

export class RdpClientFactory {
    static create(server: string, username: string, password: string, clientConf: IClientConf): IRdpClient {
        let client: IRdpClient;
        let conf = defaults(clientConf, new ClientConf())
        switch (clientConf.clientType) {
            case "mstsc":
                client = new MstscClient(server, username, password, conf);
                break;
            case "freerdp":
                client = new FreeRdpClient(server, username, password, conf);
                break;
            default:
                throw new Error(`不支持的客户端类型: ${conf.clientType}`);
        }
        return client;
    }
}
