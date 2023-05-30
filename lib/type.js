"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Type;
var _jsonPtr = require("json-ptr");
var _error = require("./error.js");
var _calc = _interopRequireDefault(require("./calc.js"));
var _oneOfType = _interopRequireDefault(require("./one-of-type.js"));
var _baseType = _interopRequireDefault(require("./base-type.js"));
var _roleType = _interopRequireDefault(require("./role-type.js"));
var _templateType = _interopRequireDefault(require("./template-type.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); } /*
                                                                                                                                                                                                                                                                                                                                                  *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                                                                                                                                                                                  *   All rights reserved.
                                                                                                                                                                                                                                                                                                                                                  */
function Type(type) {
  var location = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var dictionary = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  dictionary = dictionary || (location ? location.dictionary : null);
  if (typeof type === 'string') {
    return new _baseType["default"](type, dictionary);
  }
  if (typeof type === 'function') {
    return Type((0, _calc["default"])(type, location.context), location, dictionary);
  }
  if (type === undefined || type === null) {
    return new _baseType["default"](undefined);
  }
  if (type.isTypeObject) {
    return type;
  } else if (type !== null && _typeof(type) === 'object') {
    switch (type.$type) {
      case 'base type':
        return new _baseType["default"](type.type, dictionary);
      //use a type specified in a path (like property) from this object
      case 'copy type':
        var pathText = '/' + (type.path || '').replace(/\./g, '/');
        var path = new _jsonPtr.JsonPointer(pathText);
        var result = path.get(location.contextNoSearch);
        var baseType = typeof result === 'string' ? result : Type(result, location);
        return new _baseType["default"](baseType, dictionary);
      case 'template type':
        return new _templateType["default"](type.template, location, dictionary);
      case 'role type':
        return new _roleType["default"](Type(type.type, location, dictionary), type.role, dictionary);
      case 'specialized type':
        return new _baseType["default"]("".concat(Type(type.generic, location, dictionary).toString(), "<").concat(specializedValue(type.specialized, location), ">").concat(type.collection ? '*' : ''), dictionary);
      case 'one of':
        return new _oneOfType["default"](type.types.map(function (type) {
          return Type(type, location, dictionary);
        }), dictionary, type.collection);
      default:
        console.error('Using an unknown type', type.$type, type);
        throw new Error(_error.IllegalType);
    }
  }
}
function specializedValue(val, location) {
  //currently only type specialized values are supported (not values)
  return Type(val, location, dictionary).toString();
}