module.exports = {
  projectName: "voice-book",
  entry: {
    main: "./src/index.js",
  },
  output: {
    path: __dirname + "/dist",
    publicPath: "/",
    filename: "[name].js", // Используем [name] вместо bundle.js
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  devServer: {
    static: {
      directory: __dirname + "/public",
      publicPath: "/",
    },
    historyApiFallback: true,
    port: 8099,
    open: true,
  },
};
