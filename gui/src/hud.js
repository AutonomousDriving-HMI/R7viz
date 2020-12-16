import React from 'react';
import { MeterWidget, TurnSignalWidget, TrafficLightWidget} from 'streetscape.gl';
import { METER_WIDGET_STYLE, TURN_SIGNAL_WIDGET_STYLE } from './constants';

export default class HUD extends React.PureComponent {
    /*a 태그(Tag)는 문서를 링크 시키기 위해 사용하는 태그(Tag)이다.*/
    /*href : 연결할 주소를 지정 한다.
          target : 링크를 클릭 할 때 창을 어떻게 열지 설정 한다.
          title : 해당 링크에 마우스 커서를 올릴때 도움말 설명을 설정 한다.*/

    render() {
        const { log} = this.props;

        return (
            <div id ="hud">
                <TurnSignalWidget
                    log={log}
                    style={TURN_SIGNAL_WIDGET_STYLE}
                    streamName="/vehicle/turn_signal"
                />
                <hr />
                <TrafficLightWidget
                    log={log}
                    style={TURN_SIGNAL_WIDGET_STYLE}
                    streamName="/vehicle/traffic_light"
                />
                <hr />
                <div id="hud-meterwidget">
                <hr />
                <MeterWidget
                    log={log}
                    style={METER_WIDGET_STYLE}
                    streamName="/vehicle/status/acceleration"
                    units="Acceleration"
                    min={-4}
                    max={4}
                />
                <hr />
                <MeterWidget
                    log={log}
                    style={METER_WIDGET_STYLE}
                    streamName="/vehicle/status/velocity"
                    units="Speed"
                    min={0}
                    max={20}
                />
                <hr />
                </div>
            </div>
        );
    }
}