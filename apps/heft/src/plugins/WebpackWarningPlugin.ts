// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { FileSystem } from '@rushstack/node-core-library';

import { HeftSession } from '../pluginFramework/HeftSession';
import { HeftConfiguration } from '../configuration/HeftConfiguration';
import { IBuildStageContext, IBundleSubstage } from '../stages/BuildStage';
import { ScopedLogger } from '../pluginFramework/logging/ScopedLogger';
import { IHeftPlugin } from '../pluginFramework/IHeftPlugin';

const PLUGIN_NAME: string = 'webpack-warning-plugin';

export class WebpackWarningPlugin implements IHeftPlugin {
  public readonly pluginName: string = PLUGIN_NAME;

  public apply(heftSession: HeftSession, heftConfiguration: HeftConfiguration): void {
    heftSession.hooks.build.tap(PLUGIN_NAME, (build: IBuildStageContext) => {
      build.hooks.bundle.tap(PLUGIN_NAME, (bundle: IBundleSubstage) => {
        bundle.hooks.run.tapPromise(PLUGIN_NAME, async () => {
          let hasWebpackPlugin: boolean = false;
          for (const tap of bundle.hooks.run.taps) {
            if (tap.name === 'WebpackPlugin') {
              hasWebpackPlugin = true;
            }
          }

          await this._warnIfWebpackIsMissingAsync(
            heftSession,
            heftConfiguration,
            !!bundle.properties.webpackConfiguration,
            hasWebpackPlugin
          );
        });
      });
    });
  }

  private async _warnIfWebpackIsMissingAsync(
    heftSession: HeftSession,
    heftConfiguration: HeftConfiguration,
    webpackConfigIsProvided: boolean,
    hasWebpackPlugin: boolean
  ): Promise<void> {
    if (hasWebpackPlugin) {
      // If we have the plugin, we don't need to check anything else
      return;
    }

    if (webpackConfigIsProvided) {
      const logger: ScopedLogger = heftSession.requestScopedLogger(PLUGIN_NAME);
      logger.emitWarning(
        new Error(
          'Your project appears to have a Webpack configuration generated by a plugin, ' +
            'but the Heft plugin for Webpack is not enabled. To fix this, you can add ' +
            '"@rushstack/heft-webpack4-plugin" or "@rushstack/heft-webpack5-plugin" to ' +
            'your package.json devDependencies and use config/heft.json to load it. ' +
            'For details, see this documentation: https://rushstack.io/pages/heft_tasks/webpack/'
        )
      );
      return;
    }

    const webpackConfigFilename: string = 'webpack.config.js';
    const webpackConfigFileExists: boolean = await FileSystem.exists(
      `${heftConfiguration.buildFolder}/${webpackConfigFilename}`
    );
    if (webpackConfigFileExists) {
      const logger: ScopedLogger = heftSession.requestScopedLogger(PLUGIN_NAME);
      logger.emitWarning(
        new Error(
          `A ${webpackConfigFilename} file exists in this project ` +
            'but the Heft plugin for Webpack is not enabled. To fix this, you can add ' +
            '"@rushstack/heft-webpack4-plugin" or "@rushstack/heft-webpack5-plugin" to ' +
            'your package.json devDependencies and use config/heft.json to load it. ' +
            'For details, see this documentation: https://rushstack.io/pages/heft_tasks/webpack/'
        )
      );
    }
  }
}
