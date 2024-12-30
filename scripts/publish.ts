import fs from "fs";
import path from "path";

const artifact_paths = process.env.ARTIFACT_PATHS;
const target = process.env.TARGET;
const platform = process.env.PLATFORM;
const workspace = process.env.WORKSPACE;

const parsedPaths = JSON.parse(artifact_paths);
const artifactPaths = Array.isArray(parsedPaths) ? parsedPaths : [parsedPaths]; // 将单个路径转为数组

// 确保传入的是文件路径而不是目录路径
const file_paths = artifactPaths.filter((file) => {
    let filepath = path.dirname(path.dirname(file));
    let readdirSync = fs.readdirSync(filepath);
    console.log(`path: ${filepath}, files: [${readdirSync}]`);
    filepath = path.dirname(filepath);
    readdirSync = fs.readdirSync(filepath);
    console.log(`path: ${filepath}, files: [${readdirSync}]`);
    filepath = path.dirname(filepath);
    readdirSync = fs.readdirSync(filepath);
    console.log(`path: ${filepath}, files: [${readdirSync}]`);
    return fs.statSync(file).isFile();
});

console.log(`workspace: ${workspace}, target=${target}, platform=${platform}, file_paths=${file_paths}`);
