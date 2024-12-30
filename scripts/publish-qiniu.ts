import {Octokit} from "@octokit/rest";

console.log("test script");

console.log(process.env);

const errors: string[] = [];

const [
    GITHUB_TOKEN,
    REPOSITORY_NAME,
    REPOSITORY_OWNER,
    QN_ACCESS_KEY,
    QN_SECRET_KEY,
    QN_BUCKET,
    QN_PREFIX,
    QN_PUBLIC_URL,
] = (
    [
        "GITHUB_TOKEN",
        "REPOSITORY_NAME",
        "REPOSITORY_OWNER",
        "QN_ACCESS_KEY",
        "QN_SECRET_KEY",
        "QN_BUCKET",
        "QN_PREFIX",
        "QN_PUBLIC_URL"
    ] as const
).map((v) => {
    const value = process.env[v];
    console.log(v, value);
    if (!value) {
        errors.push(`${v} is not set`);
    }
    return value ?? "";
});

if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
}

console.log(`REPOSITORY_NAME: ${REPOSITORY_NAME}, REPOSITORY_OWNER: ${REPOSITORY_OWNER}, QN_BUCKET: ${QN_BUCKET}, QN_PREFIX: ${QN_PREFIX}, QN_PUBLIC_URL: ${QN_PUBLIC_URL}`);

const octokit = new Octokit({
    auth: GITHUB_TOKEN,
});


export async function main() {
    const latestRelease = await octokit.repos.getLatestRelease({
        owner: REPOSITORY_OWNER,
        repo: REPOSITORY_NAME,
    });

    console.log('latestRelease', latestRelease);

    const latestJsonBinary = await octokit.repos.getReleaseAsset({
        owner: REPOSITORY_OWNER,
        repo: REPOSITORY_NAME,
        asset_id: latestRelease.data.assets.find(
            (a) => a.name === "latest.json"
        )!.id,
        headers: {
            Accept: "application/octet-stream",
        },
    });

    const latestJsonString = new TextDecoder().decode(
        latestJsonBinary.data as unknown as ArrayBuffer
    );

    console.log(`latestJsonString: ${latestJsonString}`);

    const latestJson = JSON.parse(latestJsonString);
    console.log(latestJson);
}

main().catch(reason => console.log(reason));
