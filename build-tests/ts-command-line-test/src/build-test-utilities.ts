// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import * as os from 'os';
import { Async, Executable, FileSystem, Text, type FolderItem } from '@rushstack/node-core-library';
import { AnsiEscape } from '@rushstack/terminal';
import { diff } from 'jest-diff';

import type { ChildProcess } from 'child_process';
import type { IScopedLogger } from '@rushstack/heft';

export type ICommandDefinition = IWidgetCommandDefinition;

export interface IWidgetCommandDefinition {
  /**
   * The scenario name. It is used to generate the output file name.
   *
   * For example, if the name is "run-command", the output file name will be "run-command.txt".
   */
  name: string;
  /**
   * The command line arguments to run. This doesn't include the command name itself.
   *
   * For example, if the command is "widget run 1 2 3", the args will be ["run", "1", "2", "3"].
   */
  args: string[];

  /**
   * The working directory
   */
  currentWorkingDirectory?: string;

  env?: Record<string, string>;
}

export interface IExecuteCommandsAndCollectOutputsOptions {
  commandDefinitions: ICommandDefinition[];
  buildFolderPath: string;
}

/**
 * Execute a list of predefined commands, collecting the command outputs to a temporary folder.
 */
export async function executeCommandsAndCollectOutputs({
  commandDefinitions,
  buildFolderPath
}: IExecuteCommandsAndCollectOutputsOptions): Promise<void> {
  // node ./lib/start.js
  const binPath: string = path.join(__dirname, 'start.js');
  const tempFolder: string = path.join(buildFolderPath, 'temp', 'etc');

  /**
   * Run each scenario and generate outputs
   */
  await FileSystem.ensureEmptyFolderAsync(tempFolder);
  for (const commandListDefinition of commandDefinitions) {
    const { name, args, env, currentWorkingDirectory } = commandListDefinition;
    const subProcess: ChildProcess = Executable.spawn('node', [binPath].concat(args), {
      stdio: 'pipe',
      currentWorkingDirectory,
      environment: {
        ...process.env,
        ...env,
        // Always use color for the output
        FORCE_COLOR: 'true'
      }
    });

    let stdout: string = '';
    let stderr: string = '';
    subProcess.stdout?.on('data', (data: Buffer) => {
      const text: string = data.toString();
      console.log(text);
      stdout += text;
    });

    subProcess.stderr?.on('data', (data: Buffer) => {
      const text: string = data.toString();
      console.log(text);
      stderr += text;
    });

    try {
      const status: number = await new Promise((resolve, reject) => {
        subProcess.on('close', (code: number) => {
          resolve(code);
        });
        subProcess.on('error', (error: Error) => {
          reject(error);
        });
      });

      if (status !== 0) {
        throw new Error(`Failed to run "widget ${args.join(' ')}" with exit code ${status}\n${stderr}`);
      }
    } catch (e) {
      throw new Error(`Failed to run "widget ${args.join(' ')}":\n${e.message}`);
    }

    const outputPath: string = path.join(tempFolder, `${name}.txt`);
    FileSystem.writeFile(
      outputPath,
      `Running "widget ${args.join(' ')}":\n${processCommandOutput(
        stdout,
        currentWorkingDirectory || process.cwd()
      )}`
    );
  }
}

export interface IUpdateOrCompareOutputs {
  buildFolderPath: string;
  production: boolean;
  logger: IScopedLogger;
}

/**
 * Based on buildFolderPath, we have a inFolderPath and outFolderPath.
 *
 * Files under outFolderPath are tracked by Git, files under inFolderPath are temporary files. During a local build,
 * --production is false, temporary files are copied to outFolderPath. During a CI build, --production is true, the
 * files with same name under these two folders are compared and CI build fails if they are different.
 *
 * The file structure could be:
 *
 * -- buildFolder
 *  |- temp
 *     |- etc
 *        |- foo.txt
 *  |- etc
 *     |- foo.txt
 *
 * This ensures that the temporary files must be up to date in the PR, and people who review the PR must approve any
 * changes.
 */
export async function updateOrCompareOutputs({
  buildFolderPath,
  production,
  logger
}: IUpdateOrCompareOutputs): Promise<void> {
  const inFolderPath: string = `${buildFolderPath}/temp/etc`;
  const outFolderPath: string = `${buildFolderPath}/etc`;
  await FileSystem.ensureFolderAsync(outFolderPath);

  const inFolderPaths: AsyncIterable<string> = enumerateFolderPaths(inFolderPath, '');
  const outFolderPaths: AsyncIterable<string> = enumerateFolderPaths(outFolderPath, '');
  const outFolderPathsSet: Set<string> = new Set<string>();

  for await (const outFolderPath of outFolderPaths) {
    outFolderPathsSet.add(outFolderPath);
  }

  const nonMatchingFiles: string[] = [];
  const nonMatchingFileErrorMessages: Map<string, string> = new Map<string, string>();
  await Async.forEachAsync(
    inFolderPaths,
    async (folderItemPath: string) => {
      outFolderPathsSet.delete(folderItemPath);

      const sourceFileContents: string = await FileSystem.readFileAsync(inFolderPath + folderItemPath);
      const outFilePath: string = outFolderPath + folderItemPath;

      let outFileContents: string | undefined;
      try {
        outFileContents = await FileSystem.readFileAsync(outFilePath);
      } catch (e) {
        if (!FileSystem.isNotExistError(e)) {
          throw e;
        }
      }

      const normalizedSourceFileContents: string = Text.convertToLf(sourceFileContents);
      const normalizedOutFileContents: string | undefined = outFileContents
        ? Text.convertToLf(outFileContents)
        : undefined;

      if (normalizedSourceFileContents !== normalizedOutFileContents) {
        nonMatchingFiles.push(outFilePath);
        if (production) {
          // Display diff only when running in production mode, mostly for CI build
          nonMatchingFileErrorMessages.set(
            outFilePath,
            diff(normalizedOutFileContents, normalizedSourceFileContents) || ''
          );
        }
        if (!production) {
          await FileSystem.writeFileAsync(outFilePath, normalizedSourceFileContents, {
            ensureFolderExists: true
          });
        }
      }
    },
    {
      concurrency: 10
    }
  );

  if (outFolderPathsSet.size > 0) {
    nonMatchingFiles.push(...outFolderPathsSet);
    if (!production) {
      await Async.forEachAsync(
        outFolderPathsSet,
        async (outFolderPath) => {
          await FileSystem.deleteFileAsync(`${outFolderPath}/${outFolderPath}`);
        },
        { concurrency: 10 }
      );
    }
  }

  if (nonMatchingFiles.length > 0) {
    const errorLines: string[] = [];
    for (const nonMatchingFile of nonMatchingFiles.sort()) {
      errorLines.push(`  ${nonMatchingFile}`);
      const errorMessage: string | undefined = nonMatchingFileErrorMessages.get(nonMatchingFile);
      if (errorMessage) {
        errorLines.push(`${errorMessage}`);
      }
    }

    if (production) {
      logger.emitError(
        new Error(
          'The following file(s) do not match the expected output. Build this project in non-production ' +
            `mode and commit the changes:\n${errorLines.join('\n')}`
        )
      );
    } else {
      logger.emitWarning(
        new Error(
          `The following file(s) do not match the expected output and must be committed to Git:\n` +
            errorLines.join('\n')
        )
      );
    }
  }
}

function processCommandOutput(text: string, workingDirectory: string): string {
  return [replaceWorkingDirectoryPath, formatForTests].reduce((text, fn) => fn(text, workingDirectory), text);
}
/**
 * Replace all "<workingDirectory>" strings with "__WORKING_DIRECTORY__".
 */
function replaceWorkingDirectoryPath(text: string, workingDirectory: string): string {
  let unifiedText: string = text;
  let unifiedWorkingDirectory: string = workingDirectory;
  if (os.platform() === 'win32') {
    // On Windows, replace backslashes path with forward slashes
    unifiedText = unifiedText.replace(/[A-Z]:\\([\w-]+\\)*([\w-])+/g, (match) => match.replace(/\\/g, '/'));
    unifiedWorkingDirectory = workingDirectory.replace(/\\/g, '/');
  }
  return unifiedText.replace(new RegExp(unifiedWorkingDirectory, 'g'), '__WORKING_DIRECTORY__');
}
/**
 * ANSI characters are a bit awkward and they are not well rendered in the website.
 * So we replace them with a more readable format.
 */
function formatForTests(text: string): string {
  return AnsiEscape.formatForTests(text);
}

async function* enumerateFolderPaths(
  absoluteFolderPath: string,
  relativeFolderPath: string
): AsyncIterable<string> {
  const folderItems: FolderItem[] = await FileSystem.readFolderItemsAsync(absoluteFolderPath);
  for (const folderItem of folderItems) {
    const childRelativeFolderPath: string = `${relativeFolderPath}/${folderItem.name}`;
    if (folderItem.isDirectory()) {
      yield* enumerateFolderPaths(`${absoluteFolderPath}/${folderItem.name}`, childRelativeFolderPath);
    } else {
      yield childRelativeFolderPath;
    }
  }
}
