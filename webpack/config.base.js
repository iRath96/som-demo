var path = require("path");
var webpack = require("webpack");

var NODE_ENV = process.env.NODE_ENV;

var env = {
  production: NODE_ENV === "production",
  staging: NODE_ENV === "staging",
  test: NODE_ENV === "test",
  development: NODE_ENV === "development" || typeof NODE_ENV === "undefined"
};

Object.assign(env, {
  build: (env.production || env.staging)
});

module.exports = {
  target: "web",

  plugins: [
    new webpack.DefinePlugin({
      __DEV__: env.development,
      __STAGING__: env.staging,
      __PRODUCTION__: env.production,
      __CURRENT_ENV__: "\"" + (NODE_ENV) + "\""
    })
  ],

  entry: [
    "./client/index.tsx"
  ],

  output: {
    path: path.join(process.cwd(), "../dist/assets"),
    publicPath: "/assets/",
    filename: "app.js"
  },

  resolve: {
    modules: [
      "node_modules",
      "./"
    ],
    extensions: [ ".ts", ".tsx", ".js", ".jsx" ]
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        loaders: [ "style-loader", "css-loader", "sass-loader" ]
      },
      {
        test: /\.tsx?$/,
        loaders: [ "ts-loader" ]
      }
    ],

    noParse: /\.min\.js/
  }
};
