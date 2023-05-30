"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Spec = Spec;
exports.computeSpecProperty = computeSpecProperty;
exports.isSpecGeneric = isSpecGeneric;
exports.mergeSpec = mergeSpec;
exports.placeholder = placeholder;
exports.specComputedPattern = specComputedPattern;
exports.specContextType = specContextType;
exports.specHasProperties = specHasProperties;
exports.specID = specID;
exports.specIsSelection = specIsSelection;
exports.specIsa = specIsa;
exports.specProperties = specProperties;
exports.specType = specType;
var _calc = _interopRequireWildcard(require("./calc.js"));
var _type = _interopRequireDefault(require("./type.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; } /*
                                                                                                                                                                                     *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                     *   All rights reserved.
                                                                                                                                                                                     */
var DefaultPlaceholder = 'Enter value here';
function Spec(json, dictionary) {
  return new Proxy({
    json: json,
    dictionary: dictionary
  }, {
    get: function get(_ref, prop) {
      var json = _ref.json;
      if (json[prop] !== undefined) {
        return json[prop];
      }
      if (json.$specialized && json.$specialized[prop] !== undefined) {
        return json.$specialized[prop];
      }
      if (prop === 'toJSON') {
        return function () {
          return json;
        };
      }
      if (prop === '$json') {
        return json;
      }
      if (prop === '$value') {
        return json;
      }
      return undefined;
    }
  });
}
function specType(spec) {
  return spec ? spec.name || (0, _type["default"])(spec.type) || specComputedPattern(spec) : 'any';
}
function specContextType(spec) {
  return spec ? spec.contextType || spec.name || spec.type || specComputedPattern(spec) : 'any';
}
function specIsa(spec, className) {
  return (spec.isa || []).includes(className);
}
function specComputedPattern(spec) {
  if ((0, _calc.isExpression)(spec.displayPattern)) {
    return (0, _calc["default"])(spec.displayPattern, spec);
  }
  return spec.displayPattern || spec.pattern;
}
function specID(spec) {
  return spec.$id || specType(spec);
}
function specHasProperties(spec) {
  if (!spec || !spec.properties) {
    return false;
  }
  return Object.keys(spec.properties).length > 0;
}
function placeholder(spec, propertyName) {
  if (!spec) {
    return DefaultPlaceholder;
  }
  return spec.placeholder || spec.title || propertyName || specType(spec).searchString || DefaultPlaceholder;
}
var DEFAULT_SPEC = [{
  $type: 'use context',
  path: '..'
}];
/**
 * Merge a context spec, determined by the property definition, and the type spec of a certain location
 * @param {Spec} contextSpec the spec determined by the context of the location, as defined in the properties spec
 * @param {Spec} typeSpec the spec stored in the dictionary retrieved using getTypeSpec
 * @returns {Spec}
 */
function mergeSpec(contextSpec, typeSpec) {
  contextSpec = contextSpec || {};
  typeSpec = typeSpec || {};
  var ret = Object.assign({}, typeSpec || {}, contextSpec || {});
  //context is only defined in property spec
  ret.context = [].concat(_toConsumableArray(typeSpec.context || []), _toConsumableArray(contextSpec.context || DEFAULT_SPEC));
  if (typeSpec.scope && contextSpec.scope) {
    //TODO need to merge scopes
  } else {
    ret.scope = contextSpec.scope || typeSpec.scope;
  }
  return ret;
}
function computeSpecProperty(spec, location, name, defaultValue) {
  var value = spec[name];
  if ((0, _calc.isExpression)(value)) {
    value = (0, _calc["default"])(value, {
      $spec: spec,
      $location: location
    });
  }
  return value === undefined ? defaultValue : value;
}
function specProperties(spec) {
  return spec.properties || {};
}

/**
 * Return true if this spec is a selection of options and not a primitive value
 * @param {Spec} spec
 */
function specIsSelection(spec) {
  return spec.options !== undefined && spec.options !== null;
}
function isSpecGeneric(spec) {
  return Array.isArray(spec.genericProperties) && !spec.$specialized;
}