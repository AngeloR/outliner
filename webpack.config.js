//webpack.config.js
const path = require('path');
const tsconfigPaths = require('tsconfig-paths-webpack-plugin');

const env = process.env.ENVIRONMENT || 'production';

module.exports = {
  mode: env,
  devtool: env === 'development' ? "inline-source-map" : false,
  entry: {
    main: "./src/client.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, './public', 'assets'),
    filename: "bundle.js" // <--- Will be compiled to this single file
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
