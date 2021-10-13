// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { Import, JsonFile, JsonObject } from '@rushstack/node-core-library';

const lodash: typeof import('lodash') = Import.lazy('lodash', require);

export interface IPluginOptionsJsonSchemaDefinition {
  packageName: string;
  pluginName: string;
  optionsSchemaRefURI?: string;
}

/**
 * @beta
 */
export class PluginConfigJsonSchemaEditor {
  private readonly _filePath: string;
  private _modified: boolean;
  private _sourceData: JsonObject;
  private _updatedData: JsonObject;

  private constructor(filepath: string, data: JsonObject) {
    this._filePath = filepath;
    this._sourceData = data;
    this._updatedData = lodash.cloneDeep(data);
    this._modified = false;

    try {
      const allOf = lodash.get(this._sourceData, this._getAllOfKeyPath());
      if (!allOf) {
        throw new Error(`Missing "allOf" field in ${this._getAllOfKeyPath().join('.')}`);
      }
      if (!Array.isArray(allOf)) {
        throw new Error(`"allOf" field is not an array in ${this._getAllOfKeyPath().join('.')}`);
      }
    } catch (e) {
      throw new Error(`Error loading "${filepath}": ${(e as Error).message}`);
    }
  }

  public static load(filePath: string): PluginConfigJsonSchemaEditor {
    return new PluginConfigJsonSchemaEditor(filePath, JsonFile.load(filePath));
  }

  public get filePath(): string {
    return this._filePath;
  }

  public setPluginOptionsSchemaDefinitions(
    pluginOptionsJsonSchemaDefinitions: IPluginOptionsJsonSchemaDefinition[]
  ): void {
    if (Array.isArray(pluginOptionsJsonSchemaDefinitions) && pluginOptionsJsonSchemaDefinitions.length) {
      const oneOf: JsonObject[] = [];
      for (const pluginOptionsJsonSchemaDefinition of pluginOptionsJsonSchemaDefinitions) {
        const { packageName, pluginName, optionsSchemaRefURI } = pluginOptionsJsonSchemaDefinition;
        oneOf.push({
          required: ['options'],
          properties: {
            packageName: {
              type: 'string',
              enum: [packageName]
            },
            pluginName: {
              type: 'string',
              enum: [pluginName]
            },
            options: {
              $ref: optionsSchemaRefURI
            }
          }
        });
      }
      lodash.set(this._updatedData, this._getOneOfKeyPath(), oneOf);
      this._onChange();
    }
  }

  public saveIfModified(): boolean {
    if (this._modified) {
      JsonFile.save(this._updatedData, this._filePath, { updateExistingFile: true });
      return true;
    }
    return false;
  }

  private _onChange(): void {
    this._modified = true;
  }

  private _getAllOfKeyPath(): string[] {
    return ['properties', 'plugins', 'items', 'allOf'];
  }

  private _getOneOfKeyPath(): string[] {
    return this._getAllOfKeyPath().concat(['1', 'oneOf']);
  }
}
