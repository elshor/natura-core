import { patternAsGrammer } from "./pattern.js";
import moo from 'moo'
import { Parser as Parsley, Grammar } from "./parsely.js";
import Type from './type.js'
import TemplateType from "./template-type.js";
import RelStore from "./rel-store.js";

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
		this.assertions = new RelStore();
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
		console.assert(!rule.name.includes('-'),'Rule name cannot include - : ' + rule.name);
		this.grammer.ParserRules.push(rule);
	}

	addInstance(spec, pkg){
		this.compiledGrammer = null;
		//first add the value tokenized
		this._addRule({
			name: spec.valueType,
			pkg: pkg.name,
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
				pkg: pkg.name,
				description: spec.description,
				postprocess(){
					return spec.value;
				},
				noSuggest: false,//altPatterns should not be suggested
				symbols: tokenize.bind(lexer)(pattern).map(token=>({literal: token}))
			}, spec)
			})
		//add value not tokenized - used for suggestTokens
		this._addRule({
			pkg: pkg.name,
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
		if(!pkg || pkg.name === 'base'){
			//skip types without a package
			return;
		}
		console.assert(pattern, 'rules must have patterns: ' + spec.name);

		const names = [spec.name, ... (spec.isa || [])];
		const patterns = [spec.pattern, ...(spec.altPatterns || [])];
		patterns.forEach(pattern=>{
			const rules = patternAsGrammer(
				spec.name, 
				pattern, 
				spec,
				tokenize.bind(lexer),
				this.dictionary,
				pkg._id
			);
			rules.forEach(rule=>{
				names.forEach(name=>{
					const copy = Object.assign({}, rule);
					copy.name = name;
					copy.pkg = pkg.name;
					parser._addRule(copy, spec)
				})
			})
		})
			
		if(spec.basicType && !spec.optionsOnly){
			//if options are suggested, then we are limited to the options
			parser._addRule({
				name: spec.name,
				pkg: pkg.name,
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
					pkg: pkg.name,
					symbols:[{example:literal}],
					source: spec.name + '$example',
					postprocess: takeFirst
				})
			})
		}
	}

	addAssertion(type, assertion, pkg){
		this.compiledGrammer = null;
		this.assertions.addAssertion(type, assertion, pkg.name);
	}

	/**
	 * Called after adding the last type. This is when macro expansion is done
	 */
	endTypes(){
		this._ensurePlurals()
	}

	getGrammer(){
		if(!this.compiledGrammer){
			this.compiledGrammer = Grammar.fromCompiled(this.grammer, this.assertions)
		}
		return this.compiledGrammer;
	}

	parse(text, target='interact action', logger){
		this.grammer.ParserStart = target;
		const parser = new Parsley(this.getGrammer());
		try{
			const res = parser.feed(text);
			if(res.results){
				return res.results;
			}else{
				return [];
			}
		}catch(e){
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

function addPackage(ruleOrRules, pkg){
	(Array.isArray(ruleOrRules)? ruleOrRules : [ruleOrRules]).forEach(rule=>{
		rule.pkg = pkg.name;
	})
	return ruleOrRules;
}