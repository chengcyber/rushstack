import * as vscode from 'vscode';
import * as path from 'path';
import { FileSystem } from '@rushstack/node-core-library';

import type { CommandLineAction } from '@rushstack/ts-command-line';
import type { IFromExtensionMessage } from '../webview/RunRushCommand/Message/fromExtension';
import type { IRootState } from '../webview/RunRushCommand/store';

export class RushCommandWebViewPanel {
  private static _instance: RushCommandWebViewPanel | undefined;
  private _panel: vscode.WebviewPanel | undefined;
  private _extensionPath: string;
  private constructor(context: vscode.ExtensionContext) {
    this._extensionPath = context.extensionPath;
  }

  public static getInstance(context: vscode.ExtensionContext): RushCommandWebViewPanel {
    if (!RushCommandWebViewPanel._instance) {
      RushCommandWebViewPanel._instance = new RushCommandWebViewPanel(context);
    }

    return RushCommandWebViewPanel._instance;
  }

  public reveal(commandLineAction: CommandLineAction): void {
    const state: IRootState = {
      parameter: {
        parameters: commandLineAction.parameters.slice()
      }
    };
    if (!this._panel) {
      this._panel = vscode.window.createWebviewPanel(
        'rushCommandWebViewPanel',
        'Run Rush Command',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );
      this._panel.onDidDispose(() => {
        this._panel = undefined;
      });
      this._setWebviewContent(state);
    } else {
      const message: IFromExtensionMessage = {
        command: 'initialize',
        parameters: state.parameter.parameters
      };
      console.log('message', message);
      this._panel.reveal();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this._panel.webview.postMessage(message);
    }
  }

  private _setWebviewContent(state: IRootState): void {
    if (!this._panel) {
      return;
    }
    this._panel.webview.html = this._getWebviewContent(state);
  }

  private _getWebviewContent(state: IRootState): string {
    let html: string = FileSystem.readFile(path.join(this._extensionPath, 'dist/run-rush-command.html'));
    const scriptSrc: vscode.Uri = vscode.Uri.file(
      path.join(this._extensionPath, 'dist/run-rush-command.js')
    ).with({ scheme: 'vscode-resource' });

    // replace bundled js with the correct path
    html = html.replace('run-rush-command.js', scriptSrc.toString());

    // hydrate initial state
    html = html.replace('window.__DATA__ = {};', `window.__DATA__ = ${JSON.stringify(state)};`);
    return html;
  }
}
