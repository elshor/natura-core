"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = registerPackage;
var _noCase = require("no-case");
var _type = _interopRequireDefault(require("./type.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
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
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function registerPackage(dictionary, pkg) {
  (pkg.components || []).forEach(function (component) {
    return registerComponent(component, dictionary, pkg);
  });
  registerValues(dictionary, pkg);
  registerTypes(dictionary, pkg);
  registerExpressions(dictionary, pkg);
  registerActions(dictionary, pkg);
  registerCategories(dictionary, pkg.categories || {});
}
function registerComponent(component, dictionary, pkg) {
  try {
    var _ret, _ret$context;
    var props = generateProps(component, component.props || [], component.slots || []);
    var display = generateComponentDisplay(component);
    var pattern = component.pattern || "".concat(component.title || component.name, " named <<ref>>");
    var childrenProperty = generateChildrenProperty(component);
    var name = component.name;
    var ret = (_ret = {
      name: name,
      title: component.title,
      description: component.description,
      init: component.init,
      properties: {
        props: {
          type: props.name,
          title: 'properties',
          description: 'Specify the properties of the component',
          initType: props.name,
          expanded: true,
          displayInline: false,
          context: [{
            $type: 'use context',
            path: '..'
          }]
        },
        display: {
          type: display.name,
          description: 'Set data to display in component, when to display it and how to reference it',
          context: [{
            $type: 'use context',
            path: '..'
          }]
        },
        ref: {
          title: 'reference',
          type: 'string',
          noSuggestions: true,
          description: 'reference name used to reference and identify this component. The reference is used to identify the component so it should be descriptive. It may contain spaces.',
          placeholder: 'reference name',
          unique: {
            query: '/**/?isa component/ref',
            base: component.title || component.name
          }
        }
      },
      context: [{
        $type: 'use context',
        path: 'display'
      }, {
        $type: 'use context',
        path: 'props'
      }, {
        $type: 'use context',
        path: 'slots/*/*'
      }, {
        $type: 'use scope',
        path: '',
        key: 'expose',
        access: '$root.$refs.{{ref}}'
      }, {
        $type: 'use context',
        path: '..'
      }, {
        $type: 'basic emit',
        name: '{{ref}}',
        access: '$root.$refs.{{ref}}',
        type: component.name,
        useScope: true
      }],
      scope: {
        expose: [{
          $type: 'scope mixin',
          path: 'display',
          key: 'expose'
        }, {
          $type: 'scope mixin',
          path: 'props',
          key: 'expose'
        }]
      },
      pattern: pattern
    }, _defineProperty(_ret, "description", component.description), _defineProperty(_ret, "suggest", {
      screenshot: component.screenshot
    }), _ret);
    //copy context and scope from component
    (_ret$context = ret.context).push.apply(_ret$context, _toConsumableArray(component.context || []));
    Object.assign(ret.scope, component.scope);
    var events = generateEvents(dictionary, component, pkg);
    if (childrenProperty) {
      ret.properties.children = childrenProperty;
    }
    ret.show = generateShow(component, ret, props);
    ret.isa = component.isa || [];
    ret.isa.forEach(function (supertype) {
      dictionary._registerIsa(name, supertype);
    });

    //config property
    ret.properties.config = {
      type: {
        $type: 'role type',
        role: 'type',
        type: {
          $type: 'one of',
          collection: true,
          types: [].concat(_toConsumableArray(events), ['style config', 'css class'])
        }
      },
      description: 'component configuration including style, classes, properties and events',
      expanded: true,
      hideName: true,
      title: 'component configuration'
    };
    ret.additional = ['config'];

    //registrations
    dictionary._registerType(props.name, props, pkg);
    dictionary._registerType(display.name, display, pkg);
    dictionary._registerType(ret.name, ret, pkg);
    dictionary._registerIsa(component.name, 'component');
    dictionary._registerFunction(component.name, generateComponentFn(component), pkg);
  } catch (e) {
    console.error('Failed to process component', component.name, component, '\n', e);
  }
}
function generateProps(component, props, slots) {
  return {
    name: 'props.' + component.name,
    properties: generatePropsProperties(props, slots)
  };
}
function registerCategories(dictionary, categories) {
  Object.entries(categories).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      category = _ref2[0],
      members = _ref2[1];
    (members || []).forEach(function (member) {
      dictionary._registerIsa(member, category, true);
    });
  });
}
function generatePropsProperties() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var slots = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var ret = {};
  //add plain properties
  for (var i = 0; i < props.length; ++i) {
    ret[props[i].name] = generatePropertyEntry(props[i], {});
  }

  //add slots that are not default
  for (var j = 0; j < slots.length; ++j) {
    if (slots[j].name === 'default' || !slots[j].name) {
      //this slot will be displayed as content elements
      continue;
    }
    var entry = generatePropertyEntry(slots[j], {
      role: 'type'
    });
    ret[slots[j].name] = entry;
  }
  ;
  return ret;
}
function generatePropertyEntry(prop, _ref3) {
  var role = _ref3.role;
  var ret = {
    type: getType(prop.type, role),
    title: prop.title || (0, _noCase.noCase)(prop.name),
    description: prop.description
  };
  if (prop.expanded) {
    ret.expanded = prop.expanded;
  }
  if (prop.initType) {
    ret.init = {
      $type: prop.initType
    };
  }
  return ret;
}
function generateComponentDisplay(component) {
  return {
    name: 'display.' + component.name,
    show: ['displayCondition'],
    displayCondition: {
      type: 'condition',
      placeholder: 'display condition',
      title: 'display condition',
      description: 'A condition determining if the component should be displayed. The component will only be displayed if the condition is true'
    },
    context: []
  };
}
function generateChildrenProperty(component) {
  if (!Array.isArray(component.slots)) {
    return undefined;
  }
  var defaultSlot = component.slots.find(function (s) {
    return s.name === 'default' || s.name === undefined;
  });
  if (!defaultSlot) {
    return undefined;
  }
  return {
    type: {
      $type: 'role type',
      role: 'type',
      type: getType(defaultSlot.type || 'component', null, true)
    },
    expanded: true,
    title: defaultSlot.title && defaultSlot.title !== 'default' ? defaultSlot.title : defaultSlot.type || 'content elements',
    description: defaultSlot.description,
    childSpec: {
      context: [{
        $type: "use context",
        path: "../.."
      }]
    }
  };
}
function generateShow(input, component, props) {
  var ret = [];
  if (input.show) {
    ret.push.apply(ret, _toConsumableArray(input.show));
  } else {
    var propList = Object.keys(props.properties).map(function (key) {
      return "props/".concat(key);
    });
    ret.push.apply(ret, _toConsumableArray(propList));
  }
  if (component.properties.children) {
    ret.push('children');
  }
  return ret;
}
function generateComponentFn(component) {
  var entry = {
    component: true,
    type: 'constant',
    importLibrary: component.importLibrary,
    name: component.importIdentifier || component.name
  };
  if (Array.isArray(component.slots)) {
    //generate slots
    if (!entry.options) {
      entry.options = {};
    }
    if (!entry.options.slots) {
      entry.options.slots = {};
    }
    component.slots.forEach(function (slot) {
      if (slot.name && slot.name !== 'default') {
        entry.options.slots[slot.name] = {
          name: slot.name,
          slotName: slot.slotName || slot.name
        };
      }
    });
  }
  if (component.placeholders) {
    if (!Array.isArray(component.placeholders)) {
      console.error('component placeholders must be an array. Got', component.placeholders);
    } else {
      //generate placeholders
      if (!entry.options) {
        entry.options = {};
      }
      entry.options.placeholders = component.placeholders;
    }
  }
  if (component.editModeStyle) {
    //generate edit mode style
    entry.options.devStyle = component.editModeStyle;
  }
  return entry;
}
function registerValues(dictionary, pkg) {
  var values = Array.isArray(pkg.values) ? pkg.values : [];
  values.forEach(function (value) {
    if (!value.call) {
      value.value = value.value !== undefined ? value.value : value.label || value.title || value.name;
      value.label = value.label || value.title || value.name;
      value.valueType = value.valueType || value.type;
      dictionary._registerInstance(value);
    } else if (value.call) {
      dictionary._registerType(value.name, {
        name: value.name,
        title: value.title || value.name,
        valueType: value.type,
        description: value.description,
        fn: {
          library: pkg.name,
          name: value.name,
          args: value.args || []
        },
        role: 'value'
      });
      dictionary._registerFunction(value.name, {
        library: pkg.name,
        name: value.name,
        args: value.args || []
      }, pkg);
    } else {
      console.error('Value entry must have either `value` or `call` properties', value);
    }
  });
}
function getType(base, role, collection) {
  if (typeof base !== 'string') {
    //we can only process string type - assuming this is an object type
    return base;
  }
  var parsed = base.match(/^(.*?)(\[\]|\*)?$/);
  if (parsed[2] || collection) {
    base = parsed[1] + '*'; //array
  }

  return {
    $type: role ? 'role type' : 'base type',
    type: base,
    role: role
  };
}
function registerTypes(dictionary, pkg) {
  (pkg.types || []).forEach(function (t) {
    dictionary._registerType(t.name, t, pkg);
    //register getters if required
    if (t.generateGetters) {
      Object.entries(t.properties || []).forEach(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 2),
          key = _ref5[0],
          value = _ref5[1];
        registerProperty(t.name, key, value, dictionary);
      });
    }
  });
}
function registerExpressions(dictionary, pkg) {
  var _pkg$expressions;
  if (pkg !== null && pkg !== void 0 && (_pkg$expressions = pkg.expressions) !== null && _pkg$expressions !== void 0 && _pkg$expressions.members) {
    return registerExpressions(pkg.expressions.members, pkg);
  }
  if (pkg.expressions && !Array.isArray(pkg.expressions)) {
    throw new Error("pkg expressions is not an array - " + JSON.stringify(pkg.expressions));
  }
  (pkg.expressions || []).forEach(function (t) {
    dictionary._registerType(t.name, t, pkg);
    dictionary._registerFunction(t.name, {
      library: pkg.name,
      name: t.importIdentifier,
      args: t.args || [],
      isFactory: t.isFactory || false
    }, pkg);
  });
}
function registerActions(dictionary, pkg) {
  (pkg.actions || []).forEach(function (t) {
    dictionary._registerType(t.name, t, pkg);
    dictionary._registerFunction(t.name, {
      library: pkg.name,
      name: t.importIdentifier,
      args: t.args || [],
      isFactory: t.isFactory || false
    }, pkg);
  });
}
function registerProperty(objectType, access, def, dictionary) {
  var propertyName = def.title || def.name || key;
  var name = 'get ' + objectType.toString() + '.' + propertyName;
  var description = def.description || "".concat(propertyName, " property of ").concat(objectType.toString());
  var basicValueType = (0, _type["default"])(getType(def.type));
  if (basicValueType.isCollection) {
    dictionary._registerType(name, {
      name: name,
      $generic: 'xget',
      title: propertyName + ' of a ' + objectType.toString(),
      description: description,
      inlineDetails: 'collapsed',
      pattern: propertyName + ' of <<object>>',
      properties: {
        object: {
          type: objectType
        },
        access: {
          init: access
        },
        itemCount: {
          type: 'number',
          title: 'number of items',
          placeholder: 'number of items',
          description: 'specify number of items to retreive. This cancels any paging capabilities of the property. i.e. the property value will be an array with max. number of items as the specified number.'
        }
      },
      show: ['itemCount'],
      valueType: (0, _type["default"])("dataset<".concat(basicValueType.singular.toString(), ">")),
      isa: ['data property']
    });
  } else {
    //property is not a collection
    dictionary._registerType(name, {
      name: name,
      title: propertyName + ' of a ' + objectType.toString(),
      description: description,
      pattern: propertyName + ' of <<object>>',
      properties: {
        object: {
          type: objectType
        },
        access: {
          init: access
        }
      },
      valueType: basicValueType,
      isa: ['data property']
    });
  }
}
function generateEvents(dictionary, component, pkg) {
  return (component.events || []).map(function (evt) {
    var entity = {
      name: "".concat(evt.name, ".").concat(component.name),
      title: evt.title + ' (event)',
      description: evt.description,
      pattern: 'on ' + evt.title + ': <<value>>',
      $generic: 'component config',
      $specialized: {
        key: evt.name,
        type: 'event'
      },
      properties: {
        value: {
          type: {
            $type: 'role type',
            type: 'action',
            role: 'type'
          },
          placeholder: 'event handler',
          description: evt.description,
          viewerOptions: {
            initialCode: 'function(evt){\n  //your event handler code here\n}',
            title: "Event handler for ".concat(evt.title, " event")
          }
        }
      }
    };
    dictionary._registerType(entity.name, entity, pkg);
    return entity.name;
  });
}