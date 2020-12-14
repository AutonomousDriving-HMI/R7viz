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
  _XVIZMetric as XVIZMetric,
  XVIZLiveLoader,
  VIEW_MODE,
  XVIZPanel,
  StreamSettingsPanel,
  MeterWidget,
  TrafficLightWidget,
  TurnSignalWidget,
  LogViewerStats,
  XVIZWorkerFarmStatus,
  XVIZWorkersMonitor,
  XVIZWorkersStatus
} from 'streetscape.gl';
import { ThemeProvider, Form, Button } from '@streetscape.gl/monochrome';
import { XVIZ_CONFIG, APP_SETTINGS, CONFIG_SETTINGS, XVIZ_STYLE, CAR, STYLES } from './constants';
import ControPanel from './control-Panel';
import { UI_THEME } from './custom_styles'
import MapView from './mapview';
import HUD from './hud';
import './stylesheets/main.scss';
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
  //mapStyleRef = 'mapbox://styles/gwangryul/ckie4jqte3azb19nzg5coypmd';  //satellite map
  //mapStyleRef = 'mapbox://styles/gwangryul/ckgkh9m6v0om719o4p1n3lba9';  //default map
  mapStyleRef = 'mapbox://styles/gwangryul/ckie4iw233aw219pcgdxl213q';    //navigation map
}

const exampleLog = new XVIZLiveLoader({
  logGuid: 'mock',
  bufferLength: 8,
  serverConfig: {
    defaultLogLength: 5,
    serverUrl: 'ws://' + server + ':8081'
  },
  worker: true,
  maxConcurrency: 3
});

class Example extends PureComponent {
  state = {
    //log: exampleLog.on('error', console.error),
    log: exampleLog,
    settings: {
      viewMode: 'PERSPECTIVE',
      showDebug: true
    },
    serverURL: server,
    mapToken: mapboxToken,
    mapStyle: mapStyleRef,

    /**Debug 하기 위한 state */
    panels: [],
    // LogViewer perf stats
    statsSnapshot: {},
    // XVIZ Parser perf stats
    backlog: 'NA',
    dropped: 'NA',
    workers: {}
  };

  componentDidMount() {
    /**토론토 대학에서 정의한 componentDidmount */
    //this.state.log.connect();

    /**디버그를 위해서 다시 정의한 componentDidmount */
    const { log } = this.state;
    log
      .on('ready', () => {
        const metadata = log.getMetadata();
        this.setState({
          panels: Object.keys((metadata && metadata.ui_config) || {})
        });
      })
      .on('error', console.error)
      .connect();

    this.xvizWorkerMonitor = new XVIZWorkersMonitor({
      numWorkers: log.options.maxConcurrency,
      reportCallback: ({ backlog, dropped, workers }) => {
        this.setState({ backlog, dropped, workers });
      }
    });
    log._debug = (event, payload) => {
      if (event === 'parse_message') {
        this.xvizWorkerMonitor.update(payload);
      }
    };
    this.xvizWorkerMonitor.start();
  }
  componentWillUnmount() {
    if (this.xvizWorkerMonitor) {
      this.xvizWorkerMonitor.stop();
    }
  }

  _renderPerf = () => {
    const { statsSnapshot, backlog, dropped, workers } = this.state;
    return this.state.settings.showDebug ? (
      <div>
        <hr />
        <XVIZWorkerFarmStatus backlog={backlog} dropped={dropped} />
        <XVIZWorkersStatus workers={workers} />
        <hr />
        <LogViewerStats statsSnapshot={statsSnapshot} />
      </div>
    ) : null;
  };

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
    const { log, settings, mapStyle, mapToken, panels } = this.state;
    console.log(log);
    return (
      <div id="container">
        <div id="control-panel">
          {/*this._renderPerf()*/}
          {
            <ControPanel
              log={log}
              state={this.state}
              settings={this.state.settings}
              onSettingsChange={this._onStreamSettingChange}
              onChange={this._onSettingsChange}
              onClick={this._onButtonClick}
            />
          }
        </div>
        <div id="log-panel">
          <div id="map-view">
            {<MapView
              log={log}
              settings={settings}
              onSettingsChange={this._onSettingsChange}
              mapToken={mapToken}
              mapStyle={mapStyle}
              debug={payload => this.setState({ statsSnapshot: payload })}
            />
            }
            <div id="hud">
              {<HUD
                log={log}
              />}
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