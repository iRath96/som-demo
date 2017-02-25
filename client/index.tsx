import * as injectTapEventPlugin from "react-tap-event-plugin";
injectTapEventPlugin();

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";

import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./components/App";

ReactDOM.render(
  <MuiThemeProvider>
    <App />
  </MuiThemeProvider>,
  document.getElementById("app")
);
