import * as vscode from 'vscode';

export class RushCommandWebViewPanel {
  private static _instance: RushCommandWebViewPanel | undefined;
  private _panel: vscode.WebviewPanel;
  private constructor() {
    this._panel = vscode.window.createWebviewPanel(
      'rushCommandWebViewPanel',
      'Run Rush Command',
      vscode.ViewColumn.One,
      {}
    );

    this._panel.webview.html = this._getWebviewContent();
  }

  public static getInstance(): RushCommandWebViewPanel {
    if (!RushCommandWebViewPanel._instance) {
      RushCommandWebViewPanel._instance = new RushCommandWebViewPanel();
    }

    return RushCommandWebViewPanel._instance;
  }

  public reveal(): void {
    this._panel.reveal();
  }

  private _getWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
        <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
    </body>
    </html>`;
  }
}
