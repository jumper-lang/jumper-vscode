# Jumper Language for VS Code

Support for [Jumper](https://github.com/jumper-lang/jumper) in VS Code: scripts (`.jmp`), configs (`.jmc`) and access policies (`.jma`).

Highlighting, errors as you type, hover, completion, go to definition (into Java too). The language server is inside the extension.

Requires **Java 21+** (`JAVA_HOME` or `java` on the `PATH`).

## Install from VS Code Marketplace

1. Extensions view (`Ctrl+Shift+X`)
2. Search for **Jumper Language**
3. **Install**

Or from a terminal:

```
code --install-extension Padej.jumper-lang
```

## Install from GitHub Releases

1. Download `jumper-<version>.vsix` from [Releases](https://github.com/jumper-lang/jumper-vscode/releases)
2. Extensions view - `...` - **Install from VSIX...** - pick the file

Or from a terminal:

```
code --install-extension jumper-<version>.vsix
```

## Settings

| Setting | What |
|---|---|
| `jumper.java` | The `java` to run the server with. Empty - `JAVA_HOME`, then `PATH` |
| `jumper.server.jar` | Your own `jmp.jar` instead of the bundled one |
| `jumper.server.jvmArgs` | Extra JVM arguments, e.g. `["-Xmx512m"]` |
