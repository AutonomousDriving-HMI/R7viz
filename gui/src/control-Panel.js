import React from 'react';
import {XVIZPanel, StreamSettingsPanel} from 'streetscape.gl';
import {Form, Button } from '@streetscape.gl/monochrome';
import SteeringInfo from './steering-info';
import DelayInfo from './delay_check-info'
import { XVIZ_CONFIG, APP_SETTINGS, CONFIG_SETTINGS} from './constants';

export default class ControlPanel extends React.PureComponent {

  /*a 태그(Tag)는 문서를 링크 시키기 위해 사용하는 태그(Tag)이다.*/
  /*href : 연결할 주소를 지정 한다.
        target : 링크를 클릭 할 때 창을 어떻게 열지 설정 한다.
        title : 해당 링크에 마우스 커서를 올릴때 도움말 설명을 설정 한다.*/

  render() {
    const {log, state, settings,  onSettingsChange, onChange, onClick} = this.props;

    return (
      <div>
        <div id="logo">
          <a href="https://www.dgist.ac.kr/">
            <img src="./assets/logo.jpg" alt="Digst Logo" />
          </a>
        </div>
        <hr />
        {/*<XVIZPanel log={log} name="Camera" />*/}
        {<img src="" id="camera-image" width="100%" />}
        <hr />
        <XVIZPanel
          log={log}
          name="Metrics"
        //style={XVIZ_PANEL_STYLE}
        />
        <hr />
        <DelayInfo log={log} state={state} />
        <hr />
        <SteeringInfo log={log} state={state} />
        <hr />
        <Form
          data={APP_SETTINGS}
          values={settings}
          onChange={onSettingsChange}
        />
        <hr />
        <StreamSettingsPanel
          log={log}
          onSettingsChange={this.props.onStreamSettingChange}
        />
        <hr />
        <Form
          data={CONFIG_SETTINGS}
          values={state}
          onChange={onChange}
        />
        <hr />
        <Button onClick={onClick}>
          Re-Connect
          </Button>
      </div>
    );
  }
}