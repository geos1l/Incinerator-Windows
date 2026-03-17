const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
  mode: 'development',
  target: 'web',
  entry: {
    widget: './src/widget/index.tsx',
    main: './src/main-ui/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion/dist/es/index.mjs'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/widget/index.html',
      filename: 'widget.html',
      chunks: ['widget'],
    }),
    new HtmlWebpackPlugin({
      template: './src/main-ui/index.html',
      filename: 'main.html',
      chunks: ['main'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
      ],
    }),
  ],
  devServer: {
    port: 9000,
    hot: true,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    static: [
      {
        directory: path.join(__dirname, 'assets'),
        publicPath: '/assets',
      },
    ],
  },
};
