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
export default class XVIZContainer extends PureComponent {
  render() {
    const layout = this.props.layout;
    const layoutStyle = {
      display: 'flex',
      width: '100%'
    };
    const childStyle = {};

    switch (layout) {
      case 'vertical':
        layoutStyle.flexDirection = 'column';
        childStyle.flex = '0 0 auto';
        break;

      case 'horizontal':
        layoutStyle.flexDirection = 'row';
        childStyle.flex = '1 1 auto';
        break;

      default:
        // Unknown layout type
        return null;
    }

    return React.createElement("div", {
      className: "xviz-container",
      style: layoutStyle
    }, React.Children.map(this.props.children, child => React.createElement("div", {
      style: childStyle
    }, child)));
  }

}

_defineProperty(XVIZContainer, "propTypes", {
  layout: PropTypes.string
});

_defineProperty(XVIZContainer, "defaultProps", {
  layout: 'vertical'
});
//# sourceMappingURL=xviz-container.js.map