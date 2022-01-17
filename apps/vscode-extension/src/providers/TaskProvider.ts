import * as vscode from 'vscode';
import { terminal } from '../logic/logger';

let rushTaskProvider: RushTaskProvider | undefined;

export interface IProjectScriptTaskDefinition extends vscode.TaskDefinition {
  type: 'rush-project-script';

  cwd: string;
  command: string;
  displayName: string;
}

export class RushTaskProvider implements vscode.TaskProvider {
  private constructor() {}

  public static getInstance(): RushTaskProvider {
    if (!rushTaskProvider) {
      rushTaskProvider = new RushTaskProvider();
    }

    return rushTaskProvider;
  }

  public provideTasks(token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
    return null;
  }

  public resolveTask(task: vscode.Task, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
    terminal.writeDebugLine(`resolveTask: ${task.definition.type}`);
    return task;
  }

  public async executeTask<T extends IProjectScriptTaskDefinition>(definition: T): Promise<void> {
    let task: vscode.Task | undefined;
    switch (definition.type) {
      case 'rush-project-script': {
        const { cwd, displayName, command } = definition;
        const taskDefinition: vscode.TaskDefinition = {
          ...definition,
          type: 'rushx',
          cwd
        };
        task = new vscode.Task(
          taskDefinition,
          vscode.TaskScope.Workspace,
          displayName,
          'rushx',
          new vscode.ShellExecution(`rushx ${command}`, {
            cwd
          })
        );
        break;
      }
      default: {
        terminal.writeLine(`Unknown executeTask: ${definition.type}`);
      }
    }
    if (task) {
      await vscode.tasks.executeTask(task);
    }
  }
}
