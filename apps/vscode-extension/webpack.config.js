const path = require('path');

const webpackConfig = {
  mode: 'development',
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
  }
};

module.exports = webpackConfig;