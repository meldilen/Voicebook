module.exports = {
  entry: {
    main: "./src/index.js",
  },
  output: {
    path: __dirname + "/dist",
    publicPath: "/voice-book/",
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
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
    historyApiFallback: {
      rewrites: [
        { from: /^\/voice-book/, to: '/voice-book/index.html' }
      ]
    },
    open: true,
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
};