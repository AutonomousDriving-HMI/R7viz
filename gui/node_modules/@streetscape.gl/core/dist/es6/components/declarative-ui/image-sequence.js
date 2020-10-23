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
// @flow
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { AutoSizer } from '@streetscape.gl/monochrome';
import ImageBuffer from '../../utils/image-buffer';
/* Component that renders image sequence as video */

export default class ImageSequence extends PureComponent {
  constructor(props) {
    super(props);

    _defineProperty(this, "_onCanvasLoad", ref => {
      this._canvas = ref;

      if (ref) {
        this._context = ref.getContext('2d');
      }
    });

    _defineProperty(this, "_onCanvasResize", ({
      width,
      height
    }) => {
      this.setState({
        width,
        height
      });
    });

    _defineProperty(this, "_getVideoFilterCSS", () => {
      const _this$props = this.props,
            brightness = _this$props.brightness,
            contrast = _this$props.contrast,
            saturate = _this$props.saturate,
            invert = _this$props.invert;
      const filter = `\
      ${Number.isFinite(brightness) ? `brightness(${brightness}) ` : ''}\
      ${Number.isFinite(saturate) ? `saturate(${saturate}) ` : ''}\
      ${Number.isFinite(contrast) ? `contrast(${contrast}) ` : ''}\
      ${Number.isFinite(invert) ? `invert(${invert}) ` : ''}`;
      return filter;
    });

    _defineProperty(this, "_renderFrame", () => {
      if (!this._context) {
        return;
      }

      const width = this.state.width;
      let height = this.state.height;

      if (!width) {
        return;
      }

      this._context.filter = this._getVideoFilterCSS();
      const currentFrameImage = this.state.currentFrameImage;

      if (!currentFrameImage) {
        this._context.clearRect(0, 0, width, height);
      } else {
        if (this.props.height === 'auto') {
          height = width / currentFrameImage.width * currentFrameImage.height;
        }

        this._canvas.width = width;
        this._canvas.height = height;

        this._context.drawImage(currentFrameImage, 0, 0, width, height);
      }
    });

    this._buffer = new ImageBuffer(10);
    this.state = _objectSpread({
      width: 0,
      height: 0
    }, this._getCurrentFrames(props));
    this._canvas = null;
    this._context = null;
  }

  componentDidMount() {
    this._renderFrame();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(_objectSpread({}, this._getCurrentFrames(nextProps)));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.currentFrameImage !== prevState.currentFrameImage || this.state.width !== prevState.width || this.state.height !== prevState.height) {
      this._renderFrame();
    }
  }

  _getCurrentFrames(props) {
    const currentTime = props.currentTime,
          src = props.src;

    const currentFrame = this._buffer.set(src, currentTime);

    const currentFrameData = this._buffer.get(currentFrame);

    if (currentFrameData && !currentFrameData.image) {
      currentFrameData.promise.then(image => {
        if (this.state.currentFrame === currentFrame) {
          this.setState({
            currentFrameImage: image
          });
        }
      });
    }

    return {
      currentFrameImage: currentFrameData && currentFrameData.image,
      currentFrame
    };
  }

  render() {
    const _this$props2 = this.props,
          width = _this$props2.width,
          height = _this$props2.height;
    const style = {
      position: 'relative',
      background: '#000',
      lineHeight: 0,
      width,
      height
    };
    return React.createElement("div", {
      style: style
    }, React.createElement(AutoSizer, {
      onResize: this._onCanvasResize
    }), React.createElement("canvas", {
      ref: this._onCanvasLoad
    }));
  }

}

_defineProperty(ImageSequence, "propTypes", {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  // Array of frames to render, in shape of {timestamp, imageUrl}
  src: PropTypes.array,
  // eslint-disable-line
  // Filters
  brightness: PropTypes.number,
  contrast: PropTypes.number,
  saturate: PropTypes.number,
  invert: PropTypes.number,
  currentTime: PropTypes.number.isRequired
});

_defineProperty(ImageSequence, "defaultProps", {
  width: '100%',
  height: 'auto',
  // brightness: 1.0,
  // contrast: 1.0,
  // saturate: 1.0,
  // invert: 0.0,
  src: []
});
//# sourceMappingURL=image-sequence.js.map