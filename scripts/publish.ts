import fs from "fs";
import path from "path";
import * as qiniu from 'qiniu'

async function run(): Promise<void> {
    const artifact_paths = process.env.ARTIFACT_PATHS;
    const target = process.env.TARGET;
    const platform = process.env.PLATFORM;
    const version = process.env.VERSION;
    const args = process.env.ARGS;
    const workspace = process.env.WORKSPACE;

    console.log(`workspace ${workspace} files: ${fs.readdirSync(workspace)}`);

    console.log('latest.json content: ', fs.readFileSync(path.join(workspace, "latest.json"), "utf-8"));

    const parsedPaths = JSON.parse(artifact_paths);
    const artifactPaths: string[] = Array.isArray(parsedPaths) ? parsedPaths : [parsedPaths]; // 将单个路径转为数组

    // 确保传入的是文件路径而不是目录路径
    const signatureFile = artifactPaths.find((file) => fs.statSync(file).isFile() && file.endsWith(".sig"));
    if (!signatureFile) {
        throw new Error('No signature file were found.');
    }
    console.log(`${path.basename(signatureFile)} content: `, fs.readFileSync(signatureFile, "utf-8"));
    const filepath = path.dirname(signatureFile);
    const uploaderFilename = path.basename(signatureFile, path.extname(signatureFile));
    const uploaderFile = path.join(filepath, uploaderFilename);

    if (!fs.statSync(uploaderFile).isFile()) {
        throw new Error('No uploader file were found.');
    }

    console.log(`workspace: ${workspace}, target=${target}, version: ${version}, args: ${args}, platform=${platform}, signatureFile=${signatureFile}, uploaderFile=${uploaderFile}`);

    const bucket = process.env.QN_BUCKET;
    const accessKey = process.env.QN_ACCESS_KEY;
    const secretKey = process.env.QN_SECRET_KEY;
    const prefix = process.env.QN_PREFIX;
    const publicUrl = process.env.QN_PUBLIC_URL;

    console.log('GITHUB_REF_NAME', process.env.GITHUB_REF_NAME);

    console.log(process.env);

    let key = `${prefix}/${version}/${uploaderFilename}`;
    if (args) {
        key = `${prefix}/${version}/hi-new_${args}.app.tar.gz`;
    }

    console.log(`key: ${key}`);

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const options = {
        scope: bucket
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);

    const uploadToken = putPolicy.uploadToken(mac);
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();
    formUploader.putFile(
        uploadToken,
        key,
        uploaderFile,
        putExtra
    )
        .then(({data, resp}) => {
            if (resp.statusCode === 200) {
                console.log(data);
            } else {
                console.log(resp.statusCode);
                console.log(data);
            }
        })
        .catch(err => {
            console.log('put failed', err);
        });
}

run().catch(reason => console.error(reason));
