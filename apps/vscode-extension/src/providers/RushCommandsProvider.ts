import * as vscode from 'vscode';
import { terminal } from '../logic/logger';
import { RushWorkspace } from '../logic/workspace';

import type { CommandLineAction } from '@rushstack/ts-command-line';

interface IRushCommandParams {
  label: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  commandLineAction: CommandLineAction;
}

class RushCommand extends vscode.TreeItem {
  public readonly commandLineAction: CommandLineAction;
  public constructor({ label, collapsibleState, commandLineAction }: IRushCommandParams) {
    super(label, collapsibleState);
    this.commandLineAction = commandLineAction;
  }
}

export class RushCommandsProvider implements vscode.TreeDataProvider<RushCommand> {
  private _commandLineActions: CommandLineAction[] | undefined;
  private readonly _onDidChangeTreeData: vscode.EventEmitter<RushCommand | undefined> =
    new vscode.EventEmitter();

  public readonly onDidChangeTreeData: vscode.Event<RushCommand | undefined> =
    this._onDidChangeTreeData.event;

  public constructor(context: vscode.ExtensionContext) {
    const rushWorkspace: RushWorkspace | undefined = RushWorkspace.getCurrentInstance();
    if (!rushWorkspace) {
      return;
    }
    RushWorkspace.onDidChangeWorkspace((rushWorkspace: RushWorkspace) => {
      this._commandLineActions = rushWorkspace.commandLineActions;
      this.refresh();
    });
    this._commandLineActions = rushWorkspace.commandLineActions;
  }

  public refresh(): void {
    terminal.writeDebugLine('Refreshing Rush commands');
    this._onDidChangeTreeData.fire(undefined);
  }

  public async refreshEntryAsync(): Promise<void> {
    this.refresh();
  }

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(element?: vscode.TreeItem): Thenable<RushCommand[]> {
    if (!this._commandLineActions) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      vscode.window.showInformationMessage('No RushProjects in empty workspace');
      return Promise.resolve([]);
    }

    // top-level
    if (!element) {
      return Promise.resolve(
        this._commandLineActions.map(
          (commandLineAction) =>
            new RushCommand({
              label: commandLineAction.actionName,
              collapsibleState: vscode.TreeItemCollapsibleState.None,
              commandLineAction
            })
        )
      );
    }

    return Promise.resolve([]);
  }
}
