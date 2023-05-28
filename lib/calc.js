"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcValue = calcValue;
exports["default"] = calc;
exports.isExpression = isExpression;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
function calc(expression) {
  var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (typeof expression === 'function') {
    return expression(context);
  } else if (_typeof(expression) === 'object' && expression !== null && expression.$type && context.$dictionary) {
    var spec = context.$dictionary.getTypeSpec(expression.$type);
    if (typeof spec.calc === 'function') {
      return spec.calc.call(expression, context);
    }
  }
  return expression;
}
function isExpression(value) {
  var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (typeof value === 'function') {
    return true;
  }
  ;
  if (value && _typeof(value) === 'object' && value.$type && context.$dictionary) {
    var spec = context.$dictionary.getTypeSpec(value.$type);
    if (typeof spec.calc === 'function') {
      return true;
    }
  }
  return false;
}

/**
 * If value is an expression then return the value of  the expression, otherwise just return the value
 * @param {Any} value value or expression
 * @param {Object} context context of calculation
 */
function calcValue(value) {
  var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (isExpression(value, context)) {
    return calc(value, context);
  } else {
    return value;
  }
}