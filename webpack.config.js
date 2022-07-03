const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const webpack = require('webpack')
const WebpackShellPluginNext = require('webpack-shell-plugin-next')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const htmlFiles = fs
  .readdirSync(path.resolve(__dirname, './src/assets/html/'))
  .filter((filename) => /\.html$/.test(filename))

const htmlModules = htmlFiles.map(
  (file) =>
    new HtmlWebpackPlugin({
      title: file.split('.')[0],
      filename: 'assets/html/' + file,
      template: path.resolve(__dirname, './src/assets/html/' + file),
    }),
)

module.exports = {
  mode: process.env.NODE_ENV,
  entry: './src/index.ts',
  target: 'node',
  devtool: 'inline-source-map',
  externals: {
    bufferutil: 'bufferutil',
    'utf-8-validate': 'utf-8-validate',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules|bower_components)/,
        resolve: {
          modules: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'libs'),
            'node_modules',
          ],
        },
        use: 'ts-loader',
      },
      {
        test: /\.(sass|scss|css)$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/images/[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.svg$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/svg/[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext][query]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@asteroids': path.join(__dirname, 'libs/asteroids'),
    },
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  optimization:
    process.env.NODE_ENV === 'production'
      ? {
          minimize: true,
          minimizer: [
            new TerserWebpackPlugin({
              extractComments: true,
            }),
          ],
        }
      : undefined,
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, './src/assets/svg'),
          to: path.resolve(__dirname, './dist/assets/svg'),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'global.css',
    }),
    new HtmlWebpackPlugin({
      title: 'index',
      filename: 'index.html',
      template: path.resolve(__dirname, './src/index.html'),
    }),
    ...htmlModules,
    new webpack.ProgressPlugin(),
    new WebpackShellPluginNext({
      onBuildEnd: {
        scripts: process.env.START ? ['node index.js'] : [],
        blocking: false,
        parallel: true,
      },
    }),
  ],
}
