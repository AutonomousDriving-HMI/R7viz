function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

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
import { evaluateStyle, withTheme } from '@streetscape.gl/monochrome';
import styled from '@emotion/styled';
import connectToLog from '../connect';
const WrapperComponent = styled.div(props => _objectSpread({}, props.theme.__reset__, {
  padding: props.theme.spacingSmall,
  display: 'inline-block'
}, evaluateStyle(props.userStyle, props)));

class BaseWidget extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      streams: this._extractStreams(props)
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.streamNames !== this.props.streamNames || nextProps.streamMetadata !== this.props.streamMetadata || nextProps.frame !== this.props.frame) {
      this.setState({
        streams: this._extractStreams(nextProps)
      });
    }
  }

  _extractStreams({
    streamNames,
    streamMetadata,
    frame
  }) {
    const result = {};

    for (const key in streamNames) {
      const streamName = streamNames[key];

      if (streamName) {
        result[key] = _objectSpread({}, streamMetadata && streamMetadata[streamName], {
          data: frame && frame.streams[streamName]
        });
      }
    }

    return result;
  }

  render() {
    const _this$props = this.props,
          theme = _this$props.theme,
          style = _this$props.style,
          children = _this$props.children;
    const streams = this.state.streams;
    return React.createElement(WrapperComponent, {
      theme: theme,
      userStyle: style.wrapper
    }, children({
      theme,
      streams
    }));
  }

}

_defineProperty(BaseWidget, "propTypes", {
  style: PropTypes.object,
  streamNames: PropTypes.object.isRequired,
  children: PropTypes.func.isRequired,
  // From connected log
  streamMetadata: PropTypes.object,
  frame: PropTypes.object
});

_defineProperty(BaseWidget, "defaultProps", {
  style: {}
});

const getLogState = (log, {
  streamName
}) => {
  const metadata = log.getMetadata();
  return {
    streamMetadata: metadata && metadata.streams,
    frame: log.getCurrentFrame()
  };
};

export default connectToLog({
  getLogState,
  Component: withTheme(BaseWidget)
});
//# sourceMappingURL=base-widget.js.map