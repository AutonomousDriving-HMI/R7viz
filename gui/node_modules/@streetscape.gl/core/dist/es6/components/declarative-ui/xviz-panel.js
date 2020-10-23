function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import XVIZContainer from './xviz-container';
import XVIZMetric from './xviz-metric';
import XVIZPlot from './xviz-plot';
import XVIZTable from './xviz-table';
import XVIZVideo from './xviz-video';
import connectToLog from '../connect'; // xviz type to component map

const DEFAULT_COMPONENTS = {
  container: XVIZContainer,
  metric: XVIZMetric,
  plot: XVIZPlot,
  video: XVIZVideo,
  table: XVIZTable,
  treetable: XVIZTable
};

class XVIZPanelComponent extends PureComponent {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "_renderItem", (item, i) => {
      const _this$props = this.props,
            components = _this$props.components,
            componentProps = _this$props.componentProps,
            log = _this$props.log,
            style = _this$props.style;
      const XVIZComponent = components[item.type] || DEFAULT_COMPONENTS[item.type];
      const customProps = componentProps[item.type];

      if (!XVIZComponent) {
        return null;
      }

      return React.createElement(XVIZComponent, _extends({
        key: i
      }, customProps, item, {
        log: log,
        style: style[item.type]
      }), item.children && item.children.map(this._renderItem));
    });
  }

  render() {
    const uiConfig = this.props.uiConfig;
    return uiConfig ? React.createElement("div", null, uiConfig.children && uiConfig.children.map(this._renderItem)) : null;
  }

}

_defineProperty(XVIZPanelComponent, "propTypes", {
  // User configuration
  name: PropTypes.string.isRequired,
  components: PropTypes.object,
  componentProps: PropTypes.object,
  style: PropTypes.object,
  // From connected log
  uiConfig: PropTypes.object
});

_defineProperty(XVIZPanelComponent, "defaultProps", {
  style: {},
  components: {},
  componentProps: {}
});

const getLogState = (log, ownProps) => {
  const metadata = log.getMetadata();
  return {
    uiConfig: metadata && metadata.ui_config && metadata.ui_config[ownProps.name]
  };
};

export default connectToLog({
  getLogState,
  Component: XVIZPanelComponent
});
//# sourceMappingURL=xviz-panel.js.map