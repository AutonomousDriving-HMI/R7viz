function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

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
import XVIZLoaderInterface from '../loaders/xviz-loader-interface';
export default function connectToLog({
  getLogState,
  Component
}) {
  class WrappedComponent extends PureComponent {
    constructor(...args) {
      super(...args);

      _defineProperty(this, "state", {
        logVersion: -1
      });

      _defineProperty(this, "_update", logVersion => {
        this.setState({
          logVersion
        });
      });
    }

    componentDidMount() {
      const log = this.props.log;

      if (log) {
        log.subscribe(this._update);
      }
    }

    componentWillReceiveProps(nextProps) {
      const log = this.props.log;
      const nextLog = nextProps.log;

      if (log !== nextLog) {
        if (log) {
          log.unsubscribe(this._update);
        }

        if (nextLog) {
          nextLog.subscribe(this._update);
        }
      }
    }

    componentWillUnmount() {
      const log = this.props.log;

      if (log) {
        log.unsubscribe(this._update);
      }
    }

    render() {
      const _this$props = this.props,
            log = _this$props.log,
            otherProps = _objectWithoutProperties(_this$props, ["log"]);

      const logState = log && getLogState(log, otherProps);
      return React.createElement(Component, _extends({}, otherProps, logState, {
        log: log
      }));
    }

  }

  _defineProperty(WrappedComponent, "propTypes", {
    log: PropTypes.instanceOf(XVIZLoaderInterface)
  });

  return WrappedComponent;
}
//# sourceMappingURL=connect.js.map