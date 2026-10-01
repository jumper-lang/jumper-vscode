// The language server the extension carries: jmp.jar of the Jumper release that package.json names
// ("jumperServer": { "version", "sha256" }), downloaded from https://github.com/jumper-lang/jumper/releases into
// server/jmp.jar. The extension depends on the language only through that released, checksummed jar - never on its
// sources.
//
// The SHA-256 is pinned next to the version: the content of jmp.jar.sha256 of that release. While it is empty (a
// new version not pinned yet) the release's own jmp.jar.sha256 is trusted and printed, so it can be pinned.
// JUMPER_SERVER_JAR=<path to jmp.jar>: use a local build of the language instead (no download, no check).
import { createHash } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version, sha256: pinned } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).jumperServer;
const release = `https://github.com/jumper-lang/jumper/releases/download/v${version}`;
const dir = join(root, 'server');
const jar = join(dir, 'jmp.jar');
const stamp = join(dir, 'jmp.jar.version');

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

mkdirSync(dir, { recursive: true });

const local = process.env.JUMPER_SERVER_JAR;
if (local) {
    copyFileSync(local, jar);
    writeFileSync(stamp, `local ${local}\n`);
    console.log(`server: ${local} (local build)`);
    process.exit(0);
}

// already there: the same version, and still the pinned bytes
if (existsSync(jar) && existsSync(stamp) && readFileSync(stamp, 'utf8').trim() === `${version} ${pinned}`.trim()
        && (!pinned || sha256(readFileSync(jar)) === pinned)) {
    console.log(`server: jmp.jar ${version} is in place`);
    process.exit(0);
}

async function get(url) {
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
}

try {
    const bytes = await get(`${release}/jmp.jar`);
    let expected = pinned;
    if (!expected) {
        expected = (await get(`${release}/jmp.jar.sha256`)).toString('utf8').trim().split(/\s+/)[0];
        console.warn(`server: no SHA-256 pinned for ${version}; the release says ${expected} - pin it in package.json`);
    }
    const got = sha256(bytes);
    if (got !== expected) throw new Error(`jmp.jar ${version} has SHA-256 ${got}, expected ${expected}`);
    const part = `${jar}.part`;
    writeFileSync(part, bytes);
    rmSync(jar, { force: true });
    renameSync(part, jar);
    writeFileSync(stamp, `${version} ${pinned}\n`);
    console.log(`server: jmp.jar ${version} (${bytes.length} bytes, SHA-256 ${got})`);
} catch (e) {
    console.error(`server: could not get jmp.jar ${version}: ${e.message}`);
    console.error('server: set JUMPER_SERVER_JAR=<path to jmp.jar> to use a local build of the language');
    process.exit(1);
}
