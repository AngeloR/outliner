//webpack.config.js
const path = require('path');
const tsconfigPaths = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: "development",
  entry: "./src/client.ts",
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: path.resolve('node_modules/')
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    plugins: [
      new tsconfigPaths()
    ]
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, './public', 'assets')
  }
};
