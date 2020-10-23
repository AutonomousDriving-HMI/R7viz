function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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

/**
 * creates a test function from a filter
 * @param filter {string|object|array<string>|function}
 *   - string: a single stream name to be allowed
 *   - array: multiple stream names to be allowed
 *   - object: stream name to true|false map
 *   - function: custom callback that returns true|false from any stream name
 * @returns a normalized test function that returns true|false from any stream name
 */
export function normalizeStreamFilter(filter) {
  if (!filter) {
    // empty - always pass
    return function () {
      return true;
    };
  }

  if (Array.isArray(filter)) {
    return function (streamName) {
      return filter.includes(streamName);
    };
  }

  switch (_typeof(filter)) {
    case 'string':
      return function (streamName) {
        return streamName === filter;
      };

    case 'function':
      return filter;

    default:
      return function (streamName) {
        return filter[streamName];
      };
  }
}
//# sourceMappingURL=stream-utils.js.map