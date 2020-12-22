import React, {PureComponent} from 'react';
import {_BaseWidget as BaseWidget, MeterWidget} from 'streetscape.gl';

export default class DelayInfo extends PureComponent {

    render() {

        let frontupdatetime = this.props.state.frontupdatetime

        return (
            <div >
                <div style={{paddingLeft: '18px'}}>
                    <BaseWidget log={this.props.log} streamNames={{a: '/delay/millisecond'}}>
                    {({streams}) => (
                        <div>
                        {<h3>backend_time {(streams.a.data && streams.a.data.variable) || 'unknown'}</h3>}
                        {<h3>frontend_time {frontupdatetime}</h3>}
                        {<h3>elapse_time {frontupdatetime - (streams.a.data && streams.a.data.variable) || 'unknown'}</h3>}
                      </div>
                    )}
                    </BaseWidget>
                </div>
            </div>
        );
    }

}