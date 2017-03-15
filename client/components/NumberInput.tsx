import * as React from "react";

export interface IProps {
  value: number;
  onChange(value: number): void;

  min?: number;
  max?: number;
  step?: number;
}

export interface IState {
  value: string;
}

export default class NumberInput extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super();
    this.state = {
      value: String(props.value || 0)
    };
  }

  componentWillReceiveProps(props: IProps) {
    this.setState({
      value: String(props.value)
    });
  }

  protected handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    switch (e.keyCode) {
      case 13: // enter
        this.commitValue(); // commit value
        break;
      case 27: // escape
        this.setState({ value: String(this.props.value) }); // reset to previous value
        break;
      default:
        console.log(e.keyCode);
    }
  }

  protected commitValue() {
    let newValue = Number(this.state.value);
    if (this.props.value !== newValue)
      // only update if value has changed
      this.props.onChange(newValue)
  }

  render() {
    let { value, onChange, ...props } = this.props;

    return <input
      type="number"
      value={this.state.value}
      onChange={e => this.setState({ value: e.currentTarget.value })}
      onKeyDown={e => this.handleKeyDown(e)}
      onBlur={e => this.commitValue()}
      {...props}
    />;
  }
}
