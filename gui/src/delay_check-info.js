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

export default class DelayInfo extends PureComponent {

    _renderSteeringWheel({streams}) {
        var angle = (streams.state.data && streams.state.data.variable) || 'unknown';
        var elapse_time = new Date().getTime() - angle;
        return (
          <div>
            <h1>elapse_time {elapse_time}</h1>
          </div>
        );
    }

    render() {

        let dateTimeNow = new Date().getTime();


        return (
            <div >
                <div style={{ paddingLeft: '18px' }}>
                    <h1>{dateTimeNow}</h1>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '50px' }}>
                    <MeterWidget
                        log={this.props.log}
                        style={WHEEL_WIDGET_STYLE}
                        streamName="/delay/millisecond"
                        units="m/s"
                    />
                </div>
                <div style={{paddingLeft: '18px'}}>
                    <BaseWidget log={this.props.log} streamNames={{state: '/vehicle/status/steering_angle'}}>
                        {this._renderSteeringWheel}
                    </BaseWidget>
                </div>
            </div>
        );
    }

}