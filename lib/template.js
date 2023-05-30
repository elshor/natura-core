"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcTemplate = calcTemplate;
var _handlebars = _interopRequireDefault(require("handlebars"));
var _spec = require("./spec.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                                                                                                                                                                                                                               *   All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                               */
var cacheMap = new Map();
//TODO handle situations when cache overflows - use LRU cache
function getCompiled(text) {
  if (cacheMap.has(text)) {
    return cacheMap.get(text);
  }
  var compiled = _handlebars["default"].compile(text, {
    noEscape: true
  });
  cacheMap.set(text, compiled);
  return compiled;
}

/**
 * 
 * @param {String} templateText template text
 * @param {Object} context context for template expansion
 * @param {Boolean} safe if true then don't print error message to log when got exception
 * @returns 
 */
function calcTemplate(templateText, context, safe) {
  if (typeof templateText !== 'string') {
    //if templateText is not a string then return null
    return null;
  }
  try {
    var template = getCompiled(templateText);
    return template(context, {
      allowProtoPropertiesByDefault: true
    });
  } catch (e) {
    if (safe) {
      return null;
    }
    console.error('Error parsing template', JSON.stringify(templateText), 'for', context);
  }
}

//register template functions
_handlebars["default"].registerHelper('the', function (type) {
  var dictionary = this.$dictionary;
  var spec = dictionary ? dictionary.getTypeSpec(type) : {};
  return 'the ' + (spec.name ? (0, _spec.specContextType)(spec) : type);
});

/**
 * returns today as iso string in the format of 2022-12-22
 */
_handlebars["default"].registerHelper('today', function () {
  return new Date().toISOString().substring(0, 10);
});
_handlebars["default"].registerHelper('todayBefore', function (n, unit) {
  return sub(new Date(), _defineProperty({}, unit, n)).toISOString().substring(0, 10);
});