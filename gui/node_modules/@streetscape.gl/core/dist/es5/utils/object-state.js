"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setObjectState = setObjectState;

var _parser = require("@xviz/parser");

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Toggle a specific state of objects
function setObjectState(objectStates, _ref) {
  var stateName = _ref.stateName,
      id = _ref.id,
      value = _ref.value;

  var state = _objectSpread({}, objectStates[stateName]);

  var xvizObject = _parser.XVIZObject.get(id);

  if (xvizObject) {
    xvizObject._setState(stateName, value);
  }

  if (value) {
    state[id] = value;
  } else {
    delete state[id];
  }

  return _objectSpread({}, objectStates, _defineProperty({}, stateName, state));
}
//# sourceMappingURL=object-state.js.map