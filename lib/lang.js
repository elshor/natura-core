"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _pluralize = _interopRequireDefault(require("pluralize"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
//default language is English

function _default() {
  return en;
}
var en = {
  singular: function singular(type) {
    return _pluralize["default"].singular(type);
  },
  plural: function plural(type) {
    return (0, _pluralize["default"])(type);
  },
  theType: function theType(type) {
    return 'the ' + type;
  },
  of: function of(property, object) {
    if (!object) {
      return property;
    } else {
      return "".concat(property, " of ").concat(object);
    }
  }
};