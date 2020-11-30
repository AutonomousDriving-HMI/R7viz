import React, {PureComponent} from 'react';
import {_BaseWidget as BaseWidget, MeterWidget} from 'streetscape.gl';

const wheelImageLocation = "../assets/wheel.png";

const WHEEL_WIDGET_STYLE = {
    arcRadius: 0,
    msrValue: {
      fontSize: 18,
      fontWeight: 700,
      paddingTop: 0
    },
    units: {
      fontSize: 14
    }
};


export default class SteeringInfo extends PureComponent {

    _renderSteeringWheel({streams}) {
        var angle = (streams.state.data && streams.state.data.variable) || 'unknown';
        var rot = {
          transform: `rotate(${angle}deg)`
        };
        return (
          <div style={rot}>
            {<img src={wheelImageLocation} alt="Wheel" className="wheel-image" />}
          </div>
        );
    }

    render() {
        return (
            <div style={{display: 'flex', flexDirection: 'row', justifyContent:'space-between', alignItems:'center', paddingBottom: '5px', paddingTop:'10px'}}>
                <div style={{paddingLeft: '18px'}}>
                    <BaseWidget log={this.props.log} streamNames={{state: '/vehicle/wheel_angle'}}>
                        {this._renderSteeringWheel}
                    </BaseWidget>
                </div>
                <div style={{display:'flex', flexDirection:'column', paddingRight: '50px'}}>
                    <MeterWidget
                        log={this.props.log}
                        style={WHEEL_WIDGET_STYLE}
                        streamName="/vehicle/wheel_angle"
                        units="Steering Angle"
                        min={-180}
                        max={180}
                    />
                    <MeterWidget
                        log={this.props.log}
                        style={WHEEL_WIDGET_STYLE}
                        streamName="/vehicle/turn_count"
                        units="Turn Count"
                        min={-3}
                        max={3}
                    />
                </div>
            </div>
        );
    }

}