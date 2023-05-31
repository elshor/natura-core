"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _type = _interopRequireDefault(require("./type.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               *   Copyright (c) 2022 DSAS Holdings LTD.
                                                                                                                                                                                                                                                                                                                                                                                               *   All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                               */ /**
                                                                                                                                                                                                                                                                                                                                                                                                   * Used as base to extend other types
                                                                                                                                                                                                                                                                                                                                                                                                   */
var SuperType = /*#__PURE__*/function () {
  function SuperType(type, dictionary) {
    _classCallCheck(this, SuperType);
    this.dictionary = dictionary;
    this.$type = type;
  }
  _createClass(SuperType, [{
    key: "toString",
    value: function toString() {
      return this.typeString;
    }
  }, {
    key: "typeString",
    get: function get() {
      if (typeof this.type === 'string') {
        return this.type;
      }
      return this.type.typeString || this.type.toString();
    }
    /** A search string is always the singular of a type */
  }, {
    key: "searchString",
    get: function get() {
      return this.isCollection ? this.singular.typeString : this.typeString;
    }
  }, {
    key: "isCollection",
    get: function get() {
      var str = this.typeString;
      return str ? str.match(/\*$/) !== null : false;
    }
  }, {
    key: "isArray",
    get: function get() {
      return this.isCollection;
    }
  }, {
    key: "singular",
    get: function get() {
      if (this.isCollection) {
        return (0, _type["default"])(this.typeString.substr(0, this.typeString.length - 1), null, this.dictionary);
      } else {
        return this;
      }
    }
  }, {
    key: "isTypeObject",
    get: function get() {
      return true;
    }
  }, {
    key: "spec",
    get: function get() {
      return this.dictionary ? this.dictionary.getTypeSpec(this) : {};
    }
  }, {
    key: "properties",
    get: function get() {
      return this.dictionary ? this.dictionary.getTypeSpec(this).properties : {};
    }
  }]);
  return SuperType;
}();
exports["default"] = SuperType;