import fs from "fs";

const artifact_paths = process.env.ARTIFACT_PATHS;
const target = process.env.TARGET;
const platform = process.env.PLATFORM;

const parsedPaths = JSON.parse(artifact_paths);
const artifactPaths = Array.isArray(parsedPaths) ? parsedPaths : [parsedPaths]; // 将单个路径转为数组

// 确保传入的是文件路径而不是目录路径
const file_paths = artifactPaths.filter((file) => fs.statSync(file).isFile());

console.log(`target=${target}, platform=${platform}, file_paths=${file_paths}`);
