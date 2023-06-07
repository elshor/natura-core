import { patternAsGrammer } from "./pattern.js";
import moo from 'moo'
import { Parser as Parsley, Grammar } from "./parsely.js";
import Type from './type.js'
import TemplateType from "./template-type.js";

const MAX_FLAT_DEPTH = 1000 //used to flatten strings

const lexer = moo.compile({
	SP: /[ \t]+/,
	ESCAPED_DBQT: /\\"/,
	COMMA: /,/,
	WS:      /[ \t]+/,
	DIGIT: /[0-9]/,
	token: /[^\\\d\"\'\`\s,.\/#!$%\^&\*;:{}=\-_`~()]+/,
	DBQT: /"/,
	NL:      { match: /\n/, lineBreaks: true },
	ch: /./
})
function tokenize(text){
	const ret = [];
	this.reset(text);
	let current;
	while(current = this.next()){
		ret.push(current.value);
	}
	return ret;
}
export class Parser {
	constructor(dictionary){
		this.dictionary = dictionary;
		this.specializedTypes = [];
		this.assertions = {};
		this.grammer = {
			ParserRules: [],
			ParserStart: 'interact action',
			Lexer: lexer
		}
		this.compiledGrammer = null;
		addBaseRules(this.grammer);
	}

	_addRule(rule, spec){
		this.compiledGrammer = null;
		if(!rule){
			return;
		}
		if(Array.isArray(rule)){
			return rule.forEach(r=>this._addRule(r, spec))
		}
		if(spec?.noSuggest === true){
			rule.noSuggest = true
		}
		if(spec && spec.specializedFor){
			//add for deferred expansion
			this.specializedTypes.push({
				rule, 
				T: spec.specializedFor
			});
		}else{
			this.grammer.ParserRules.push(rule);
		}
	}
	addInstance(spec){
		this.compiledGrammer = null;
		//first add the value tokenized
		this._addRule({
			name: spec.valueType,
			description: spec.description,
			postprocess(){
				return spec.value;
			},
			noSuggest: spec.noSuggest,
			symbols: tokenize.bind(lexer)(spec.pattern || spec.label).map(token=>({literal: token}))
		}, spec)
		
		//add altPattern if exists
		const parser = this;
		(spec.altPatterns || []).forEach(pattern=>{
			//TODO make sure pattern is text only without fields
			parser._addRule({
				name: spec.valueType,
				description: spec.description,
				noSuggest: true,
				postprocess(){
					return spec.value;
				},
				noSuggest: true,//altPatterns should not be suggested
				symbols: tokenize.bind(lexer)(pattern).map(token=>({literal: token}))
			}, spec)
			})
		//add value not tokenized - used for suggestTokens
		this._addRule({
			name: spec.valueType,
			description: spec.description,
			postprocess(){
				return spec.value;
			},
			noSuggest: spec.noSuggest,
			symbols: [{literal: spec.label}]
		}, spec)
	}
	_ensurePlurals(){
		//make sure all plural types (ending with *) are defined
		const plurals = {};
		this.grammer.ParserRules.forEach(rule=>{
			rule.symbols.forEach(symbol=>{
				if(typeof symbol === 'string' && symbol.endsWith('*') && !plurals[symbol]){
					//need to add a rule for this list
					plurals[symbol] = true;
					const singular = symbol.substring(0,symbol.length - 1);
					this.grammer.ParserRules.push({
						name: symbol,
						symbols: [symbol, 'LIST_SEP', singular],
						postprocess: listPush
					},{
						name: symbol,
						symbols: [ singular ]
					})
				}
				if(
					typeof symbol === 'string' &&
					symbol.match(/^no-repeat-type-list\<(.*)\>$/) && 
					!plurals[symbol]
				){
					//need to add a list with no-repeat-type constraint
					plurals[symbol] = true;
					const singular = symbol.match(/^no-repeat-type-list\<(.*)\>$/)[1]
					this.grammer.ParserRules.push({
						name: symbol,
						symbols: [symbol, 'LIST_SEP', singular],
						postprocess: noRepeatTypeListPush,
						preprocess(state){
							//traceContext('noRepeatType',state)
						}
					},{
						name: symbol,
						symbols: [ singular ],
						preprocess(state){
							//console.log('start no-repeat-list',singular)
							//traceContext('noRepeatType',state)
							//state.context = {
							//	noRepeatType:true
							//}
						}
					})
				}
			})
		})
	}
	addType(spec, pkg){
		this.compiledGrammer = null;
		const parser = this;
		if(!pkg){
			//skip types without a package
			return;
		}
		if(pkg.name === 'base'){
			//skip base pkg
			return;
		}
		const pattern = spec.pattern;
		if(pattern){
			if(spec.valueType){
				const rules = patternAsGrammer(
					spec.valueType,
					pattern, 
					spec, 
					tokenize.bind(lexer),
					parser.dictionary,
					pkg._id
				);
				parser._addRule(rules, spec);
			}else{
				//add the basic rule
				const basicRule = patternAsGrammer(
					spec.name + (spec.specializedFor? '<t>' : ''), 
					pattern, 
					spec,
					tokenize.bind(lexer),
					this.dictionary,
					pkg._id
				) 
				parser._addRule(basicRule, spec)
			}
			
			//add altPattern if exists
			if(spec.altPatterns){
				spec.altPatterns.forEach(pattern=>{
					if(spec.valueType){
						const rules = patternAsGrammer(
							spec.valueType,
							pattern, 
							spec, 
							tokenize.bind(lexer),
							parser.dictionary,
							pkg._id
						);
						parser._addRule(rules, spec);
					}else{
						//add the basic rule
						const basicRule = patternAsGrammer(
							spec.name + (spec.specializedFor? '<t>' : ''), 
							pattern, 
							spec,
							tokenize.bind(lexer),
							this.dictionary,
							pkg._id
						) 
						parser._addRule(basicRule, spec)
					}
					//add the type rule
					const typeRule = patternAsGrammer(
						spec.name + (spec.specializedFor? '<t>' : ''), 
						pattern, 
						spec,
						tokenize.bind(lexer),
						this.dictionary,
						pkg._id
					) 
					parser._addRule(typeRule, spec)
				})
			}
			//add the type rule
			const typeRule = patternAsGrammer(
				spec.name + (spec.specializedFor? '<t>' : ''), 
				pattern, 
				spec,
				tokenize.bind(lexer),
				this.dictionary,
				pkg._id
			) 
			try{
				parser._addRule(typeRule, spec)
			}catch(e){
				this.dictionary.error('addRule got exception',e);
			}

			//add isa rules
			(spec.isa || []).forEach(isa=>{
				const isaRule = {
					name:  isa,
					symbols: [ spec.name + (spec.specializedFor? '<t>' : '')],
					source: spec.name + '$isa',
					postprocess: takeFirst
				}
				parser._addRule(isaRule, spec)
			})
		}else{
		}
		if(spec.basicType && !spec.optionsOnly){
			//if options are suggested, then we are limited to the options
			parser._addRule({
				name: spec.name,
				symbols: [spec.basicType],
				source: spec.name + '$basic',
				postprocess: takeFirst
			})
		}

		if(spec.examples){
			//generate examples
			spec.examples.forEach(example=>{
				const literal = spec.basicType
					? JSON.stringify(example) 
					: example.toString();
				this._addRule({
					name: spec.name,
					symbols:[{example:literal}],
					source: spec.name + '$example',
					postprocess: takeFirst
				})
			})
		}

		if(spec.isa.includes('data item')){
			//generate types for all the properties
			Object.entries(spec.properties || {}).forEach(([key,value])=>{
				let type = typeAsString(value.type);
				if(['string','number'].includes(type)){
					type = 'value:' + type;
				}
				const ruleName = `string<${spec.name}.${key}>`;
				this._addRule({
					name: ruleName,
					description: value.description,
					symbols:[type],
					source: spec.name,
					postprocess: takeFirst
				})
				//if there are examples then generate them
				if(value.examples){
					value.examples.forEach(example=>{
						const rule = {
							name: ruleName,
							symbols:[{example:JSON.stringify(example)}],
							source: spec.name,
							postprocess: takeFirst
						}
						this._addRule(rule)
					})
				}
			})
		}
	}

	addIsa(type, parent){
		this.compiledGrammer = null;
		const isaRule = {
			name: parent,
			symbols: [ type ],
			source: 'isa',
			postprocess: takeFirst
		}
		this._addRule(isaRule)
}

	addAssertion(type, assertion){
		this.compiledGrammer = null;
		if(!this.assertions[assertion]){
			this.assertions[assertion] = [];
		}
		if(!this.assertions[assertion].includes(type)){
			this.assertions[assertion].push(type);
		}
	}

	/**
	 * Called after adding the last type. This is when macro expansion is done
	 */
	endTypes(){
		this.specializedTypes.forEach(st=>this.expandTemplateRule(st))
		this._ensurePlurals()
	}

	expandTemplateRule({rule, T}){
		const sList = this.dictionary.getClassMembers(T);
		sList.forEach(s=>{
			const ruleSpec = this.dictionary.getTypeSpec(rule.source);
			const assertions = ruleSpec.assertions || [];
			console.assert(Array.isArray(assertions), 'Assertions is not an array', ruleSpec);
			assertions.forEach(assertion=>{
				this.addAssertion(
					parameterizeType(rule.name, s),
					parameterizeType(assertion,s)
				)
			})
			const {symbols, mapping} = expandSymbols(rule.symbols, s, this.dictionary)
			const sRule = {
				name: parameterizeType(rule.name, s),
				postprocess: rule.postprocess
					? generatePostprocessSpecialized(rule.postprocess,s, mapping)
					: null,
				symbols,
				specializedFor: s
			}
			this.grammer.ParserRules.push(sRule);
		})
	}
	getGrammer(){
		if(!this.compiledGrammer){
			this.compiledGrammer = Grammar.fromCompiled(this.grammer, this.assertions)
		}
		return this.compiledGrammer;
	}

	parse(text, target='interact action', logger){
		this.grammer.ParserStart = target;
		logger.debug('parsing text',JSON.stringify(text));
		logger.debug('target is',target)
		const parser = new Parsley(this.getGrammer());
		try{
			const res = parser.feed(text);
			if(res.results){
				return res.results;
			}else{
				logger.debug('... no results found.')
				return [];
			}
		}catch(e){
			logger.debug('parse failed at pos',e.offset,'unexpected token',JSON.stringify(e.token));
			return [];
		}
	}

	parseWants(text, target='interact action'){
		this.grammer.ParserStart = target;
		const parser = new Parsley(this.getGrammer());
		try{
			const res = parser.feed(text);
			return {
				completed: true,
				wants: parser.table[parser.current].wants
			}
		}catch(e){
			return {
				completed: false,
				wants: parser.table[parser.current].wants
			}
		}
	}

	_dumpParseRules(target, logger){
		logger.log('dumping rules for',target);
		this.grammer.ParserRules.forEach(rule=>{
			if(rule.name === target){
				logger.log('  ', ruleText(rule));
			}
		})
	}
	_dumpUsedBy(target, logger){
		logger.log('dumping rules used by',target);
		this.grammer.ParserRules.forEach(rule=>{
			if(rule.symbols.find(symbol=>symbol=== target)){
				logger.log('  ', ruleText(rule));
			}
		})
	}
}

function printStateDependant(state, states, indent=1, includeCompleted=false, logger){
	states
		.filter(state1=>state1.wantedBy.includes(state))
		.forEach(s=>{
			if(s.isComplete && !includeCompleted){
				return;
			}
			logger.log(
				''.padStart(indent*2,' '),
				state.dot,
				ruleText(s.rule)
			)
		})
}

function ruleText(rule){
	let ret = rule.name + ' => ';
	ret += rule.symbols.map(symbol=>{
		if(typeof symbol === 'string'){
			return symbol;
		}else if(symbol.type){
			return '%' + symbol.type;
		}else{
			return JSON.stringify(symbol.literal);
		}
	}).join(',');
	return ret;
}


function addBaseRules(grammer){
	grammer.ParserRules.push(
		{
			name: 'digit',
			symbols: [{type: 'DIGIT'}],
			postprocess:data => Number.parseInt(data[0].text)
		},
		{
			name: 'dbqt-text',
			symbols: [/[^"]+|\\"/]
		},
		{
			name: 'dbqt-text',
			symbols: ['dbqt-text',/[^"]+|\\"/]
		},
		{
			name: 'value:string',
			symbols:[{type:'DBQT'},'dbqt-text',{type:'DBQT'}],
			postprocess: joinText
		},
		{
			name: 'value:string',
			symbols:[{type:'DBQT'},{type:'DBQT'}],
			postprocess: joinText
		},
		{
			name: 'value:number',
			symbols:['number'],
			postprocess: takeFirst
		},
		{
			name: 'string',
			symbols:[{type:'DBQT'}, 'dbqt-text', {type:'DBQT'}],
			postprocess: joinText
		},
		{
			name: 'string',
			symbols:[{type:'DBQT'},{type:'DBQT'}],
			postprocess: data=> ''
		},
		{
			name:'integer',
			symbols:['digit'],
			postprocess: takeFirst
		},
		{
			name:'integer',
			symbols:['integer','digit'],
			postprocess: data=>data[0] * 10 + data[1]
		},
		{
			name:'number',
			symbols:['integer','fractional'],
			postprocess: data=>data[0] + data[1].numerator / data[1].denominator
		},
		{
			name:'number',
			symbols:['fractional'],
			postprocess: data=>data[0].numerator / data[0].denominator
		},
		{
			name:'number',
			symbols:['integer'],
			postprocess: takeFirst
		},
		{
			name:'fractional',
			symbols:['fractional','digit'],
			postprocess: data=>({
				numerator: data[1] + data[0].numerator * 10,
				denominator: data[0].denominator * 10
			})
		},
		{
			name:'fractional',
			symbols:[{literal:'.'},'digit'],
			postprocess: data=>({
				numerator: data[1],
				denominator: 10
			})
		},
		{
			name: 'SP',
			symbols: [{type: 'SP'}],
			postprocess(){
				return null;
			}
		},{
			name: '_',
			symbols: [{type: 'SP'}],
			postprocess(){
				return null;
			}
		},{
			name: 'SP?',
			symbols: [],
			postprocess(){
				return null;
			}
		},{
			name: 'SP?',
			symbols: ['SP'],
			postprocess(){
				return null;
			}
		},{
			name: 'COMMA',
			symbols: [{type: 'COMMA'}],
			postprocess(){
				return null;
			}
		},{
			name: 'COMMA?',
			symbols: ['COMMA'],
			postprocess(){
				return null;
			}
		},{
			name: 'COMMA?',
			symbols: [],
			postprocess(){
				return null;
			}
		},{
			name: 'FRAGMENT_SEP',
			symbols: ['SP?','COMMA','SP?']
		},{
			name: 'FRAGMENT_SEP',
			symbols: ['SP']
		},{
			name: 'LIST_SEP',
			symbols: ['SP?','COMMA','SP?']
		},{
			name: 'CONSTRAINT',
			symbols:[],
			postprocess(data, reference, fail, state){
			}
		}
	)
}

function markStringPos(text, pos){
	return text.slice(0, pos) + '^' + text.slice(pos);
}

function parameterizeType(type, parameter){
	const match1 = type.match(/^((?:type|value)\:)?(t|T)$/)
	if(match1){
		return (match1[1]||'') + parameter;
	}
	return type
	.replace(/^(?:t|T)<(.*)>([\*\?]*)$/,parameter + '<$1>$2')
	.replace(/(.*)<(?:t|T)>([\*\?]*)/,'$1<' + parameter + '>$2')
	.replace(/^(?:t|T)([\*\?]*)$/,parameter + '$2')
}

/**
 * Expand template expansion items. Provide the new symbols list and the mapping from current symbol list to previous symbol list so we can pass to the postprocess function the data array it expects
 * @param {*} source 
 * @param {*} s 
 * @param {*} dictionary 
 * @returns 
 */
function expandSymbols(source, s, dictionary){
	const symbols = [];
	const mapping = [];
	source.forEach(item=>{
		if(typeof item !== 'string'){
			mapping.push(symbols.length);
			symbols.push(item)
		}else{
			const matched = item.match(/^\s*T\s*\|(.+)$/);
			if(matched){
				//this is an expansion item. Replace with literal and tokenize
				const spec = dictionary.getTypeSpec(s)
				const text = spec[matched[1]];
				const tokens = tokenize.call(lexer, text);
				mapping.push(symbols.length);
				symbols.push(...tokens.map(token=>({literal:token})));
			}else{
				mapping.push(symbols.length);
				symbols.push(parameterizeType(item, s));
			}
		}
	})
	return {symbols, mapping};
}
//first check if the value can be translated

function listPush(data){
	const ret = [...data[0], data[2]];
	return ret;
}

function noRepeatTypeListPush(data){
	//console.log('noRepeatTypeListPush',data);
	return listPush(data);
}
function takeFirst(data){
	return data[0];
}

function joinText(data){
	return JSON.parse(data.flat(MAX_FLAT_DEPTH).map(item=>(item.value||item.text)).join(''))
}

function typeAsString(type){
	const typeObject = Type(type);
	if(typeObject instanceof TemplateType){
		console.error('Template types are not supported', type);
	}
	const ret = typeObject.toString();
	return ret;
}

/** postprocess function that calls wrap function and ads $specializedFor property to output object */
function postprocessSpecialized(data, reference, fail){
	const {fn, specializedFor, mapping} = this;
	const mappedData = mapping.map(pos=>data[pos]);
	const ret = fn(mappedData, reference, fail);
	if(ret && typeof ret === 'object'){
		ret.$specializedFor = specializedFor;
	}
	return ret;
}

function generatePostprocessSpecialized(fn, specializedFor, mapping){
	return postprocessSpecialized.bind({fn, specializedFor, mapping});
}

