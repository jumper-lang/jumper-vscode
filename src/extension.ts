// Jumper for VS Code: a client of the language server `jmp.jar --lsp` (Java 21+), started over stdio.
// Everything about the language - errors, hover, completion, go-to-definition into Java, semantic tokens,
// formatting - is the server's (https://github.com/jumper-lang/jumper, package me.padej.jumper.lsp); the
// extension adds what LSP has no words for: the three languages with their icons, the grammar, where Java
// and the server are. The server is a released jar of the language, pinned in package.json (scripts/server.mjs).
// jmp.jar travels inside the extension (server/jmp.jar). The CFR decompiler for go-to-definition into a Java
// class without sources is not in it: the server downloads it once into Jumper's data folder when it needs it.
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

/** .jmp, .jmc, .jma: one language for the server (it tells them apart by the extension), three for the editor. */
const LANGUAGES = ['jumper', 'jumper-config', 'jumper-policy'];

let client: LanguageClient | undefined;

function settings() {
    return vscode.workspace.getConfiguration('jumper');
}

/** `jumper.java`, else `JAVA_HOME/bin/java`, else `java` on the PATH. */
function javaExecutable(): string {
    const configured = settings().get<string>('java');
    if (configured) return configured;
    const exe = process.platform === 'win32' ? 'java.exe' : 'java';
    const home = process.env.JAVA_HOME;
    if (home) {
        const p = path.join(home, 'bin', exe);
        if (fs.existsSync(p)) return p;
    }
    return 'java';
}

/** `jumper.server.jar`, else the jmp.jar inside the extension. */
function serverJar(context: vscode.ExtensionContext): string {
    return settings().get<string>('server.jar') || context.asAbsolutePath(path.join('server', 'jmp.jar'));
}

async function start(context: vscode.ExtensionContext): Promise<void> {
    const jar = serverJar(context);
    if (!fs.existsSync(jar)) {
        void vscode.window.showErrorMessage(`Jumper: no language server at ${jar} (run: npm run server).`);
        return;
    }
    const jvmArgs = settings().get<string[]>('server.jvmArgs') ?? [];
    const run = {
        command: javaExecutable(),
        args: ['-Xss16m', ...jvmArgs, '-cp', jar, 'me.padej.jumper.Main', '--lsp'],
        transport: TransportKind.stdio,
    };
    const serverOptions: ServerOptions = { run, debug: run };
    const clientOptions: LanguageClientOptions = {
        documentSelector: LANGUAGES.map(language => ({ scheme: 'file', language })),
        // a policy or a jar changed: the server reads the file contexts again
        synchronize: { fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{jma,jar}') },
    };
    client = new LanguageClient('jumper', 'Jumper', serverOptions, clientOptions);
    try {
        await client.start();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        void vscode.window.showErrorMessage(
            `Jumper: the language server did not start (${message}). It needs Java 21+: set "jumper.java".`);
    }
}

async function stop(): Promise<void> {
    const c = client;
    client = undefined;
    if (c) await c.stop().catch(() => undefined);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async e => {
        // another java, jar or JVM arguments: a new server process
        if (!e.affectsConfiguration('jumper')) return;
        await stop();
        await start(context);
    }));
    await start(context);
}

export function deactivate(): Promise<void> {
    return stop();
}
