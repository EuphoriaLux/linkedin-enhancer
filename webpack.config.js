// webpack.config.js

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin'); // Import the plugin

module.exports = {
  entry: {
    popup: './src/components/Popup/Popup.jsx',
    options: './src/components/Options/Options.jsx',
    rssfeed: './src/components/RSSfeed/RSSfeed.jsx',
    contentGenerator: './src/components/ContentGenerator/ContentGenerator.jsx',
    window: './src/components/Window/Window.jsx',
    background: './src/background/background.js',
    content: './src/content_scripts/content.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js', // Ensures unique JS filenames per entry
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Handles both .js and .jsx files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/i, // Handles CSS files
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader', // Add postcss-loader here
        ],
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
      Assets: path.resolve(__dirname, 'src/assets/'), // Added alias
    },
    fallback: {
      // These fallbacks are now handled by NodePolyfillPlugin, so you can omit them or keep them for explicitness
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url/"),
      "string_decoder": require.resolve("string_decoder/"),
      "timers": require.resolve("timers-browserify"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser"),
    },
  },
  plugins: [
    new CleanWebpackPlugin(), // Cleans the dist folder before each build
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css', // Unique CSS filename per entry
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: '.' }, // Copies manifest.json to dist/
        { from: 'src/assets/images/', to: 'assets/images/' }, // Copies images
        // Removed fetcher.html and fetcher.js as they are no longer needed
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
    // ProvidePlugin to supply global variables for polyfills
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new NodePolyfillPlugin(), // Adds polyfills for Node.js core modules
  ],
  target: ['web', 'es5'], // Ensures compatibility with older browsers if needed
  node: {
    global: true,
    __dirname: false,
    __filename: false,
  },
  mode: 'production', // Sets Webpack to production mode for optimizations
  devtool: 'source-map', // Generates source maps for debugging
};
