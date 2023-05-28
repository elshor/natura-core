"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValid = isValid;
exports.isValidBasicType = isValidBasicType;
exports.validators = void 0;
var _calc = _interopRequireDefault(require("./calc.js"));
var _context = require("./context.js");
var _role = require("./role.js");
var _type = _interopRequireDefault(require("./type.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
/**
 * Check if a value is valid at a certain location
 * @param {Location} location 
 * @param {Any} value 
 */
function isValid(location, value) {
  var validators = location.spec.validators;
  if (_typeof(value) === 'object' && !isValidType(location, value)) {
    //only validate objects for performance reasons
    return "type mismatch. Expected ".concat(location.expectedType, " but got ").concat(valueType(value, location.dictionary));
  }
  if (!Array.isArray(validators)) {
    //no validators are defined then return true
    return true;
  }
  for (var i = 0; i < validators.length; ++i) {
    var valid = (0, _calc["default"])(validators[i], (0, _context.locationContext)(location, {
      value: value
    }));
    if (valid !== true) {
      return valid;
    }
  }
  return true;
}
function isValidType(location, value, expectedType) {
  //disabling type validation because we fail many types and this is too expensive. Should only be applied when copying or pasting etc.
  //TODO work out when to validate type
  return true;
  if (value === undefined) {
    //undefined is always ok
    return true;
  }
  expectedType = expectedType || location.expectedType;
  if (value && value.$type) {
    var actualType = expectedType.role === _role.Role.type ? value.$type : valueType(value, location.dictionary);

    //check if type isa expected type
    return location.dictionary.isa(actualType, expectedType);
  }
  if (Array.isArray(value) && expectedType.isCollection) {
    //check if all array children match the expected type
    for (var i = 0; i < value.length; ++i) {
      if (!isValidType(location.child(i), location.value[i], expectedType.singular)) {
        return false;
      }
    }
    ;
    return true;
  }

  //working with primitive values - always allow
  return true;
}
function valueType(value, dictionary) {
  if (value && value.$type === 'reference') {
    return (0, _type["default"])(value.valueType);
  }
  if (value && value.$type) {
    var spec = dictionary.getTypeSpec(value.$type);
    return (0, _type["default"])(spec.valueType || value.$type);
  }
  if (value && value.$type) {
    //get valueType of spec
  }
  return (0, _type["default"])(_typeof(value));
}

/**
 * List of validators. This can be inserted into a package.
 */
var validators = [{
  name: 'range validator',
  isa: ['validator'],
  pattern: 'between <<min>> and <<max>>',
  properties: {
    min: {
      type: 'number'
    },
    max: {
      type: 'number'
    }
  },
  calc: function calc(context) {
    var value = context.value;
    if (value === undefined) {
      //if the value is undefined then it is ok
      return true;
    }
    if (typeof value !== 'number') {
      return 'should be a number';
    }
    if (value >= this.min && value <= this.max) {
      return true;
    } else {
      return "should be between ".concat(this.min, " and ").concat(this.max);
    }
    ;
  }
}, {
  name: 'regex validator',
  isa: ['validator'],
  pattern: 'matches regex <<pattern>>',
  properties: {
    pattern: {
      type: 'string'
    }
  },
  calc: function calc(context) {
    var value = context.value;
    var pattern = context.pattern;
    var message = context.message;
    if (typeof value !== 'string') {
      return 'Value should be a string';
    }
    var matched = value.match(new RegExp(pattern));
    if (!matched) {
      return message || 'text does not match required pattern';
    }
    return true;
  }
}];
exports.validators = validators;
function isValidBasicType(location, type) {
  var expectedType = location.expectedType;
  if (expectedType.typeString === type.toString()) {
    return true;
  }
  var dictionary = location.dictionary;
  var spec = dictionary.getTypeSpec(expectedType);
  if (spec && spec.basicType === type) {
    return true;
  }
  var members = dictionary.getClassMembers(location.expectedType);
  var match = members.find(function (item) {
    return dictionary.getTypeSpec(item).basicType === type;
  });
  return match !== undefined;
}