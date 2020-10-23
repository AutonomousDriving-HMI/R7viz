function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

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
import React from 'react';
import { Popup } from 'react-map-gl';
import { withTheme, evaluateStyle } from '@streetscape.gl/monochrome';
import styled from '@emotion/styled'; // Copied from 'react-map-gl/src/utils/dynamic-position.js'

const ANCHOR_POSITION = {
  top: {
    x: 0.5,
    y: 0
  },
  'top-left': {
    x: 0,
    y: 0
  },
  'top-right': {
    x: 1,
    y: 0
  },
  bottom: {
    x: 0.5,
    y: 1
  },
  'bottom-left': {
    x: 0,
    y: 1
  },
  'bottom-right': {
    x: 1,
    y: 1
  },
  left: {
    x: 0,
    y: 0.5
  },
  right: {
    x: 1,
    y: 0.5
  }
};
const PopupTip = styled.div(props => _objectSpread({
  position: 'absolute',
  width: 4,
  height: 4,
  margin: -2,
  borderRadius: 2,
  background: props.color
}, evaluateStyle(props.userStyle, props)));
const PopupLine = styled.div(props => _objectSpread({
  position: 'absolute',
  borderLeftStyle: 'solid',
  borderLeftWidth: 1,
  borderColor: props.color
}, evaluateStyle(props.userStyle, props)));
const PopupContent = styled.div(props => _objectSpread({}, props.theme.__reset__, {
  background: props.color
}, evaluateStyle(props.userStyle, props)));
/* Like Popup but deal with z */

class PerspectivePopup extends Popup {
  _renderTip(positionType) {
    const anchorPosition = ANCHOR_POSITION[positionType];
    const _this$props = this.props,
          theme = _this$props.theme,
          style = _this$props.style;
    const _style$objectLabelTip = style.objectLabelTipSize,
          objectLabelTipSize = _style$objectLabelTip === void 0 ? 30 : _style$objectLabelTip,
          _style$objectLabelCol = style.objectLabelColor,
          objectLabelColor = _style$objectLabelCol === void 0 ? theme.background : _style$objectLabelCol;

    const styleProps = _objectSpread({}, this.props.styleProps, {
      theme,
      color: objectLabelColor,
      position: positionType
    });

    const tipSize = evaluateStyle(objectLabelTipSize, styleProps);
    const tipStyle = {
      width: tipSize,
      height: tipSize,
      position: 'relative',
      border: 'none'
    };
    const tipCircleStyle = {};
    const tipLineStyle = {};

    switch (anchorPosition.x) {
      case 0.5:
        tipCircleStyle.left = '50%';
        tipLineStyle.left = '50%';
        break;

      case 1:
        tipCircleStyle.right = 0;
        tipLineStyle.right = 0;
        break;

      case 0:
      default:
    }

    switch (anchorPosition.y) {
      case 0.5:
        tipLineStyle.width = '100%';
        tipCircleStyle.top = '50%';
        tipLineStyle.top = '50%';
        break;

      case 1:
        tipCircleStyle.bottom = 0;
        tipLineStyle.height = '100%';
        break;

      case 0:
      default:
        tipLineStyle.height = '100%';
    }

    return React.createElement("div", {
      key: "tip",
      className: "mapboxgl-popup-tip",
      style: tipStyle
    }, React.createElement(PopupTip, _extends({
      style: tipCircleStyle
    }, styleProps, {
      userStyle: style.objectLabelTip
    })), React.createElement(PopupLine, _extends({
      style: tipLineStyle
    }, styleProps, {
      userStyle: style.objectLabelLine
    })));
  }

  _renderContent() {
    const _this$props2 = this.props,
          theme = _this$props2.theme,
          styleProps = _this$props2.styleProps,
          style = _this$props2.style;
    return React.createElement(PopupContent, _extends({
      key: "content",
      ref: this._contentLoaded,
      className: "mapboxgl-popup-content",
      theme: theme
    }, styleProps, {
      color: style.objectLabelColor,
      userStyle: style.objectLabelBody
    }), this.props.children);
  }

}

export default withTheme(PerspectivePopup);
//# sourceMappingURL=perspective-popup.js.map