//webpack.config.js
const path = require('path');
const tsconfigPaths = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
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
