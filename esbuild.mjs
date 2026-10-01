// Bundles src/extension.ts with vscode-languageclient into one out/extension.js: the .vsix carries no
// node_modules and VS Code loads one file. `--production` minifies without a source map, `--watch` rebuilds.
import * as esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const options = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'out/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    logLevel: 'info',
};

if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
} else {
    await esbuild.build(options);
}
