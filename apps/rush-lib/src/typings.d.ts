declare module '@npmcli/config' {
  type Where = 'builtin' | 'default' | 'global' | 'user' | 'project' | 'env' | 'cli';

  interface NpmConfigOptions {
    npmPath: string;
    definitions: Record<string, any>;
    shorthands?: Record<string, string[]>;
    defaults?: Record<string, any>;
    types?: Record<string, any>;

    cwd?: string;
    platform?: typeof process.platform;
    execPath?: string;
    log?: Partial<Console>;
    env?: typeof process.env;
    argv?: typeof process.argv;
  }
  class NpmConfig {
    constructor(options: NpmConfigOptions) {}

    load: () => Promise<void>;
    loaded: boolean;
    get: (key: string, where: Where = 'cli') => any;
  }

  export = NpmConfig;
}
