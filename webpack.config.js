// webpack.config.js

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Ensure this is imported

module.exports = {
  entry: {
    popup: './src/components/Popup/Popup.jsx',
    options: './src/components/Options/Options.jsx',
    rssfeed: './src/components/RSSfeed/RSSfeed.jsx',
    contentGenerator: './src/components/ContentGenerator/ContentGenerator.jsx',
    window: './src/components/Window/Window.jsx',
    background: './src/background/background.js',
    content: './src/content_scripts/content.js',
    global: './src/assets/styles/styles.css', 
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js' // Ensures unique JS filenames per entry
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Handles both .js and .jsx files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/i, // Handles CSS files
        use: [MiniCssExtractPlugin.loader, 'css-loader'], // Extract CSS into separate files
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Handles image assets
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'], // Resolves these extensions
    alias: {
      Services: path.resolve(__dirname, 'src/services/'), // Existing alias
      Utils: path.resolve(__dirname, 'src/utils/'), // New alias
    },
  },
  plugins: [
    new CleanWebpackPlugin(), // Cleans the dist folder before each build
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css' // Unique CSS filename per entry
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: '.' }, // Copies manifest.json to dist/
        { from: 'src/assets/images/', to: 'assets/images/' }, // Copies images
        { from: 'src/components/RSSfeed/fetcher.html', to: 'components/RSSfeed/' },
        { from: 'src/components/RSSfeed/fetcher.js', to: 'components/RSSfeed/' }
      ],
    }),
    new HtmlWebpackPlugin({
      template: './src/components/Popup/Popup.html', // Template for Popup
      filename: 'popup.html',
      chunks: ['popup'], // Includes only the popup bundle
    }),
    new HtmlWebpackPlugin({
      template: './src/components/Options/Options.html', // Template for Options
      filename: 'options.html',
      chunks: ['options'], // Includes only the options bundle
    }),
    new HtmlWebpackPlugin({
      template: './src/components/RSSfeed/RSSfeed.html', // Template for RSSfeed
      filename: 'rssfeed.html',
      chunks: ['rssfeed'], // Includes only the rssfeed bundle
    }),
    new HtmlWebpackPlugin({
      template: './src/components/ContentGenerator/ContentGenerator.html', // Template for Content Generator
      filename: 'content_generator.html',
      chunks: ['contentGenerator'], // Includes only the contentGenerator bundle
    }),
    new HtmlWebpackPlugin({
      template: './src/components/Window/Window.html', // Template for Window
      filename: 'window.html',
      chunks: ['window'], // Includes only the window bundle
    }),
  ],
  mode: 'production', // Sets Webpack to production mode for optimizations
  devtool: 'source-map', // Generates source maps for debugging
};
