"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Parser = void 0;
var _pattern = require("./pattern.js");
var _stringify = _interopRequireDefault(require("./stringify.js"));
var _moo = _interopRequireDefault(require("moo"));
var _location = require("./location.js");
var _parsely = require("./parsely.js");
var _type = _interopRequireDefault(require("./type.js"));
var _templateType = _interopRequireDefault(require("./template-type.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
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
    this.specializedTypes = [];
    this.grammer = {
      ParserRules: [],
      ParserStart: 'type:interact action',
      Lexer: lexer
    };
    addBaseRules(this.grammer);
    Object.freeze(this);
  }
  _createClass(Parser, [{
    key: "_addRule",
    value: function _addRule(rule, spec) {
      var _this = this;
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
      if (spec && spec.specializedFor) {
        //add for deferred expansion
        this.specializedTypes.push({
          rule: rule,
          T: spec.specializedFor
        });
      } else {
        this.grammer.ParserRules.push(rule);
      }
    }
  }, {
    key: "addInstance",
    value: function addInstance(spec) {
      //first add the value tokenized
      this._addRule({
        name: spec.valueType,
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
        var _parser$_addRule;
        //TODO make sure pattern is text only without fields
        parser._addRule((_parser$_addRule = {
          name: spec.valueType,
          description: spec.description,
          noSuggest: true,
          postprocess: function postprocess() {
            return spec.value;
          }
        }, _defineProperty(_parser$_addRule, "noSuggest", true), _defineProperty(_parser$_addRule, "symbols", tokenize.bind(lexer)(pattern).map(function (token) {
          return {
            literal: token
          };
        })), _parser$_addRule), spec);
      });
      //add value not tokenized - used for suggestTokens
      this._addRule({
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
          if (typeof symbol === 'string' && symbol.endsWith('*') && !plurals[symbol]) {
            //need to add a rule for this list
            plurals[symbol] = true;
            var singular = symbol.substring(0, symbol.length - 1);
            _this2.grammer.ParserRules.push({
              name: symbol,
              symbols: [symbol, 'LIST_SEP', singular],
              postprocess: listPush
            }, {
              name: symbol,
              symbols: [singular]
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
      var parser = this;
      if (!pkg) {
        //skip types without a package
        return;
      }
      if (pkg.name === 'base') {
        //skip base pkg
        return;
      }
      var pattern = spec.pattern;
      if (pattern) {
        if (spec.valueType) {
          var rules = (0, _pattern.patternAsGrammer)(spec.valueType, pattern, spec, tokenize.bind(lexer), parser.dictionary, pkg._id);
          parser._addRule(rules, spec);
        } else {
          //add the basic rule
          var basicRule = (0, _pattern.patternAsGrammer)(spec.name + (spec.specializedFor ? '<t>' : ''), pattern, spec, tokenize.bind(lexer), this.dictionary, pkg._id);
          parser._addRule(basicRule, spec);
        }

        //add altPattern if exists
        if (spec.altPatterns) {
          spec.altPatterns.forEach(function (pattern) {
            if (spec.valueType) {
              var _rules = (0, _pattern.patternAsGrammer)(spec.valueType, pattern, spec, tokenize.bind(lexer), parser.dictionary, pkg._id);
              parser._addRule(_rules, spec);
            } else {
              //add the basic rule
              var _basicRule = (0, _pattern.patternAsGrammer)(spec.name + (spec.specializedFor ? '<t>' : ''), pattern, spec, tokenize.bind(lexer), _this3.dictionary, pkg._id);
              parser._addRule(_basicRule, spec);
            }
            //add the type rule
            var typeRule = (0, _pattern.patternAsGrammer)('type:' + spec.name + (spec.specializedFor ? '<t>' : ''), pattern, spec, tokenize.bind(lexer), _this3.dictionary, pkg._id);
            parser._addRule(typeRule, spec);
          });
        }
        //add the type rule
        var typeRule = (0, _pattern.patternAsGrammer)('type:' + spec.name + (spec.specializedFor ? '<t>' : ''), pattern, spec, tokenize.bind(lexer), this.dictionary, pkg._id);
        try {
          parser._addRule(typeRule, spec);
        } catch (e) {
          this.dictionary.error('addRule got exception', e);
        }

        //add isa rules
        (spec.isa || []).forEach(function (isa) {
          var isaRule = {
            name: 'type:' + isa,
            symbols: ['type:' + spec.name + (spec.specializedFor ? '<t>' : '')],
            source: spec.name + '$isa',
            postprocess: takeFirst
          };
          parser._addRule(isaRule, spec);
        });
      } else {}
      if (spec.basicType && !spec.optionsOnly) {
        //if options are suggested, then we are limited to the options
        parser._addRule({
          name: spec.name,
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
            symbols: [{
              example: literal
            }],
            source: spec.name + '$example',
            postprocess: takeFirst
          });
        });
      }
      if (spec.isa.includes('data item')) {
        //generate types for all the properties
        Object.entries(spec.properties || {}).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];
          var type = typeAsString(value.type);
          if (['string', 'number'].includes(type)) {
            type = 'value:' + type;
          }
          var ruleName = "string<".concat(spec.name, ".").concat(key, ">");
          _this3._addRule({
            name: ruleName,
            description: value.description,
            symbols: [type],
            source: spec.name,
            postprocess: takeFirst
          });
          //if there are examples then generate them
          if (value.examples) {
            value.examples.forEach(function (example) {
              var rule = {
                name: ruleName,
                symbols: [{
                  example: JSON.stringify(example)
                }],
                source: spec.name,
                postprocess: takeFirst
              };
              _this3._addRule(rule);
            });
          }
        });
      }
    }
  }, {
    key: "addIsa",
    value: function addIsa(type, parent) {
      var isaRule = {
        name: 'type:' + parent,
        symbols: ['type:' + type],
        source: 'isa',
        postprocess: takeFirst
      };
      this._addRule(isaRule);
    }

    /**
     * Called after adding the last type. This is when macro expansion is done
     */
  }, {
    key: "endTypes",
    value: function endTypes() {
      var _this4 = this;
      this.specializedTypes.forEach(function (st) {
        return _this4.expandTemplateRule(st);
      });
      this._ensurePlurals();
    }
  }, {
    key: "expandTemplateRule",
    value: function expandTemplateRule(_ref3) {
      var _this5 = this;
      var rule = _ref3.rule,
        T = _ref3.T;
      var sList = this.dictionary.getClassMembers(T);
      sList.forEach(function (s) {
        var _expandSymbols = expandSymbols(rule.symbols, s, _this5.dictionary),
          symbols = _expandSymbols.symbols,
          mapping = _expandSymbols.mapping;
        var sRule = {
          name: parameterizeType(rule.name, s),
          postprocess: rule.postprocess ? generatePostprocessSpecialized(rule.postprocess, s, mapping) : null,
          symbols: symbols,
          specializedFor: s
        };
        _this5.grammer.ParserRules.push(sRule);
      });
    }
  }, {
    key: "getGrammer",
    value: function getGrammer() {
      return this.grammer;
    }
  }, {
    key: "parse",
    value: function parse(text) {
      var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'type:interact action';
      var logger = arguments.length > 2 ? arguments[2] : undefined;
      this.grammer.ParserStart = target;
      logger.debug('parsing text', JSON.stringify(text));
      logger.debug('target is', target);
      var parser = new _parsely.Parser(this.grammer);
      try {
        var res = parser.feed(text);
        if (res.results) {
          return res.results;
        } else {
          logger.debug('... no results found.');
          return [];
        }
      } catch (e) {
        logger.debug('parse failed at pos', e.offset, 'unexpected token', JSON.stringify(e.token));
        return [];
      }
    }
  }, {
    key: "parseWants",
    value: function parseWants(text) {
      var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'type:interact action';
      this.grammer.ParserStart = target;
      var parser = new _parsely.Parser(this.grammer);
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
function printStateDependant(state, states) {
  var indent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var includeCompleted = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var logger = arguments.length > 4 ? arguments[4] : undefined;
  states.filter(function (state1) {
    return state1.wantedBy.includes(state);
  }).forEach(function (s) {
    if (s.isComplete && !includeCompleted) {
      return;
    }
    logger.log(''.padStart(indent * 2, ' '), state.dot, ruleText(s.rule));
  });
}
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
function markStringPos(text, pos) {
  return text.slice(0, pos) + '^' + text.slice(pos);
}
function parameterizeType(type, parameter) {
  var match1 = type.match(/^((?:type|value)\:)?(t|T)$/);
  if (match1) {
    return (match1[1] || '') + parameter;
  }
  return type.replace(/^(?:t|T)<(.*)>([\*\?]*)$/, parameter + '<$1>$2').replace(/^(.*)<(?:t|T)>([\*\?]*)$/, '$1<' + parameter + '>$2').replace(/^(?:t|T)([\*\?]*)$/, parameter + '$2');
}

/**
 * Expand template expansion items. Provide the new symbols list and the mapping from current symbol list to previous symbol list so we can pass to the postprocess function the data array it expects
 * @param {*} source 
 * @param {*} s 
 * @param {*} dictionary 
 * @returns 
 */
function expandSymbols(source, s, dictionary) {
  var symbols = [];
  var mapping = [];
  source.forEach(function (item) {
    if (typeof item !== 'string') {
      mapping.push(symbols.length);
      symbols.push(item);
    } else {
      var matched = item.match(/^\s*T\s*\|(.+)$/);
      if (matched) {
        //this is an expansion item. Replace with literal and tokenize
        var spec = dictionary.getTypeSpec(s);
        var text = spec[matched[1]];
        var tokens = tokenize.call(lexer, text);
        mapping.push(symbols.length);
        symbols.push.apply(symbols, _toConsumableArray(tokens.map(function (token) {
          return {
            literal: token
          };
        })));
      } else {
        mapping.push(symbols.length);
        symbols.push(parameterizeType(item, s));
      }
    }
  });
  return {
    symbols: symbols,
    mapping: mapping
  };
}
//first check if the value can be translated

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
function dumpParser(res, dictionary, logger) {
  logger.log(markStringPos(res.lexer.buffer, res.lexer.col), '==>', res);
  var hasResults = res.results.length > 0;
  if (hasResults) {
    logger.log('RESULTS:');
    res.results.forEach(function (result) {
      logger.log((0, _stringify["default"])((0, _location.createLocation)(result, dictionary)), result);
    });
  }
  var column = res.table[res.current];
  column.states.forEach(function (state) {
    if (state.wantedBy.length > 0) {
      return;
    }
    logger.log('  ', state.dot, state.rule.postprocess ? (state.rule.postprocess.typeName || '') + ':' : '?', ruleText(state.rule));
    printStateDependant(state, column.states, 3, hasResults);
  });
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
function traceContext(contextName, state) {
  var path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  if (!state) {
    return;
  }
  var newPath = path.concat(state);
  if (state.context) {//db} && state.context[contextName]){
  } else {
    state.wantedBy.forEach(function (state) {
      return traceContext(contextName, state, newPath);
    });
    traceContext(contextName, state.left, newPath);
  }
}

/** postprocess function that calls wrap function and ads $specializedFor property to output object */
function postprocessSpecialized(data, reference, fail) {
  var fn = this.fn,
    specializedFor = this.specializedFor,
    mapping = this.mapping;
  var mappedData = mapping.map(function (pos) {
    return data[pos];
  });
  var ret = fn(mappedData, reference, fail);
  if (ret && _typeof(ret) === 'object') {
    ret.$specializedFor = specializedFor;
  }
  return ret;
}
function generatePostprocessSpecialized(fn, specializedFor, mapping) {
  return postprocessSpecialized.bind({
    fn: fn,
    specializedFor: specializedFor,
    mapping: mapping
  });
}