const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const config = {
  mode: 'development',
  entry: './index.web.js',
  output: {
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
      },
      {
        test: /\.(jpg|png|gif)$/,
        use: 'url-loader',
      },
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
    },
    extensions: ['web.js', '.js'],
  },
  devServer: {
    compress: true,
    port: 9000,
  },
  plugins: [
    new HtmlWebpackPlugin({template: './index.ejs'}),
    new CleanWebpackPlugin(),
  ],
};

module.exports = config;
