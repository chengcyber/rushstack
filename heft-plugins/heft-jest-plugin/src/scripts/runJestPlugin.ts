import { IJestPluginOptions, JestPlugin } from '../JestPlugin';

import type { IRunScriptOptions, ITestStageProperties } from '@rushstack/heft';

export async function runAsync(options: IRunScriptOptions<ITestStageProperties>): Promise<void> {
  // Use the shared config file directly
  const jestPluginOptions: IJestPluginOptions = {
    configurationPath: './includes/jest-shared.config.json',
    disableConfigurationModuleResolution: false
  };
  await JestPlugin._runJestAsync(
    options.scopedLogger,
    options.heftConfiguration,
    options.debugMode,
    options.properties,
    jestPluginOptions
  );
}
