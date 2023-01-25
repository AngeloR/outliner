//webpack.config.js
const path = require('path');
const tsconfigPaths = require('tsconfig-paths-webpack-plugin');

const env = process.env.ENVIRONMENT || 'development';

module.exports = {
  mode: env,
  devtool: env === 'environment' ? "inline-source-map" : false,
  entry: {
    main: "./src/client.ts",
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
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },
  externals: {
    'jquery': 'jQuery'
  }
};
