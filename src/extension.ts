import * as vscode from "vscode";

class TypoHelper {
  private readonly _pairs: string[] = [];
  constructor(pairs: string[]) {
    this._pairs = pairs;
  }
  private findAlt(s: string): string {
    const found = this._pairs.filter((pair) => pair.indexOf(s) != -1);
    if (found.length < 1) {
      return "";
    }
    const f = found[0];
    if (f.startsWith(s)) {
      return f.charAt(1);
    }
    return f.charAt(0);
  }
  execute(s: string): string {
    const alt = this.findAlt(s);
    return alt.length < 1 ? s : alt;
  }
}

const formatSelections = (editor: vscode.TextEditor, formatter: Function) => {
  editor.edit((editBuilder) => {
    editor.selections
      .map((sel) => {
        if (sel.isEmpty) {
          if (sel.active.character === 0) {
            return null;
          }
          const prevCursor = new vscode.Position(sel.active.line, sel.active.character - 1);
          const range = new vscode.Range(sel.active, prevCursor);
          return range;
        }
        return sel;
      })
      .forEach((sel) => {
        if (!sel) {
          return;
        }
        const text = editor.document.getText(sel);
        const newText = formatter(text);
        if (text != newText) {
          editBuilder.replace(sel, newText);
        }
      });
  });
};

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("fix-last-typo");
  const pairs: string[] = config.get("pairs") || [];
  const helper = new TypoHelper(pairs);

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("fix-last-typo.execute", (editor: vscode.TextEditor) => {
      formatSelections(editor, (s: string) => helper.execute(s));
    })
  );
}

export function deactivate() {}

