import type { Webview } from 'vscode';
export type IToExtensionMessage = IToExtensionMessageCommandInfo;

interface IToExtensionMessageCommandInfo {
  command: 'commandInfo';
  commandName: string;
  args: string[];
}

export const sendMessageToExtension: (message: IToExtensionMessage) => void = (message) => {
  const vscode: Webview = window.acquireVsCodeApi();
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  vscode.postMessage(message);
};
