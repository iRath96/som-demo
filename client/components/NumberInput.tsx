import * as React from "react";

export interface IProps {
  value: number;
  onChange(value: number): void;
}

export interface IState {
  value: number;
}

export default class NumberInput extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super();
    this.state = {
      value: props.value || 0
    };
  }

  componentWillReceiveProps(props: IProps) {
    this.setState({
      value: props.value
    });
  }

  protected handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    switch (e.keyCode) {
      case 13: // enter
        this.props.onChange(this.state.value); // commit value
        break;
      case 27: // escape
        this.setState({ value: this.props.value }); // reset to previous value
        break;
      default:
        console.log(e.keyCode);
    }
  }

  render() {
    return <input
      type="number"
      value={this.state.value}
      onChange={e => this.setState({ value: Number(e.currentTarget.value) })}
      onKeyDown={e => this.handleKeyDown(e)}
      onBlur={e => this.props.onChange(this.state.value)}
    />;
  }
}
