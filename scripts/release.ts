import {readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {name, version} from "../package.json";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(__dirname);

(() => {
    const tomlPath = resolve(__dirname, "..", "src-tauri", "Cargo.toml");
    const lockPath = resolve(__dirname, "..", "src-tauri", "Cargo.lock");
    const tauriConfigPath = resolve(__dirname, "..", "src-tauri", "tauri.conf.json");
    let content = readFileSync(tauriConfigPath, "utf-8");
    const jsonData = {...JSON.parse(content), version};
    console.log(jsonData);

    writeFileSync(tauriConfigPath, JSON.stringify(jsonData, null, 2));

    for (const path of [tomlPath, lockPath]) {
        let content = readFileSync(path, "utf-8");

        const regexp = new RegExp(
            `(name\\s*=\\s*"${name}"\\s*version\\s*=\\s*)"(\\d+\\.\\d+\\.\\d+(-\\w+\\.\\d+)?)"`,
        );

        content = content.replace(regexp, `$1"${version}"`);

        writeFileSync(path, content);
    }
})();
