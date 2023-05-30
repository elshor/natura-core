"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcPattern = calcPattern;
exports.parsePattern = parsePattern;
exports.patternAsGrammer = patternAsGrammer;
exports.patternFields = patternFields;
exports.patternProperties = patternProperties;
exports.patternText = patternText;
var _entity = require("./entity.js");
var _error = require("./error.js");
var _spec = require("./spec.js");
var _templateType = _interopRequireDefault(require("./template-type.js"));
var _type = _interopRequireDefault(require("./type.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); } /*
                                                                                                                                                                                                                                                                                                                                                  *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                                                                                                                                                                                  *   All rights reserved.
                                                                                                                                                                                                                                                                                                                                                  */
function parsePattern() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var def = arguments.length > 1 ? arguments[1] : undefined;
  (0, _error.assume)(typeof text === 'string', 'pattern is a' + _typeof(text) + ' - ' + text);
  var numerators = {};
  var ret = {
    text: text,
    fields: [],
    elements: []
  };
  var regex = /(([^\<\>]+)|(<<[^\>]+>>))/g;
  var parsed = text.match(regex);
  if (!parsed) {
    return ret;
  }
  parsed.forEach(function (element) {
    var parsed = element.match(/^<<([^:]+)(?:\:(.+))?>>$/);
    if (parsed) {
      //this is a field

      //by default expect the field to be a type
      var field = {
        type: parsed[1]
      };
      if (parsed[2]) {
        //a separate name is defined
        field.name = parsed[2];
      } else if (numerators[field.type] === undefined) {
        numerators[field.type] = 0;
        field.name = field.type;

        //if properties are defined, check if the field is property name
        if (def && def.properties && def.properties[field.name]) {
          field.type = def.properties[field.name].type;
        }
      } else {
        numerators[field.type]++;
        field.name = field.type + numerators[field.type];
      }
      if (typeof field.type === 'function') {
        debugger;
      }
      ret.fields.push(field);
      ret.elements.push(field);
    } else {
      if (ret.elements.length > 0 && typeof ret.elements[ret.elements.length - 1] === 'string') {
        ret.elements[ret.elements.length - 1] = ret.elements[ret.elements.length - 1] + element;
      } else {
        ret.elements.push(element);
      }
    }
  });
  return ret;
}
function patternFields(pattern) {
  return parsePattern(pattern).fields;
}
function patternProperties(pattern) {
  return Object.fromEntries(patternFields(pattern).filter(function (field) {
    return !field.name.includes('|');
  }) //filter out pipe expansions
  .map(function (field) {
    return [field.name, {
      type: field.type
    }];
  }));
}

/**
 *
 * @param {Location} location
 */
function patternText(location) {
  if (!location) {
    return null;
  }
  var spec = location.spec;
  if (!spec) {
    var value = location.value === undefined || location.value === null ? '___' : location.value;
    return value.title || value.name || value.label || value.$id || value.toString();
  }
  var pattern = (0, _spec.specComputedPattern)(spec);
  if (!pattern) {
    var _value = location.value === undefined || location.value === null ? '___' : location.value;
    return _value.title || _value.name || _value.label || _value.$id || _value.toString();
  }
  return calcPattern(location, pattern);
}
function calcPattern(location, pattern) {
  return parsePattern(pattern).elements.map(function (el) {
    if (typeof el === 'string') {
      return el;
    } else {
      return patternText(location.child(el.name));
    }
  }).join('');
}
function patternAsGrammer(target, pattern, spec, tokenizer, dictionary, packageName) {
  var isPartial = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
  var props = spec.properties;
  var parts = pattern.split(/(?<!\\),/).map(function (item) {
    return item.trim().replace(/\\,/g, ',');
  });
  var parsed = parsePattern(parts[0], spec);
  var typeName = spec.name;
  parts.forEach(function (part, index) {
    if (index > 0) {
      //this is a pattern fragment. It can either appear or not with or without a preceding comma
      var parsedPart = parsePattern(part, spec);
      var name = spec.name + '$' + index + (spec.specializedFor ? '<t>' : '');
      parsed.elements.push({
        name: name,
        type: 'fragment',
        rules: patternAsGrammer(name, part, spec, tokenizer, dictionary, packageName, true)
      });
    }
  });
  var base = {
    name: typeAsString(target),
    symbols: [],
    description: spec.description,
    source: spec.name
  };
  var rules = [base];
  var converterData = {};
  parsed.elements.forEach(function (el) {
    if (typeof el === 'string') {
      //this is a text - tokenize it and add to pattern
      tokenizer(el).forEach(function (token) {
        if (token === ' ') {
          base.symbols.push('_');
        } else {
          base.symbols.push({
            literal: token
          });
        }
      });
    } else if (el.type === 'fragment') {
      rules.push.apply(rules, _toConsumableArray(el.rules));
      rules.push({
        name: el.name + '?',
        symbols: ['FRAGMENT_SEP', el.name],
        source: spec.name + '*',
        postprocess: function postprocess(data) {
          return data[1];
        }
      }, {
        name: el.name + '?',
        symbols: [],
        source: spec.name + '*'
      });
      base.symbols.push(el.name + '?');
    } else {
      converterData[base.symbols.length] = el.name;
      var type = typeAsString(el.type);
      if (props[el.name] && props[el.name].examples) {
        //this type has examples - generate a specific type for this and add examples
        type = "".concat(type, "<").concat(base.name, ".").concat(el.name, ">");
        rules.push({
          name: type,
          symbols: [typeAsString(el.type)],
          source: "".concat(base.name, ".").concat(el.name),
          postprocess: takeFirst
        });
        props[el.name].examples.forEach(function (example) {
          rules.push({
            name: type,
            symbols: [{
              example: JSON.stringify(example)
            }],
            source: "".concat(base.name, ".").concat(el.name, "$example"),
            postprocess: takeFirst
          });
        });
      }
      if (props[el.name] && props[el.name].constraint && props[el.name].constraint.noRepeatType) {
        //this is a list with noRepeatType constraint - add it (without the ending *)
        type = "no-repeat-type-list<".concat(type.match(/^(.*)\*$/)[1], ">");
      }
      base.symbols.push(type);
    }
  });
  base.postprocess = generateConverter(converterData, isPartial ? null : typeName, dictionary, spec);
  return rules;
}
function typeAsString(type) {
  var typeObject = (0, _type["default"])(type);
  if (typeObject instanceof _templateType["default"]) {
    console.error('Template types are not supported', type);
  }
  var ret = typeObject.toString();
  return ret;
}
function generateConverter(converterData, typeName, dictionary, spec) {
  var packageName = spec.$package._id;
  var ret = function ret(data, reference, fail) {
    var ret = typeName ? (0, _entity.generateNewEntity)(dictionary, typeName) : {
      $partial: true
    };
    Object.entries(converterData).forEach(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];
      if (value.includes('|')) {
        //this is an expansion item - it generates template text - ignore this
        return;
      }
      ret[value] = data[key];
    });

    //integrate partials
    data.forEach(function (item) {
      if (!item || !item.$partial) {
        return;
      }
      Object.entries(item).forEach(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
          key = _ref4[0],
          value = _ref4[1];
        if (['$pkg', '$partial'].includes(key)) {
          return;
        }
        ret[key] = value;
      });
    });
    ret.$pkg = packageName;
    if (!processConstraint(spec, ret)) {
      return fail;
    }
    return ret;
  };
  ret.typeName = typeName;
  return ret;
}
function takeFirst(data) {
  return data[0];
}
function processConstraint(spec, data) {
  if (!testConstraint(spec.constraint, data)) {
    return false;
  }
  var entries = Object.entries(spec.properties);
  for (var i = 0; i < entries.length; ++i) {
    if (!testConstraint(entries[i][1].constraint, data[entries[i][0]])) {
      return false;
    }
  }
  return true;
}
function testConstraint(constraint, data) {
  if (!constraint) {
    return true;
  }
  var props = Object.entries(constraint);
  for (var i = 0; i < props.length; ++i) {
    switch (props[i][0]) {
      case 'noRepeatType':
        if (!testNoRepeatType(data)) {
          return false;
        }
        break;
      default:
        //unknown constraint - fail
        return false;
    }
  }
  return true;
}
function testNoRepeatType(data) {
  var seen = {};
  if (!Array.isArray(data)) {
    return true;
  }
  for (var i = 0; i < data.length; ++i) {
    if (!data[i]) {
      continue;
    }
    var current = data[i].$type;
    if (!current) {
      continue;
    }
    if (seen[current]) {
      return false;
    }
    seen[current] = true;
  }
  return true;
}