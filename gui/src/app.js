// This file is modified based on the get-started example 
// from github.com/uber/streetscape.gl
// The following is the original license statement:
//
// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* global document, console */
/* eslint-disable no-console, no-unused-vars, no-undef */
import React, { PureComponent } from 'react';
import { render } from 'react-dom';
import { setXVIZConfig } from '@xviz/parser';
import {
  XVIZLiveLoader,
  LogViewer,
  VIEW_MODE,
  XVIZPanel,
  StreamSettingsPanel,
  MeterWidget,
  TrafficLightWidget,
  TurnSignalWidget,
} from 'streetscape.gl';
import { ThemeProvider, Form, Button } from '@streetscape.gl/monochrome';

import ROSLIB from 'roslib';
import { XVIZ_CONFIG, APP_SETTINGS, CONFIG_SETTINGS, XVIZ_STYLE, CAR } from './constants';

/*custom import*/
//import imgstyles from './image.css';
import { UI_THEME } from './custom_styles'
import './stylesheets/main.scss';
//import "./index.scss";

setXVIZConfig(XVIZ_CONFIG);

let params = (new URL(document.location)).searchParams;
let server = params.get('server');
let mapboxToken = params.get('maptoken');
let mapStyleRef = params.get('mapstyle');
if (!server) {
  server = "localhost";
}
if (!mapboxToken) {
  mapboxToken = "pk.eyJ1IjoiZ3dhbmdyeXVsIiwiYSI6ImNrZmRwcnMzMjFyeDQyeXFneXE3aHBid3kifQ.urnQG35_4DuT7D5lF5sBHA";
}
if (!mapStyleRef) {
  mapStyleRef = 'mapbox://styles/gwangryul/ckgkh9m6v0om719o4p1n3lba9';
}

// get camera image directly from rosbridge instead of xviz
// for better performance
const rosBridgeClient = new ROSLIB.Ros({
  url: 'ws://' + server + ':9090'
});
const roslistener = new ROSLIB.Topic({
  ros: rosBridgeClient,
  name: '/blackfly/image_color/compressed'
  //name : '/usb_cam/image_raw'
});
roslistener.subscribe(function (message) {
  document.getElementById("camera-image").src = "data:image/jpg;base64," + message.data;
});

const exampleLog = new XVIZLiveLoader({
  logGuid: 'mock',
  bufferLength: 4,
  serverConfig: {
    defaultLogLength: 5,
    serverUrl: 'ws://' + server + ':8081'
  },
  worker: true,
  maxConcurrency: 2
});

/**Wheel_Widget_Style, Meter_Widget_Style, Turn_Signal_Widget_Style
 * style에 대한 정의부분 
 * 나중에 다른파일로 만들자
 */
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
const METER_WIDGET_STYLE = {
  arcRadius: 42,
  msrValue: {
    fontSize: 18,
    fontWeight: 700,
    paddingTop: 3
  },
  units: {
    fontSize: 14
  }
};
const TURN_SIGNAL_WIDGET_STYLE = {
  wrapper: {
    padding: 0
  },
  arrow: {
    height: 16
  }
};
const AUTONOMY_STATE = {
  autonomous: '#47B275',
  manual: '#5B91F4',
  error: '#F25138',
  unknown: '#E2E2E2'
};
/****************widget end***************** */


class Example extends PureComponent {
  state = {
    log: exampleLog.on('error', console.error),
    settings: {
      viewMode: 'PERSPECTIVE'
    },
    serverURL: server,
    mapToken: mapboxToken,
    mapStyle: mapStyleRef
  };

  componentDidMount() {
    this.state.log.connect();
  }

  _onSettingsChange = changedSettings => {
    this.setState({
      settings: { ...this.state.settings, ...changedSettings }
    });
  };

  _onConfigChange = e => {
    this.setState(e);
  };

  _onButtonClick = () => {
    console.log("button click");
    this.state.log.close();
    let currentPage = window.location.href.split("?")[0];
    console.log(currentPage);
    let newPage = currentPage + "?server=" + this.state.serverURL;
    if (this.state.mapToken) {
      newPage = newPage + "&maptoken=" + this.state.mapToken;
    }
    if (this.state.mapStyle) {
      newPage = newPage + "&mapstyle=" + this.state.mapStyle;
    }
    window.location.replace(newPage);
  }

  render() {
    const { log, settings, mapStyle, mapToken } = this.state;

    return (
      <div id="container">
        <div id="control-panel">
          <div>
            <div id="logo">
              {/*a 태그(Tag)는 문서를 링크 시키기 위해 사용하는 태그(Tag)이다.*/}
              {/*href : 연결할 주소를 지정 한다.
                  target : 링크를 클릭 할 때 창을 어떻게 열지 설정 한다.
                  title : 해당 링크에 마우스 커서를 올릴때 도움말 설명을 설정 한다.*/}
              <a href="https://www.dgist.ac.kr/">
                <img src="./assets/logo.jpg" alt="Digst Logo" />
              </a>
            </div>
          </div>
          <XVIZPanel log={log} name="Metrics" />
          <hr />
          <img src="" id="camera-image" width="100%" />
          <hr />
          <Form
            data={APP_SETTINGS}
            values={this.state.settings}
            onChange={this._onSettingsChange}
          />
          <hr />
          <StreamSettingsPanel
            log={log}
            onSettingsChange={this._onStreamSettingChange}
          />
          <hr />
          <Form
            data={CONFIG_SETTINGS}
            values={this.state}
            onChange={this._onConfigChange}
          />
          <hr />
          <Button onClick={this._onButtonClick}>
            Re-Connect
          </Button>
        </div>
        <div id="log-panel">
          <div id="map-view">
            <LogViewer
              log={log}
              mapboxApiAccessToken={mapToken}
              mapStyle={mapStyle}
              car={CAR}
              xvizStyles={XVIZ_STYLE}
              viewMode={VIEW_MODE[settings.viewMode]}
            />
            <div id="hud">
              {/*
                add TurnSignalWidget, TrafficLightWidget, MeterWidget
                **주의 style={METER_WIDGET_STYLE}를 제거함 
                */}
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
            </div>
            <div id="hud-meterwidget">
              <MeterWidget
                log={log}
                style={METER_WIDGET_STYLE}
                streamName="/vehicle/acceleration"
                units="Acceleration"
                min={-4}
                max={4}
              />
              <hr />
              <MeterWidget
                log={log}
                style={METER_WIDGET_STYLE}
                streamName="/vehicle/velocity"
                units="Speed"
                min={0}
                max={20}
              />
              <hr />
            </div>


          </div>
        </div>
      </div>
    );
  }
}
render(
  <ThemeProvider theme={UI_THEME}>
    <Example />
  </ThemeProvider>, document.getElementById('app')
);