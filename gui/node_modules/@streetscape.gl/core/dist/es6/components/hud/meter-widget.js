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
import { evaluateStyle } from '@streetscape.gl/monochrome';
import styled from '@emotion/styled';
import { clamp } from 'math.gl';
import BaseWidget from './base-widget';
const GuageArc = styled.path(props => _objectSpread({
  stroke: props.theme.controlColorDisabled,
  strokeCap: 'round'
}, evaluateStyle(props.userStyle, props)));
const ZeroMarker = styled.circle(props => _objectSpread({
  fill: props.theme.textColorPrimary
}, evaluateStyle(props.userStyle, props)));
const CmdMarker = styled.path(props => _objectSpread({
  fill: props.theme.controlColorActive
}, evaluateStyle(props.userStyle, props)));
const GuageHand = styled.line(props => _objectSpread({
  stroke: props.theme.textColorPrimary,
  strokeCap: 'round',
  strokeWidth: 2
}, evaluateStyle(props.userStyle, props)));
const CmdValue = styled.div(props => _objectSpread({
  textAlign: 'right',
  flex: 1,
  padding: props.theme.spacingTiny,
  borderRightStyle: 'solid',
  borderRightWidth: 1,
  borderRightColor: props.theme.controlColorDisabled,
  color: props.warning ? props.theme.textColorWarning : props.theme.textColorPrimary,
  fontSize: props.theme.fontSize * 2,
  lineHeight: '1em'
}, evaluateStyle(props.userStyle, props)));
const MsrValue = styled.div(props => _objectSpread({
  textAlign: props.isOnlyValue ? 'center' : 'left',
  flex: 1,
  padding: props.theme.spacingTiny,
  fontSize: props.theme.fontSize * 2,
  color: props.warning ? props.theme.textColorWarning : props.theme.textColorPrimary,
  lineHeight: '1em'
}, evaluateStyle(props.userStyle, props)));
const LabelComponent = styled.div(props => _objectSpread({
  fontSize: props.theme.fontSize,
  color: props.theme.textColorSecondary,
  lineHeight: '1em'
}, evaluateStyle(props.userStyle, props)));
const UnitsComponent = styled.div(props => _objectSpread({
  textAlign: 'center',
  fontSize: props.theme.fontSize * 0.9,
  color: props.theme.textColorSecondary
}, evaluateStyle(props.userStyle, props)));
const Warning = styled.span(props => _objectSpread({
  position: 'absolute',
  marginLeft: props.theme.spacingTiny,
  fontSize: props.theme.fontSize * 0.9,
  lineHeight: '1em',
  padding: props.theme.spacingTiny,
  borderRadius: 2,
  background: props.theme.warning400,
  color: props.theme.textColorInvert
}, evaluateStyle(props.userStyle, props)));

function getTransform(centerX, centerY, angle) {
  return `translate(${centerX} ${centerY}) rotate(${angle}) translate(${-centerX} ${-centerY})`;
}

function formatValue(value, precision = 3, transformValue) {
  if (!Number.isFinite(value)) {
    return '';
  }

  value = transformValue(value);
  const digits = value ? Math.max(1, Math.floor(Math.log10(Math.abs(value)) + 1)) : 1;
  return `${value.toFixed(Math.max(0, precision - digits))}`;
}

export default class MeterWidget extends PureComponent {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "_render", ({
      theme,
      streams
    }) => React.createElement("div", null, this._renderGauge(streams.cmd, streams.msr, theme), this._renderMetric(streams.cmd, streams.msr, theme)));
  }

  _renderGauge(cmdData, msrData, theme) {
    const _this$props = this.props,
          min = _this$props.min,
          max = _this$props.max,
          transformValue = _this$props.transformValue,
          style = _this$props.style;
    const _style$arcRadius = style.arcRadius,
          r = _style$arcRadius === void 0 ? 50 : _style$arcRadius,
          _style$arcWidth = style.arcWidth,
          w = _style$arcWidth === void 0 ? 8 : _style$arcWidth;
    const padding = 8;

    if (r <= w / 2) {
      return null;
    }

    const cmdValue = transformValue(cmdData && cmdData.data && cmdData.data.variable || 0);
    const msrValue = transformValue(msrData.data && msrData.data.variable || 0);
    const msr = clamp((msrValue - min) / (max - min), 0, 1);
    const cmd = clamp((cmdValue - min) / (max - min), 0, 1);
    const zero = clamp((0 - min) / (max - min), 0, 1);
    const msrTransform = getTransform(r + padding, r + padding, msr * 180 - 90);
    const cmdTransform = getTransform(r + padding, r + padding, cmd * 180 - 90);
    const zeroTransform = getTransform(r + padding, r + padding, zero * 180 - 90);
    return React.createElement("svg", {
      width: (r + padding) * 2,
      height: r + padding * 2
    }, React.createElement(GuageArc, {
      d: `M ${padding + w / 2} ${r + padding} a ${r - w / 2} ${r - w / 2} 1 1 1 ${r * 2 - w} 0`,
      fill: "none",
      strokeWidth: w,
      theme: theme,
      userStyle: style.arc
    }), React.createElement("g", {
      transform: zeroTransform
    }, React.createElement(ZeroMarker, {
      cx: r + padding,
      cy: padding - 4,
      r: 2,
      theme: theme,
      userStyle: style.zeroMarker
    })), cmdData && React.createElement("g", {
      transform: cmdTransform
    }, React.createElement(CmdMarker, {
      transform: `translate(${r + padding} ${padding})`,
      d: `M0,${w} L${-w / 2},0 L${w / 2},0z`,
      theme: theme,
      userStyle: style.cmdMarker
    })), msrData && React.createElement("g", {
      transform: msrTransform
    }, React.createElement(GuageHand, {
      x1: r + padding,
      y1: r + padding,
      x2: r + padding,
      y2: padding + w + 4,
      theme: theme,
      userStyle: style.hand
    })));
  }

  _renderMetric(cmdData, msrData, theme) {
    const _this$props2 = this.props,
          label = _this$props2.label,
          _this$props2$units = _this$props2.units,
          units = _this$props2$units === void 0 ? msrData.units : _this$props2$units,
          transformValue = _this$props2.transformValue,
          precision = _this$props2.precision,
          getWarning = _this$props2.getWarning,
          style = _this$props2.style;
    const cmdValue = cmdData && cmdData.data && cmdData.data.variable;
    const msrValue = msrData.data && msrData.data.variable;
    const cmdWarning = getWarning(cmdValue);
    const msrWarning = getWarning(msrValue);
    return React.createElement("div", null, React.createElement("div", {
      style: {
        display: 'flex'
      }
    }, cmdData && React.createElement(CmdValue, {
      theme: theme,
      warning: cmdWarning,
      userStyle: style.cmdValue
    }, React.createElement(LabelComponent, {
      theme: theme,
      warning: cmdWarning,
      userStyle: style.label
    }, "Cmd."), React.createElement("div", null, formatValue(cmdValue, precision, transformValue) || '-')), React.createElement(MsrValue, {
      theme: theme,
      warning: msrWarning,
      isOnlyValue: !cmdData,
      userStyle: style.msrValue
    }, React.createElement(LabelComponent, {
      theme: theme,
      warning: msrWarning,
      userStyle: style.label
    }, label), React.createElement("div", null, formatValue(msrValue, precision, transformValue) || '-'))), React.createElement(UnitsComponent, {
      theme: theme,
      userStyle: style.units
    }, units, (cmdWarning || msrWarning) && React.createElement(Warning, {
      theme: theme,
      userStyle: style.warning
    }, cmdWarning || msrWarning)));
  }

  render() {
    const _this$props3 = this.props,
          log = _this$props3.log,
          style = _this$props3.style,
          cmdStreamName = _this$props3.cmdStreamName,
          streamName = _this$props3.streamName;
    return React.createElement(BaseWidget, {
      log: log,
      style: style,
      streamNames: {
        cmd: cmdStreamName,
        msr: streamName
      }
    }, this._render);
  }

}

_defineProperty(MeterWidget, "propTypes", {
  log: PropTypes.object.isRequired,
  style: PropTypes.object,
  precision: PropTypes.number,
  units: PropTypes.string,
  cmdStreamName: PropTypes.string,
  streamName: PropTypes.string.isRequired,
  label: PropTypes.string,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  transformValue: PropTypes.func,
  getWarning: PropTypes.func
});

_defineProperty(MeterWidget, "defaultProps", {
  precision: 3,
  style: {},
  transformValue: x => x,
  getWarning: _ => null
});
//# sourceMappingURL=meter-widget.js.map