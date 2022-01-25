/* eslint-env es6 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function createWebpackConfig({ production }) {
  const webpackConfig = {
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
    devServer: {
      host: 'localhost',
      publicPath: '/',
      clientLogLevel: 'info',
      port: 8080
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

  return webpackConfig;
}

module.exports = createWebpackConfig;
