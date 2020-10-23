"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _core = require("@streetscape.gl/core");

Object.keys(_core).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _core[key];
    }
  });
});

var _layers = require("@streetscape.gl/layers");

Object.keys(_layers).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _layers[key];
    }
  });
});
//# sourceMappingURL=index.js.map