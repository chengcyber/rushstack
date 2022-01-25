/* eslint-env es6 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function createWebpackConfig({ production }) {
  const webpackConfigForWebview = {
    mode: production ? 'production' : 'development',
    resolve: {
      // Note: Do not specify '.ts' or '.tsx' here.  Heft invokes Webpack as a post-process after the compiler.
      extensions: ['.js', '.jsx', '.json']
    },
    entry: {
      ['run-rush-command']: path.join(__dirname, 'out', 'webview', 'RunRushCommand', 'index.js')
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js'
    },
    devtool: production ? undefined : 'source-map',
    optimization: {
      runtimeChunk: false,
      splitChunks: {
        cacheGroups: {
          default: false
        }
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/webview/RunRushCommand/public/index.html',
        filename: 'run-rush-command.html'
      })
    ]
  };

  const webpackConfigForExtension = {
    mode: 'production',
    target: 'node', // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target

    entry: './out/extension.js', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
      // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    devtool: 'source-map',
    externals: {
      vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
      extensions: ['.jsx', '.js'],
      alias: {
        // provides alternate implementation for node module and source files
      }
    }
  };

  return [webpackConfigForWebview, webpackConfigForExtension];
}

module.exports = createWebpackConfig;
