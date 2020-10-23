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
import { withTheme, evaluateStyle } from '@streetscape.gl/monochrome';
import styled from '@emotion/styled';
const TooltipContainer = styled.div(props => _objectSpread({}, props.theme.__reset__, {
  position: 'absolute',
  pointerEvents: 'none',
  margin: props.theme.spacingNormal,
  padding: props.theme.spacingNormal,
  maxWidth: 320,
  overflow: 'hidden',
  background: props.theme.background,
  color: props.theme.textColorPrimary,
  zIndex: 100001
}, evaluateStyle(props.userStyle, props)));
const KEY_BLACKLIST = new Set(['vertices', 'base', 'style', 'state', 'index', 'id', 'object_id']);

class HoverTooltip extends PureComponent {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "_renderContent", info => {
      const objectId = info.object.base && info.object.base.object_id;
      return [React.createElement("div", {
        key: "-stream-"
      }, React.createElement("div", null, React.createElement("b", null, "stream")), info.layer.props.streamName), objectId ? React.createElement("div", {
        key: "-id-"
      }, React.createElement("div", null, React.createElement("b", null, "id")), objectId) : null, React.createElement("hr", {
        key: "-separator-"
      })].concat(this._renderEntries(info.object.base), this._renderEntries(info.object));
    });
  }

  _renderEntries(object) {
    if (!object) {
      return null;
    }

    return Object.keys(object).filter(key => !KEY_BLACKLIST.has(key) && object[key] !== undefined).map(key => React.createElement("div", {
      key: key
    }, React.createElement("div", null, React.createElement("b", null, key)), String(object[key])));
  }

  render() {
    const _this$props = this.props,
          theme = _this$props.theme,
          info = _this$props.info,
          style = _this$props.style,
          _this$props$renderCon = _this$props.renderContent,
          renderContent = _this$props$renderCon === void 0 ? this._renderContent : _this$props$renderCon;
    return React.createElement(TooltipContainer, {
      theme: theme,
      style: {
        left: info.x,
        top: info.y
      },
      userStyle: style
    }, renderContent(info));
  }

}

export default withTheme(HoverTooltip);
//# sourceMappingURL=hover-tooltip.js.map