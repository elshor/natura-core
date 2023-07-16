"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Parser = void 0;
var _pattern = require("./pattern.js");
var _moo = _interopRequireDefault(require("moo"));
var _parsely = require("./parsely.js");
var _type = _interopRequireDefault(require("./type.js"));
var _templateType = _interopRequireDefault(require("./template-type.js"));
var _relStore = _interopRequireDefault(require("./rel-store.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var MAX_FLAT_DEPTH = 1000; //used to flatten strings

var lexer = _moo["default"].compile({
  SP: /[ \t]+/,
  ESCAPED_DBQT: /\\"/,
  COMMA: /,/,
  WS: /[ \t]+/,
  DIGIT: /[0-9]/,
  token: /[^\\\d\"\'\`\s,.\/#!$%\^&\*;:{}=\-_`~()]+/,
  DBQT: /"/,
  NL: {
    match: /\n/,
    lineBreaks: true
  },
  ch: /./
});
function tokenize(text) {
  var ret = [];
  this.reset(text);
  var current;
  while (current = this.next()) {
    ret.push(current.value);
  }
  return ret;
}
var Parser = /*#__PURE__*/function () {
  function Parser(dictionary) {
    _classCallCheck(this, Parser);
    this.dictionary = dictionary;
    this.assertions = new _relStore["default"]();
    this.grammer = {
      ParserRules: [],
      ParserStart: 'interact action',
      Lexer: lexer
    };
    this.compiledGrammer = null;
    addBaseRules(this.grammer);
  }
  _createClass(Parser, [{
    key: "_addRule",
    value: function _addRule(rule, spec) {
      var _this = this;
      this.compiledGrammer = null;
      if (!rule) {
        return;
      }
      if (Array.isArray(rule)) {
        return rule.forEach(function (r) {
          return _this._addRule(r, spec);
        });
      }
      if ((spec === null || spec === void 0 ? void 0 : spec.noSuggest) === true) {
        rule.noSuggest = true;
      }
      console.assert(!rule.name.includes('-'), 'Rule name cannot include - : ' + rule.name);
      this.grammer.ParserRules.push(rule);
    }
  }, {
    key: "addInstance",
    value: function addInstance(spec, pkg) {
      this.compiledGrammer = null;
      //first add the value tokenized
      this._addRule({
        name: spec.valueType,
        pkg: pkg.name,
        description: spec.description,
        postprocess: function postprocess() {
          return spec.value;
        },
        noSuggest: spec.noSuggest,
        symbols: tokenize.bind(lexer)(spec.pattern || spec.label).map(function (token) {
          return {
            literal: token
          };
        })
      }, spec);

      //add altPattern if exists
      var parser = this;
      (spec.altPatterns || []).forEach(function (pattern) {
        //TODO make sure pattern is text only without fields
        parser._addRule({
          name: spec.valueType,
          pkg: pkg.name,
          description: spec.description,
          postprocess: function postprocess() {
            return spec.value;
          },
          noSuggest: false,
          //altPatterns should not be suggested
          symbols: tokenize.bind(lexer)(pattern).map(function (token) {
            return {
              literal: token
            };
          })
        }, spec);
      });
      //add value not tokenized - used for suggestTokens
      this._addRule({
        pkg: pkg.name,
        name: spec.valueType,
        description: spec.description,
        postprocess: function postprocess() {
          return spec.value;
        },
        noSuggest: spec.noSuggest,
        symbols: [{
          literal: spec.label
        }]
      }, spec);
    }
  }, {
    key: "_ensurePlurals",
    value: function _ensurePlurals() {
      var _this2 = this;
      //make sure all plural types (ending with *) are defined
      var plurals = {};
      this.grammer.ParserRules.forEach(function (rule) {
        rule.symbols.forEach(function (symbol) {
          var parsed = symbol.toString().match(/(.+)\*(\<.+\>)?$/);
          var singular = parsed ? parsed[1] : null;
          var ending = singular ? parsed[2] ? '<T>' : '' : '';
          if (singular && !plurals[singular + ending]) {
            //need to add a rule for this list
            plurals[singular + ending] = true;
            _this2.grammer.ParserRules.push({
              name: singular + '*',
              symbols: [singular + '*' + ending, 'LIST_SEP', singular + ending],
              postprocess: listPush
            }, {
              name: singular + '*',
              symbols: [singular + ending]
            });
          }
          if (typeof symbol === 'string' && symbol.match(/^no-repeat-type-list\<(.*)\>$/) && !plurals[symbol]) {
            //need to add a list with no-repeat-type constraint
            plurals[symbol] = true;
            var _singular = symbol.match(/^no-repeat-type-list\<(.*)\>$/)[1];
            _this2.grammer.ParserRules.push({
              name: symbol,
              symbols: [symbol, 'LIST_SEP', _singular],
              postprocess: noRepeatTypeListPush,
              preprocess: function preprocess(state) {
                //traceContext('noRepeatType',state)
              }
            }, {
              name: symbol,
              symbols: [_singular],
              preprocess: function preprocess(state) {
                //console.log('start no-repeat-list',singular)
                //traceContext('noRepeatType',state)
                //state.context = {
                //	noRepeatType:true
                //}
              }
            });
          }
        });
      });
    }
  }, {
    key: "addType",
    value: function addType(spec, pkg) {
      var _this3 = this;
      this.compiledGrammer = null;
      var parser = this;
      if (!pkg || pkg.name === 'base' || !spec.pattern) {
        //skip types without a package or pattern
        return;
      }
      var names = [spec.name].concat(_toConsumableArray(spec.isa || []));
      var patterns = [spec.pattern].concat(_toConsumableArray(spec.altPatterns || []));
      patterns.forEach(function (pattern) {
        var rules = (0, _pattern.patternAsGrammer)(spec.name, pattern, spec, tokenize.bind(lexer), _this3.dictionary, pkg._id);
        rules.forEach(function (rule) {
          names.forEach(function (name) {
            var copy = Object.assign({}, rule);
            copy.name = name;
            copy.pkg = pkg.name;
            parser._addRule(copy, spec);
          });
        });
      });
      if (spec.basicType && !spec.optionsOnly) {
        //if options are suggested, then we are limited to the options
        parser._addRule({
          name: spec.name,
          pkg: pkg.name,
          symbols: [spec.basicType],
          source: spec.name + '$basic',
          postprocess: takeFirst
        });
      }
      if (spec.examples) {
        //generate examples
        spec.examples.forEach(function (example) {
          var literal = spec.basicType ? JSON.stringify(example) : example.toString();
          _this3._addRule({
            name: spec.name,
            pkg: pkg.name,
            symbols: [{
              example: literal
            }],
            source: spec.name + '$example',
            postprocess: takeFirst
          });
        });
      }
    }
  }, {
    key: "addAssertion",
    value: function addAssertion(type, assertion, pkg) {
      this.compiledGrammer = null;
      this.assertions.addAssertion(type, assertion, pkg.name);
    }

    /**
     * Called after adding the last type. This is when macro expansion is done
     */
  }, {
    key: "endTypes",
    value: function endTypes() {
      this._ensurePlurals();
    }
  }, {
    key: "getGrammer",
    value: function getGrammer() {
      if (!this.compiledGrammer) {
        this.compiledGrammer = _parsely.Grammar.fromCompiled(this.grammer, this.assertions);
      }
      return this.compiledGrammer;
    }
  }, {
    key: "parse",
    value: function parse(text) {
      var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'interact action';
      var logger = arguments.length > 2 ? arguments[2] : undefined;
      this.grammer.ParserStart = target;
      var parser = new _parsely.Parser(this.getGrammer());
      try {
        var res = parser.feed(text);
        if (res.results) {
          return res.results;
        } else {
          return [];
        }
      } catch (e) {
        return [];
      }
    }
  }, {
    key: "parseWants",
    value: function parseWants(text) {
      var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'interact action';
      this.grammer.ParserStart = target;
      var parser = new _parsely.Parser(this.getGrammer());
      try {
        var res = parser.feed(text);
        return {
          completed: true,
          wants: parser.table[parser.current].wants
        };
      } catch (e) {
        return {
          completed: false,
          wants: parser.table[parser.current].wants
        };
      }
    }
  }, {
    key: "_dumpParseRules",
    value: function _dumpParseRules(target, logger) {
      logger.log('dumping rules for', target);
      this.grammer.ParserRules.forEach(function (rule) {
        if (rule.name === target) {
          logger.log('  ', ruleText(rule));
        }
      });
    }
  }, {
    key: "_dumpUsedBy",
    value: function _dumpUsedBy(target, logger) {
      logger.log('dumping rules used by', target);
      this.grammer.ParserRules.forEach(function (rule) {
        if (rule.symbols.find(function (symbol) {
          return symbol === target;
        })) {
          logger.log('  ', ruleText(rule));
        }
      });
    }
  }]);
  return Parser;
}();
exports.Parser = Parser;
function ruleText(rule) {
  var ret = rule.name + ' => ';
  ret += rule.symbols.map(function (symbol) {
    if (typeof symbol === 'string') {
      return symbol;
    } else if (symbol.type) {
      return '%' + symbol.type;
    } else {
      return JSON.stringify(symbol.literal);
    }
  }).join(',');
  return ret;
}
function addBaseRules(grammer) {
  grammer.ParserRules.push({
    name: 'digit',
    symbols: [{
      type: 'DIGIT'
    }],
    postprocess: function postprocess(data) {
      return Number.parseInt(data[0].text);
    }
  }, {
    name: 'dbqt-text',
    symbols: [/[^"]+|\\"/]
  }, {
    name: 'dbqt-text',
    symbols: ['dbqt-text', /[^"]+|\\"/]
  }, {
    name: 'value:string',
    symbols: [{
      type: 'DBQT'
    }, 'dbqt-text', {
      type: 'DBQT'
    }],
    postprocess: joinText
  }, {
    name: 'value:string',
    symbols: [{
      type: 'DBQT'
    }, {
      type: 'DBQT'
    }],
    postprocess: joinText
  }, {
    name: 'value:number',
    symbols: ['number'],
    postprocess: takeFirst
  }, {
    name: 'string',
    symbols: [{
      type: 'DBQT'
    }, 'dbqt-text', {
      type: 'DBQT'
    }],
    postprocess: joinText
  }, {
    name: 'string',
    symbols: [{
      type: 'DBQT'
    }, {
      type: 'DBQT'
    }],
    postprocess: function postprocess(data) {
      return '';
    }
  }, {
    name: 'integer',
    symbols: ['digit'],
    postprocess: takeFirst
  }, {
    name: 'integer',
    symbols: ['integer', 'digit'],
    postprocess: function postprocess(data) {
      return data[0] * 10 + data[1];
    }
  }, {
    name: 'number',
    symbols: ['integer', 'fractional'],
    postprocess: function postprocess(data) {
      return data[0] + data[1].numerator / data[1].denominator;
    }
  }, {
    name: 'number',
    symbols: ['fractional'],
    postprocess: function postprocess(data) {
      return data[0].numerator / data[0].denominator;
    }
  }, {
    name: 'number',
    symbols: ['integer'],
    postprocess: takeFirst
  }, {
    name: 'fractional',
    symbols: ['fractional', 'digit'],
    postprocess: function postprocess(data) {
      return {
        numerator: data[1] + data[0].numerator * 10,
        denominator: data[0].denominator * 10
      };
    }
  }, {
    name: 'fractional',
    symbols: [{
      literal: '.'
    }, 'digit'],
    postprocess: function postprocess(data) {
      return {
        numerator: data[1],
        denominator: 10
      };
    }
  }, {
    name: 'SP',
    symbols: [{
      type: 'SP'
    }],
    postprocess: function postprocess() {
      return null;
    }
  }, {
    name: '_',
    symbols: [{
      type: 'SP'
    }],
    postprocess: function postprocess() {
      return null;
    }
  }, {
    name: 'SP?',
    symbols: [],
    postprocess: function postprocess() {
      return null;
    }
  }, {
    name: 'SP?',
    symbols: ['SP'],
    postprocess: function postprocess() {
      return null;
    }
  }, {
    name: 'COMMA',
    symbols: [{
      type: 'COMMA'
    }],
    postprocess: function postprocess() {
      return null;
    }
  }, {
    name: 'COMMA?',
    symbols: ['COMMA'],
    postprocess: function postprocess() {
      return null;
    }
  }, {
    name: 'COMMA?',
    symbols: [],
    postprocess: function postprocess() {
      return null;
    }
  }, {
    name: 'FRAGMENT_SEP',
    symbols: ['SP?', 'COMMA', 'SP?']
  }, {
    name: 'FRAGMENT_SEP',
    symbols: ['SP']
  }, {
    name: 'LIST_SEP',
    symbols: ['SP?', 'COMMA', 'SP?']
  }, {
    name: 'CONSTRAINT',
    symbols: [],
    postprocess: function postprocess(data, reference, fail, state) {}
  });
}
function listPush(data) {
  var ret = [].concat(_toConsumableArray(data[0]), [data[2]]);
  return ret;
}
function noRepeatTypeListPush(data) {
  //console.log('noRepeatTypeListPush',data);
  return listPush(data);
}
function takeFirst(data) {
  return data[0];
}
function joinText(data) {
  return JSON.parse(data.flat(MAX_FLAT_DEPTH).map(function (item) {
    return item.value || item.text;
  }).join(''));
}
function typeAsString(type) {
  var typeObject = (0, _type["default"])(type);
  if (typeObject instanceof _templateType["default"]) {
    console.error('Template types are not supported', type);
  }
  var ret = typeObject.toString();
  return ret;
}
function addPackage(ruleOrRules, pkg) {
  (Array.isArray(ruleOrRules) ? ruleOrRules : [ruleOrRules]).forEach(function (rule) {
    rule.pkg = pkg.name;
  });
  return ruleOrRules;
}