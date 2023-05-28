"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cloneEntity = cloneEntity;
exports.entityIsArray = entityIsArray;
exports.entityType = entityType;
exports.entityValue = entityValue;
exports.generateNewEntity = generateNewEntity;
exports.uid = uid;
var _error = require("./error.js");
var _clone = _interopRequireDefault(require("clone"));
var _locationQuery = _interopRequireDefault(require("./location-query.js"));
var _dictionary = _interopRequireDefault(require("./dictionary.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function entityType(data) {
  if (_typeof(data) === 'object' && data !== null && data.$isProxy === true) {
    return _typeof(data.$value);
  } else {
    return _typeof(data);
  }
}
function entityIsArray(data) {
  if (Array.isArray(data)) {
    return true;
  }
  if (_typeof(data) === 'object' && data !== null && data.$isProxy === true) {
    return Array.isArray(data.$value);
  }
  return false;
}
function entityValue(entity) {
  if (_typeof(entity) === 'object' && entity !== null && entity.$isProxy === true) {
    return entityValue(entity.$value);
  } else {
    return entity;
  }
}
function generateNewEntity(location, type) {
  var dictionary = location instanceof _dictionary["default"] ? location : location.dictionary;
  location = location instanceof _dictionary["default"] ? null : location;
  if (!location) {}
  type = type || (location ? location.expectedType : null);
  (0, _error.assume)(dictionary, _error.MissingParam, 'dictionary');
  switch (type.searchString || type) {
    case 'string':
    case 'calc':
      return '';
    case 'boolean':
      return false;
    case 'any':
    case null:
    case undefined:
      return '';
    //default new entity is text
    default:
      //if type is registered, look for init values in properties
      var spec = dictionary.getTypeSpec(type);
      var ret = spec.init ? cloneEntity(spec.init) : {
        $id: uid()
      };
      ret.$type = type.searchString || type;
      if (spec.properties) {
        Object.keys(spec.properties).forEach(function (prop) {
          if (spec.properties[prop].initType !== undefined) {
            ret[prop] = generateNewEntity(location ? location.child(prop) : dictionary, spec.properties[prop].initType);
          }
          if (spec.properties[prop].init !== undefined) {
            ret[prop] = cloneEntity(spec.properties[prop].init);
          }
          if (spec.properties[prop].unique !== undefined) {
            //generate a unique name in the current context for entities of type `type`
            ret[prop] = generateUniqueValue(location, spec.properties[prop].unique);
          }
        });
      }
      if (spec.$specialized) {
        //if this type is specialized then we need to copy $specialized into the generated object
        Object.assign(ret, asJSON(spec.$specialized));
      }

      //if a generic type is specified then copy it to the generated object. This will be used to associate a funtion with this object
      if (spec.$generic) {
        ret.$generic = spec.$generic;
      }
      return ret;
  }
}
function uid() {
  var ret = '$' + (Number(new Date()) - new Date('2020-01-01') + Math.random()).toString(36).replace('.', '');
  return ret;
}
function generateUniqueValue(location, _ref) {
  var base = _ref.base,
    path = _ref.path,
    type = _ref.type,
    query = _ref.query;
  var names = {};
  (0, _error.assume)(location, 'Missing location for generating unique values.', path, type);
  (0, _error.assume)(query, 'Missing query for generating unique values.', path, type);
  //using query to find existing values
  (0, _locationQuery["default"])(location, query).forEach(function (l) {
    names[l.value] = true;
  });
  var newName = base || 'entity';
  if (names[newName]) {
    //name already exists - add an integer from 1 to it until name doesn't exist
    for (var i = 1;; ++i) {
      newName = base + ' ' + i;
      if (!names[newName]) {
        return newName;
      }
    }
  } else {
    return newName;
  }
}

/**
 * Deep clone an entity and generate new $id for each object
 * @param {Object} entity the entity to clone
 */
function cloneEntity(entity) {
  var cloned = (0, _clone["default"])(entity);
  setID(cloned);
  return cloned;
}
function setID(entity) {
  if (entity === null || _typeof(entity) !== 'object') {
    return;
  }
  entity.$id = uid();
  Object.values(entity).forEach(function (value) {
    return setID(value);
  });
}
function asJSON(x) {
  if (_typeof(x) !== 'object') {
    return x;
  }
  if (Array.isArray(x)) {
    return x.map(asJSON);
  }
  if (typeof x.toJSON === 'function') {
    return x.toJSON();
  }
  return Object.fromEntries(Object.entries(x).map(function (_ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
      key = _ref3[0],
      value = _ref3[1];
    if (value.isTypeObject) {
      //this is a type - return a string version
      return [key, value.toString()];
    }
    return [key, asJSON(value)];
  }));
}