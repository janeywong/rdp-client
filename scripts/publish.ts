import fs from "fs";
import path from "path";

const artifact_paths = process.env.ARTIFACT_PATHS;
const target = process.env.TARGET;
const platform = process.env.PLATFORM;
const workspace = process.env.WORKSPACE;

console.log(`workspace ${workspace} files: ${fs.readdirSync(workspace)}`);

console.log('latest.json content: ', fs.readFileSync(path.join(workspace, "latest.json"), "utf-8"));

const parsedPaths = JSON.parse(artifact_paths);
const artifactPaths = Array.isArray(parsedPaths) ? parsedPaths : [parsedPaths]; // 将单个路径转为数组

// 确保传入的是文件路径而不是目录路径
const file_paths = artifactPaths.filter((file) => fs.statSync(file).isFile());

console.log(`workspace: ${workspace}, target=${target}, platform=${platform}, file_paths=${file_paths}`);
