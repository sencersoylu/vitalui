import React from "react";

type Position = 'left' | 'center' | 'right';
type ValueType = string | number | boolean;

interface LabelItem {
  title: string;
  value?: ValueType;
}

interface TripleToggleSwitchProps {
  labels?: {
    left: LabelItem;
    center: LabelItem;
    right: LabelItem;
  };
  onChange: (value: Position) => void;
  styles?: React.CSSProperties;
}

interface TripleToggleSwitchState {
  switchPosition: Position;
  animation: string | null;
}

const defaultProps: TripleToggleSwitchProps = {
  labels: {
    left: {
      title: "ldseft",
      value: "fds",
    },
    center: {
      title: "center",
      value: "center",
    },
    right: {
      title: "right",
      value: "right",
    },
  },
  onChange: (value) => console.log("value:", value),
};

class TripleToggleSwitch extends React.Component<TripleToggleSwitchProps, TripleToggleSwitchState> {
  static defaultProps = defaultProps;

  constructor(props: TripleToggleSwitchProps) {
    super(props);
    this.state = {
      switchPosition: "left",
      animation: null,
    };
  }

  getSwitchAnimation = (value: Position): void => {
    const { switchPosition } = this.state;
    let animation = null;
    if (value === "center" && switchPosition === "left") {
      animation = "left-to-center";
    } else if (value === "right" && switchPosition === "center") {
      animation = "center-to-right";
    } else if (value === "center" && switchPosition === "right") {
      animation = "right-to-center";
    } else if (value === "left" && switchPosition === "center") {
      animation = "center-to-left";
    } else if (value === "right" && switchPosition === "left") {
      animation = "left-to-right";
    } else if (value === "left" && switchPosition === "right") {
      animation = "right-to-left";
    }
    this.props.onChange(value);
    this.setState({ switchPosition: value, animation });
  };

  render() {
    const { labels } = this.props;

    if (!labels) return null;

    return (
      <div className="main-container">
        <div
          className={`switch ${this.state.animation} ${this.state.switchPosition}-position`}
        ></div>
        <input
          defaultChecked
          onChange={(e) => this.getSwitchAnimation(e.target.value as Position)}
          name="map-switch"
          id="left"
          type="radio"
          value="left"
        />
        <label
          className={`left-label ${
            this.state.switchPosition === "left" && "black-font"
          }`}
          htmlFor="left"
        >
          <h4>{labels.left.title}</h4>
        </label>

        <input
          onChange={(e) => this.getSwitchAnimation(e.target.value as Position)}
          name="map-switch"
          id="center"
          type="radio"
          value="center"
        />
        <label
          className={`center-label ${
            this.state.switchPosition === "center" && "black-font"
          }`}
          htmlFor="center"
        >
          <h4>{labels.center.title}</h4>
        </label>

        <input
          onChange={(e) => this.getSwitchAnimation(e.target.value as Position)}
          name="map-switch"
          id="right"
          type="radio"
          value="right"
        />
        <label
          className={`right-label ${
            this.state.switchPosition === "right" && "black-font"
          }`}
          htmlFor="right"
        >
          <h4>{labels.right.title}</h4>
        </label>
      </div>
    );
  }
}

export default TripleToggleSwitch;
