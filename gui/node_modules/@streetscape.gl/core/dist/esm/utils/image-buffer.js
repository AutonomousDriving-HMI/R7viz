function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

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

/* global createImageBitmap, Blob, Image, URL  */
import { getXVIZConfig } from '@xviz/parser';
/* Loads the image data from a frame of a XVIZ image stream */

function loadImage(frame) {
  var blob = new Blob([frame.imageData], {
    type: frame.imageType
  });

  if (typeof createImageBitmap !== 'undefined') {
    return createImageBitmap(blob);
  }

  return new Promise(function (resolve, reject) {
    try {
      var image = new Image();

      image.onload = function () {
        return resolve(image);
      };

      image.onerror = reject;
      image.src = URL.createObjectURL(blob);
    } catch (error) {
      reject(error);
    }
  });
}
/* Disposes of all graphical resources associated with the image */


function deleteImage(image) {
  if (image.close) {
    // Is ImageBitmap
    image.close();
  }
}
/* Manages loaded images for a XVIZ image stream */


var ImageBuffer =
/*#__PURE__*/
function () {
  function ImageBuffer(size) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$imageLoader = _ref.imageLoader,
        imageLoader = _ref$imageLoader === void 0 ? loadImage : _ref$imageLoader,
        _ref$imageDeleter = _ref.imageDeleter,
        imageDeleter = _ref$imageDeleter === void 0 ? deleteImage : _ref$imageDeleter;

    _classCallCheck(this, ImageBuffer);

    this.size = size;
    this.imageLoader = imageLoader;
    this.imageDeleter = imageDeleter;
    this.buffer = new Map();
  }

  _createClass(ImageBuffer, [{
    key: "get",
    value: function get(frame) {
      return this.buffer.get(frame);
    }
  }, {
    key: "set",
    value: function set(allFrames, currentTime) {
      var _this = this;

      var buffer = this.buffer;

      var _this$_getCurrentFram = this._getCurrentFrames(allFrames, currentTime),
          currentFrame = _this$_getCurrentFram.currentFrame,
          bufferedFrames = _this$_getCurrentFram.bufferedFrames; // Remove images outside of the buffer range


      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = buffer.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var frame = _step.value;

          if (bufferedFrames.length === 0 || frame.time < bufferedFrames[0].time || frame.time > bufferedFrames[bufferedFrames.length - 1].time) {
            this.imageDeleter(buffer.get(frame));
            buffer.delete(frame);
          }
        } // Load images for frames in the buffer

      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      bufferedFrames.forEach(function (frame) {
        if (!buffer.has(frame)) {
          var data = {};
          data.promise = _this.imageLoader(frame.images[0]).then(function (image) {
            data.image = image;
            return image;
          });
          buffer.set(frame, data);
        }
      });
      return currentFrame;
    }
  }, {
    key: "_getCurrentFrames",
    value: function _getCurrentFrames(allFrames, currentTime) {
      var currentFrame = null;
      var currentFrameIndex = -1;
      var bestDelta = getXVIZConfig().TIME_WINDOW; // Find the frame closest to the current timestamp

      allFrames.forEach(function (frame, i) {
        var delta = currentTime - frame.time;

        if (delta >= 0 && delta < bestDelta) {
          bestDelta = delta;
          currentFrame = frame;
          currentFrameIndex = i;
        }
      }); // Load adjacent frames into the buffer

      var bufferedFrames = currentFrameIndex >= 0 ? allFrames.slice(Math.max(0, currentFrameIndex - this.size), currentFrameIndex + this.size) : [];
      return {
        currentFrame: currentFrame,
        bufferedFrames: bufferedFrames
      };
    }
  }]);

  return ImageBuffer;
}();

export { ImageBuffer as default };
//# sourceMappingURL=image-buffer.js.map