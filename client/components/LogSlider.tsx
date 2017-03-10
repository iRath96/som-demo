import * as React from "react";
import Slider from "material-ui/Slider";


export default class LogSlider extends React.Component<{
  [key: string]: any;

  value: number;
  onChange(e: React.MouseEvent<{}>, value: number): void;
}, void> {
  render() {
    let { value, onChange, ...props } = this.props;
    return <Slider
      value={Math.log10(value)}
      onChange={(event, value) => onChange(event, Math.pow(10, value))}
      {...props}
    />;
  }
}
