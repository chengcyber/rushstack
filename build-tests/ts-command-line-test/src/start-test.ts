// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  ICommandDefinition,
  executeCommandsAndCollectOutputs,
  updateOrCompareOutputs
} from './build-test-utilities';
import type { IRunScriptOptions } from '@rushstack/heft';

export async function runAsync(runScriptOptions: IRunScriptOptions): Promise<void> {
  const {
    heftTaskSession: {
      logger,
      parameters: { production }
    },
    heftConfiguration: { buildFolderPath }
  } = runScriptOptions;

  const commandDefinitions: ICommandDefinition[] = [
    {
      name: 'push-help',
      args: ['push', '--help']
    },
    {
      name: 'push-args-test',
      args: ['push', '--protocol', 'webdav', '--force']
    },
    {
      name: 'run-help',
      args: ['run', '--help']
    },
    {
      name: 'run-args-test-01',
      args: ['run', '--title', 'Hello', '1', '2', '3']
    },
    {
      name: 'run-args-test-02',
      args: ['run', '1', '2', '3'],
      env: {
        WIDGET_TITLE: 'Default title'
      }
    }
  ];

  await executeCommandsAndCollectOutputs({
    buildFolderPath,
    commandDefinitions
  });

  await updateOrCompareOutputs({
    buildFolderPath,
    logger,
    production
  });
}
