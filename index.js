"use strict";

var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");

var webpackDevConfig = require("./webpack/config.development");

new WebpackDevServer(webpack(webpackDevConfig), {
  publicPath: "/assets/",
  contentBase: "./client/",
  inline: true,
  hot: true,
  historyApiFallback: true,
  headers: {
    "Access-Control-Allow-Origin": "http://localhost:3001",
    "Access-Control-Allow-Headers": "X-Requested-With"
  }
}).listen(3000, "localhost", function (err) {
  if (err) {
    console.log(err);
  }

  console.log("webpack dev server listening on localhost:3000");
});