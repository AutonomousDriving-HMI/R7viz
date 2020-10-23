function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

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
var WrapperComponent = styled.div(function (props) {
  return _objectSpread({}, props.theme.__reset__, {
    padding: props.theme.spacingSmall,
    display: 'inline-block'
  }, evaluateStyle(props.userStyle, props));
});

var BaseWidget =
/*#__PURE__*/
function (_PureComponent) {
  _inherits(BaseWidget, _PureComponent);

  function BaseWidget(props) {
    var _this;

    _classCallCheck(this, BaseWidget);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BaseWidget).call(this, props));
    _this.state = {
      streams: _this._extractStreams(props)
    };
    return _this;
  }

  _createClass(BaseWidget, [{
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(nextProps) {
      if (nextProps.streamNames !== this.props.streamNames || nextProps.streamMetadata !== this.props.streamMetadata || nextProps.frame !== this.props.frame) {
        this.setState({
          streams: this._extractStreams(nextProps)
        });
      }
    }
  }, {
    key: "_extractStreams",
    value: function _extractStreams(_ref) {
      var streamNames = _ref.streamNames,
          streamMetadata = _ref.streamMetadata,
          frame = _ref.frame;
      var result = {};

      for (var key in streamNames) {
        var streamName = streamNames[key];

        if (streamName) {
          result[key] = _objectSpread({}, streamMetadata && streamMetadata[streamName], {
            data: frame && frame.streams[streamName]
          });
        }
      }

      return result;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          theme = _this$props.theme,
          style = _this$props.style,
          children = _this$props.children;
      var streams = this.state.streams;
      return React.createElement(WrapperComponent, {
        theme: theme,
        userStyle: style.wrapper
      }, children({
        theme: theme,
        streams: streams
      }));
    }
  }]);

  return BaseWidget;
}(PureComponent);

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

var getLogState = function getLogState(log, _ref2) {
  var streamName = _ref2.streamName;
  var metadata = log.getMetadata();
  return {
    streamMetadata: metadata && metadata.streams,
    frame: log.getCurrentFrame()
  };
};

export default connectToLog({
  getLogState: getLogState,
  Component: withTheme(BaseWidget)
});
//# sourceMappingURL=base-widget.js.map