var webpack = require("webpack");
var config = require("./config.base");

if (process.env.NODE_ENV !== "test") {
  config.entry = [
    "webpack-dev-server/client?http://localhost:3000",
    "webpack/hot/dev-server"
  ].concat(config.entry);
}

// config.devtool = "#cheap-module-eval-source-map";

config.plugins.push(new webpack.HotModuleReplacementPlugin());
config.module.loaders = config.module.rules.concat([
  {
    test: /\.tsx?$/,
    loaders: [ "react-hot", "ts-loader" ],
    exclude: /node_modules/
  }
]);

module.exports = config;