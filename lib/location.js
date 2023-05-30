"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLocation = createLocation;
exports.relativeLocation = relativeLocation;
exports.relativeLocations = relativeLocations;
exports.shadowLocation = shadowLocation;
var _jsonPtr = require("json-ptr");
var _spec = require("./spec.js");
var _calc = _interopRequireWildcard(require("./calc.js"));
var _entity = require("./entity.js");
var _pattern = require("./pattern.js");
var _context = require("./context.js");
var _type = _interopRequireDefault(require("./type.js"));
var _lang = _interopRequireDefault(require("./lang.js"));
var _validate = require("./validate.js");
var _dictionary = _interopRequireDefault(require("./dictionary.js"));
var _template = require("./template.js");
var _locationQuery = _interopRequireDefault(require("./location-query.js"));
var _error = require("./error.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /*
                                                                                                                                                                                                                                                                                                                                                                                               *   Copyright (c) 2021 DSAS Holdings LTD.
                                                                                                                                                                                                                                                                                                                                                                                               *   All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                               */
var locationMap = new Map();

/**
 * Create a location object, representing a specific location in a JSON using a schema defined in a dictionary
 * @param {Any} data The base data the location is located in
 * @param {Dictionary} dictionary The dictionary to be used to identify types and schema
 * @param {String} path path to location from base data
 * @param {Type} type type of the data top (when path is empty)
 * @returns Location
 */
function createLocation(data) {
  var dictionary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new _dictionary["default"]();
  var path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var segments = _jsonPtr.JsonPointer.decode(uriHash(path));
  var top;
  if (locationMap.has(data)) {
    //if a location was already generated for this data then return it. We want to make sure, each data has only a single location so we don't get into situation where two location represetns a single data point, one location is updated and the other doesn't know about it
    //we assume for a single data object there can only be one URI and one dictionary
    top = locationMap.get(data);
  } else {
    top = new Location(data, dictionary, '', null, uriResource(path), type);
    locationMap.set(data, top);
  }
  var current = top;
  for (var i = 0; i < segments.length; ++i) {
    current = current.child(segments[i]);
  }
  return current;
}
var Location = /*#__PURE__*/function () {
  function Location(data, dictionary, path, lang, uri, type) {
    _classCallCheck(this, Location);
    if (type) {
      this._type = (0, _type["default"])(type, this);
    }
    this.data = data;
    this.uri = uri;
    this.dictionary = dictionary;
    this.path = path;
    this.lang = lang || (0, _lang["default"])();
    this._cache = {};
    this._children = {};
    this._listeners = [];
    this._sversion = 0; //structure version - used to invalidate nodes that changed
  }
  _createClass(Location, [{
    key: "addEventListener",
    value: function addEventListener(listener) {
      this._listeners.push(listener);
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(listener) {
      var index = this._listeners.indexOf(listener);
      if (index >= 0) {
        this._listeners.splice(index, 1);
      }
    }
  }, {
    key: "emitChange",
    value: function emitChange(location, action) {
      this._listeners.forEach(function (l) {
        return l({
          location: location,
          action: action
        });
      });
    }
  }, {
    key: "_invalidateCache",
    value: function _invalidateCache() {
      if (this._cache.hasCachedValue) {
        if (!this.parent.value) {} else if (this.parent.value[this.property] !== this._cache.value) {}
      }
      Object.values(this._children).forEach(function (child) {
        return child._invalidateCache({
          self: true
        });
      });
      this._cache = {};
    }
  }, {
    key: "value",
    get: function get() {
      if (this._cache.hasCachedValue) {
        return this._cache.value;
      } else {
        var ret = locationValue(this);
        this._cache.value = ret;
        this._cache.hasCachedValue = true;
        return ret;
      }
    }

    /**
     * @returns {Spec}
     */
  }, {
    key: "spec",
    get: function get() {
      var typeSpec = this.dictionary.getTypeSpec(this.type);
      var contextSpec = this.contextSpec;
      return (0, _spec.mergeSpec)(contextSpec, typeSpec);
    }
  }, {
    key: "contextSpec",
    get: function get() {
      var parent = this.parent;
      var ret;
      if (!parent) {
        //top level - we have no information regarding the spec
        return {};
      }
      var parentType = parent.type;
      if (this._cache.parentType && this._cache.parentType.toString() === parentType.toString() && this._cache.contextSpec) {
        //parent did not change and can use cache
        return this._cache.contextSpec;
      }
      if (parentType.isCollection) {
        //its parent is an array
        var parentSpec = parent.contextSpec;
        var childSpec = parentSpec.childSpec || Object.assign({}, parentSpec, {
          type: (0, _type["default"])(parentSpec.type, this).singular
        });
        childSpec.type = childSpec.type || (0, _type["default"])(parentSpec.type, this).singular;
        ret = childSpec;
      } else {
        var _parentSpec = parent.contextSpec;
        if (_parentSpec && _typeof(_parentSpec) === 'object' && _parentSpec.hashSpec) {
          ret = _parentSpec.hashSpec;
        } else {
          var parentTypeSpec = this.dictionary.getTypeSpec(parentType);
          ret = (0, _spec.specProperties)(parentTypeSpec)[this.property];
        }
      }

      //store cache
      this._cache.parentType = parentType;
      this._cache.contextSpec = ret;
      return ret || {};
    }
  }, {
    key: "valueType",
    get: function get() {
      if (this.dictionary.isa(this.type, 'expression')) {
        return (0, _type["default"])(this.spec.valueType, this);
      } else {
        return this.type;
      }
    }
  }, {
    key: "valueTypeSpec",
    get: function get() {
      var valueType = this.spec.valueType || this.type;
      return (0, _spec.Spec)(this.dictionary.getTypeSpec(valueType), this.dictionary);
    }
  }, {
    key: "type",
    get: function get() {
      if (this._type) {
        //type was set explicitly
        return this._type;
      }
      if (!this._cache.type) {
        this._cache.type = this.calcType();
      }
      return this._cache.type;
    }
  }, {
    key: "calcType",
    value: function calcType() {
      var thisValue = this.value;
      if (Array.isArray(thisValue) && this.expectedType.isCollection) {
        return this.expectedType;
      }
      if (this._isReference(thisValue)) {
        //type is stored in the reference object
        return (0, _type["default"])(thisValue.valueType, this);
      } else if (thisValue && _typeof(thisValue) === 'object' && thisValue.$type) {
        //value is set with an object that has explicit type
        return (0, _type["default"])(thisValue.$type, this);
      }
      var parent = this.parent;
      if (typeof thisValue === 'string') {
        //TODO handle situations where expected type is a typedef of string
        return (0, _type["default"])('string', this);
      } else if (typeof thisValue === 'number') {
        //TODO handle situations where expected type is a typedef of number
        return (0, _type["default"])('number', this);
      } else if (typeof thisValue === 'boolean') {
        return (0, _type["default"])('boolean', this);
      }
      if (this._cache.parentType === undefined) {
        this._cache.parentType = parent ? parent.type : 'any';
      }
      if ((0, _type["default"])(this._cache.parentType, this).isCollection) {
        //this is a list type
        return (0, _type["default"])(this._cache.parentType, this).singular;
      }
      if (this._cache.parentSpec === undefined) {
        this._cache.parentSpec = parent ? parent.spec : {};
      }
      if (this._cache.parentSpec.hashSpec) {
        //this is a hashSpec
        return (0, _type["default"])(this._cache.parentSpec.hashSpec.type, this);
      } else if (this._cache.parentSpec.properties && this._cache.parentSpec.properties[this.property]) {
        return (0, _type["default"])(this._cache.parentSpec.properties[this.property].type, this);
      } else {
        //no type information - return any
        return (0, _type["default"])('any', this);
      }
    }

    /**
     * Get the spec of the entity type. If the type is an instance then return type of instance
     */
  }, {
    key: "valueSpec",
    get: function get() {
      var spec = this.spec;
      if (spec.valueType) {
        //this spec is probably an expression, the valueSpec is the spec of its valueType
        return this.dictionary.getTypeSpec((0, _type["default"])(spec.valueType, this));
      } else {
        return spec;
      }
    }
  }, {
    key: "inlineTitle",
    get: function get() {
      var spec = this.spec;
      if (spec.template) {
        return (0, _template.calcTemplate)(this.spec.template, this.contextNoSearch);
      }
      var patternText = this.patternText;
      if (patternText) {
        return patternText;
      }
      if (spec.title) {
        return (0, _template.calcTemplate)(spec.title, this.contextNoSearch);
      }
      return spec.name || spec.type.toString();
    }
  }, {
    key: "expectedSpec",
    get: function get() {
      var typeSpec = this.dictionary.getTypeSpec(this.expectedType);
      var contextSpec = this.contextSpec;
      return (0, _spec.mergeSpec)(contextSpec, typeSpec);
    }
  }, {
    key: "expectedType",
    get: function get() {
      var parent = this.parent;
      if (this._type) {
        //this is the type defined when creating the location
        return this._type;
      }
      if (!parent) {
        //no parent - return any
        return (0, _type["default"])('any', this);
      } else if (parent.type.isCollection) {
        //this is a list type
        return parent.type.singular;
      } else if (parent.spec.hashSpec) {
        //this is a hashSpec
        return (0, _type["default"])(parent.spec.hashSpec.type, this);
      } else if (parent.spec.properties && parent.spec.properties[this.property]) {
        return (0, _type["default"])(parent.spec.properties[this.property].type, this);
      } else {
        //no type information - return any
        return (0, _type["default"])('any', this);
      }
    }
  }, {
    key: "parent",
    get: function get() {
      if (this._parent !== undefined) {
        return this._parent;
      }
      var segments = _jsonPtr.JsonPointer.decode(this.path);
      if (segments.length > 0) {
        segments.pop();
        var newPath = _jsonPtr.JsonPointer.create(segments).toString();
        this._parent = new Location(this.data, this.dictionary, newPath, this.lang);
        return this._parent;
      } else {
        this._parent = null;
        return null;
      }
    }
  }, {
    key: "previous",
    get: function get() {
      var pathSegments = _jsonPtr.JsonPointer.decode(this.path);
      var last = pathSegments.pop();
      if (isNumber(last) && asNumber(last) > 0) {
        return this.parent.child(Number(asNumber(last) - 1).toString());
      } else if (asNumber(last) === -1) {
        var parentValue = this.parent.value;
        if (Array.isArray(parentValue) && parentValue.length > 0) {
          return this.parent.child(parentValue.length - 1);
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  }, {
    key: "isReadOnly",
    get: function get() {
      var spec = this.spec;
      if (!spec) {
        return false;
      } else if (spec.value) {
        return true;
      } else if (spec.readonly) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * Return the default value at location based on spec's default value
     */
  }, {
    key: "default",
    get: function get() {
      var expectedSpec = this.expectedSpec;
      return (0, _calc["default"])(expectedSpec["default"], this.context);
    }
    /**
     * get the path to the first required property that is empty
     */
  }, {
    key: "firstMissingProperty",
    value: function firstMissingProperty() {
      if (this.isEmpty) {
        if (this.spec.required) {
          //the value is required but missing - return this path
          return '';
        } else {
          //if the value is empty and not required then finish search
          return null;
        }
      }
      var spec = this.spec;
      var properties = (0, _spec.specProperties)(spec);
      var keys = spec.show || Object.keys(properties);
      for (var i = 0; i < keys.length; ++i) {
        var childPath = this.child(keys[i]).firstMissingProperty();
        if (childPath !== null) {
          return keys[i] + (childPath.length > 0 ? '/' + childPath : '');
        }
      }
      return null;
    }

    /**
     * the static context to pass to a spec function at a certain location. This function returns execution at edit time, not execution time. It is used to calculate spec proeprties
     */
  }, {
    key: "context",
    get: function get() {
      return (0, _context.locationContext)(this);
    }

    /**
     * ContextNoSearch is a context object used for calculation that does not search context for properties. This can be used when we want to prevent recursion when calculating context or when performance is important and there is no need for context search
     */
  }, {
    key: "contextNoSearch",
    get: function get() {
      return (0, _context.locationContext)(this, {});
    }
  }, {
    key: "property",
    get: function get() {
      if (this._property === undefined) {
        this._property = _jsonPtr.JsonPointer.decode(this.path).pop();
      }
      return this._property;
    }
  }, {
    key: "patternText",
    get: function get() {
      return (0, _pattern.patternText)(this);
    }
  }, {
    key: "isReference",
    get: function get() {
      return this._isReference();
    }
  }, {
    key: "_isReference",
    value: function _isReference() {
      var currentValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      function isSelfReference(location) {
        //self reference is a reference to itself. This should not be considered a reference because it will cause endless recursion
        return location && location.data && location.data.$type === 'reference' && (!location.data.path || location.data.path === '');
      }
      if (isSelfReference(this)) {
        return false;
      }
      var value = currentValue === undefined ? this.value : currentValue;
      return value && _typeof(value) === 'object' && value.$type === 'reference';
    }

    /**
     * Check if location value is empty i.e. equals undefined or null
     */
  }, {
    key: "isEmpty",
    get: function get() {
      var value = this.value;
      return value === undefined || value === null;
    }

    /**
     * Value is true if this type is an array (collection type) or hashType
     * @returns {Boolean}
     */
  }, {
    key: "isCollection",
    get: function get() {
      return (0, _type["default"])(this.type, this).isCollection || this.spec.hashSpec;
    }

    /**
     * If the valut at this location is a reference then return the location object for the entity referenced. Otherwise, just return this
     * @returns {Location}
     */
  }, {
    key: "referenced",
    get: function get() {
      if (this.isReference && this.value.path !== undefined) {
        var ret = createLocation(getResource(this.value.path || '', this, this.data), this.dictionary, uriHash(this.value.path));
        return ret;
      } else {
        return this;
      }
    }
    /**
     *
     * @param {String} prop
     * @returns {Location}
     */
  }, {
    key: "child",
    value: function child(prop) {
      //TODO what happens when value changes - need to invalidate (unless vue reactivity takes care of that - need to test)
      if (this._children[prop]) {
        return this._children[prop];
      }
      var child = new LocationChild(this, prop);
      this._children[prop] = child;
      return child;
    }

    /**
     * Check if a value is valid at this location
     */
  }, {
    key: "isValid",
    value: function isValid(value) {
      return (0, _validate.isValid)(this, value);
    }

    /**
     * is true if the current value is valid at this location
     */
  }, {
    key: "valid",
    get: function get() {
      return (0, _validate.isValid)(this, this.value) === true;
    }
  }, {
    key: "children",
    get: function get() {
      var _this = this;
      var val = this.value;
      if (val === null || _typeof(val) !== 'object') {
        return [];
      }
      if (Array.isArray(val)) {
        return Array.from(val.keys()).map(function (key) {
          return _this.child(key);
        });
      }
      return Object.keys(val).map(function (key) {
        return _this.child(key);
      });
    }
  }, {
    key: "properties",
    get: function get() {
      var _this2 = this;
      var val = this.value;
      if (val === null || _typeof(val) !== 'object') {
        return [];
      }
      var ret = {};
      Object.keys(val).forEach(function (key) {
        return ret[key] = _this2.child(key);
      });
      return ret;
    }

    /**
     * Returns an array of locations of prop. If prop is an array then returns an array of locations of all its items. If value of property is not an array then returns an array with only that location
     * @param {String} prop
     * @returns {Array}
     */
  }, {
    key: "childList",
    value: function childList(prop) {
      var _this3 = this;
      var val = this.child(prop).value;
      if (Array.isArray(val)) {
        return val.map(function (item, index) {
          return _this3.child(prop).child(index);
        });
      } else {
        return [this.child(prop)];
      }
    }
  }, {
    key: "sibling",
    value: function sibling(prop) {
      return this.parent.child(prop);
    }
  }, {
    key: "isLocation",
    get: function get() {
      return true;
    }

    /**
     * Delete the value at the path. If the path points to an item in an array then the function uses splice to remove the element
     */
  }, {
    key: "delete",
    value: function _delete() {
      var parentValue = this.parent.value;
      if (Array.isArray(parentValue)) {
        //ensure property is a number
        var pos = typeof this.property === 'number' ? this.property : Number.parseInt(this.property, 10);
        if (Number.isNaN(pos) || pos < 0) {
          throw new TypeError('Array index should be a positive integer');
        }
        parentValue.splice(pos, 1);
        this.parent._invalidateCache({
          fron: pos
        });
      } else {
        delete parentValue[this.property];
        this._invalidateCache({
          self: true
        });
      }
      this.parent.emitChange(this, 'delete-child');
    }
    /** validate  value cache is correct*/
  }, {
    key: "_dbValidate",
    value: function _dbValidate() {
      if (this._cache.hasCachedValue && this._cache.value !== locationValue(this)) {
        console.error('failed validation', this.path, this._cache.value, locationValue(this));
      }
      if (this.parent) {
        this.parent.validate();
      }
    }
    /**
     * set the value at the location. If the path to the location does not exist then create it. If the location property has format `#key` then assume the parent is an array (if doesn't exist) and create a new object with key set. If the property is a number then assume it is a position within an array. If the property is -1 then insert a new item to the array
     * @param {*} value value to set
     * @param {Function} setter a function to be used to set the property value of an object. This should be used in situations like Vue reactive data where setting needs to make sure the object is reactive
     * @returns {Location} the new location. This is different from original location when path is a hash or -1 index
     */
  }, {
    key: "set",
    value: function set(value) {
      var setter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : plainSetter;
      var property = this.property;
      var isHash = typeof property === 'string' && property.charAt(0) === '#';
      var parent = this.parent;
      var asInteger = Number.parseInt(property, 10);
      var currentValue = this.value;
      //if value is the same then do nothing
      if (currentValue === value) {
        return this;
      }
      if (asInteger === -1 && Array.isArray(this.parent.value)) {
        //need to invalidate the location at the expected insert position
        this.parent.child(this.parent.value.length)._invalidateCache({
          self: true
        });
      }
      if (!parent.value) {
        //first set the value of parent
        if (isHash || !Number.isNaN(asInteger)) {
          //if the property is a hash or number then assuming the parent is an array
          this.parent.set([], setter);
        } else {
          this.parent._setNew(setter);
        }
      }
      if (isHash) {
        //need to insert an object to the array. value must be an array
        var parentValue = parent.value;
        var hashKey = property.substring(1);
        if (!Array.isArray(parentValue)) {
          throw new TypeError("parent of hash value must be an array");
        }
        if (value === null || _typeof(value) !== 'object') {
          throw new TypeError("insert at hash property must be an object");
        }

        //look for the hash object
        var index = -1;
        for (var i = 0; i < parentValue.length; ++i) {
          if (this.child(i).key === hashKey) {
            this.parent.child(i.toString()).set(value, setter);
            index = i;
          }
        }
        if (index === -1) {
          //push value at the end
          index = parentValue.length;
          setter(parentValue, parentValue.length, value);
        }

        //now set the key so it will be returned by the hash property
        var created = this.parent.child(index);
        var keyProperty = created.spec.key || "$key";
        setter(created.value, keyProperty, hashKey);
        this._invalidateCache({
          self: true
        });
        this.emitChange(this, 'set'); //changed this value
        this.parent.emitChange(this, 'set-child'); //parent value changed
        return created;
      } else if (asInteger === -1 && Array.isArray(this.parent.value)) {
        //insert a new item into array
        var _parentValue = this.parent.value;
        _parentValue.push(value);
        this._invalidateCache({
          self: true
        });
        this.emitChange(this, 'set'); //changed this value
        this.parent.emitChange(this, 'set-child'); //parent value changed
        return this.parent.child((_parentValue.length - 1).toString());
      } else {
        //set this path
        setter(parent.value, property, value);

        //invalidate cache
        this._invalidateCache();
        this.emitChange(this, 'set'); //changed this value
        this.parent.emitChange(this, 'set-child'); //parent value changed
        return this;
      }
    }

    /** set a new object. If expectedType is not any then generateNewEntity of that type */
  }, {
    key: "_setNew",
    value: function _setNew() {
      var setter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : plainSetter;
      var type = this.expectedType;
      if (type.toString() === 'any') {
        return this.set({}, setter);
      }
      if (type.isCollection) {
        return this.set([], setter);
      }
      return this.set((0, _entity.generateNewEntity)(this), setter);
    }

    /**
     * If $parent is an array and property is a number then insert value into location using splice function. Otherwise, just set it
     * @param {*} value value to insert
     * @param {Function} setter setter function to use for setting values. Use this for special setting handling like for ractive objects in Vue
     * @param {Function} inserter inserter function to use. This should be used when special insert handling is required such as handling reactivity in Vue
     */
  }, {
    key: "insert",
    value: function insert(value) {
      var setter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : plainSetter;
      var inserter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : plainInserter;
      var parent = this.parent.value;
      var key = this.property;
      var pos = typeof key === 'number' ? key : Number.parseInt(key, 10);
      if (parent === undefined) {
        //need to generate parent
        if (Number.isNaN(pos) && pos[0] !== '#') {
          //parent is a regular object
          this.parent._setNew(setter);
        } else {
          this.parent.set([]);
        }
        parent = this.parent.value;
      }
      if (Array.isArray(parent)) {
        if (Number.isNaN(pos)) {
          //this is not really a pos in an array
          throw new Error('Insert position is not an array index');
        } else {
          inserter(parent, pos, value);
          this.parent.emitChange(this, 'insert-child');
          this.emitChange(this, 'set');
          this.parent._invalidateCache({
            from: pos
          });
        }
      } else {
        //this is not an array pos - treat it as a property
        setter(parent, key, value);
        this.parent.emitChange(this, 'set-child');
        this.emitChange(this, 'set');
        this._invalidateCache({
          self: true
        });
      }
    }
  }]);
  return Location;
}();
/**
 * returns the value pointed by the location. This function checks the spec if there are any properties that have a `value` or `default` property and generates property if needed. For properties with `value` defined it always generates the property value and for properties with `default` defined it only generates a property value if the property value is `undefined`
 * @param {Location} location
 */
function locationValue(location) {
  if (location.path === undefined || location.path === '') {
    return location.data;
  }
  var parent = location.parent;
  if (!parent) {
    return undefined;
  }
  if (location._cache.parentValue === undefined) {
    location._cache.parentValue = location.parent.value;
  }
  var parentValue = location._cache.parentValue;
  if (!parentValue) {
    return undefined;
  }
  var property = location.property;
  if (typeof property === 'string' && property.charAt(0) === '#') {
    //this is a hash property. Look for the first child of parent that its key matches the has key
    var hashKey = property.substring(1);
    for (var x in parentValue) {
      if (parent.child(x).key === hashKey) {
        return parent.child(x).value;
      }
    }
    return undefined;
  }
  var value = parentValue[property];
  return value;
}
function isNumber(n) {
  return asNumber(n) !== null;
}
function asNumber(n) {
  n = (0, _entity.entityValue)(n);
  if (typeof n === 'number') {
    return n;
  } else if (typeof n === 'string' && !Number.isNaN(Number.parseFloat(n))) {
    return Number.parseFloat(n);
  } else {
    return null;
  }
}
var LocationChild = /*#__PURE__*/function (_Location) {
  _inherits(LocationChild, _Location);
  var _super = _createSuper(LocationChild);
  function LocationChild(parent, property) {
    var _this4;
    _classCallCheck(this, LocationChild);
    _this4 = _super.call(this, parent.data, parent.dictionary, parent.path + '/' + property, parent.lang, parent.uri);
    _this4._parent = parent;
    _this4._property = property;
    return _this4;
  }
  _createClass(LocationChild, [{
    key: "parent",
    get: function get() {
      return this._parent;
    }
  }, {
    key: "property",
    get: function get() {
      return this._property;
    }
  }, {
    key: "key",
    get: function get() {
      var keyProperty = this.spec.key || '$key';
      return this.child(keyProperty).value;
    }
  }]);
  return LocationChild;
}(Location);
function uriHash(uri) {
  try {
    var hash = new URL(uri).hash.substr(1);
    if (hash[0] !== '/') {
      return '/' + hash;
    } else {
      return hash;
    }
  } catch (_unused) {
    return uri;
  }
}
function uriResource(uri) {
  try {
    var hash = new URL(uri).hash || '';
    return uri.substr(0, uri.length - hash.length);
  } catch (_unused2) {
    return null;
  }
}
function getResource(uri, location, defaultData) {
  var parsed = uri.match(/^dictionary\:([^\#]+)(.*)?$/);
  if (parsed) {
    //the location references an instance from the dictionary
    var ret = location.dictionary.getInstanceByID(parsed[1]);
    return ret;
  } else {
    return defaultData;
  }
}
function plainSetter(obj, key, value) {
  obj[key] = value;
}
function plainInserter(arr, pos, value) {
  arr.splice(pos, 0, value);
}
function relativeLocations(location, path) {
  return (0, _locationQuery["default"])(location, path);
}
var ShadowLocation = /*#__PURE__*/function (_LocationChild) {
  _inherits(ShadowLocation, _LocationChild);
  var _super2 = _createSuper(ShadowLocation);
  function ShadowLocation(baseLocation, value) {
    var _this5;
    _classCallCheck(this, ShadowLocation);
    _this5 = _super2.call(this, baseLocation.parent, baseLocation.property);
    _this5._value = value;
    return _this5;
  }
  _createClass(ShadowLocation, [{
    key: "value",
    get: function get() {
      return this._value;
    }
  }, {
    key: "delete",
    value: function _delete() {
      throw new Error('Cannot delete a shadow location');
    }
  }, {
    key: "set",
    value: function set() {
      throw new Error('Cannot set a shadow location');
    }
  }, {
    key: "insert",
    value: function insert() {
      throw new Error('Cannot insert at a shadow location');
    }
  }]);
  return ShadowLocation;
}(LocationChild);
function relativeLocation(location, path) {
  var locations = (0, _locationQuery["default"])(location, path);
  if (locations.length === 0) {
    //no locations found
    return null;
  }
  return locations[0];
}

/**
 * Create a shadow location.. A shadow location is a location that is disconnected from the actual data tree. It cannot be approached from its parent. Its value cannot change. It is used to evaluate context and suggestions of possible values before the values are actually set. E.g. check validity of values and suggestions assuming the value is empty 
 */
function shadowLocation(baseLocation, value) {
  return new ShadowLocation(baseLocation, value);
}