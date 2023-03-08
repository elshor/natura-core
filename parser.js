import { patternAsGrammer } from "./pattern.js";
import stringify from "./stringify.js";
import moo from 'moo'
import { createLocation } from "./location.js";
import { Parser as Parsley } from "./parsely.js";
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
		this.grammer = {
			ParserRules: [],
			ParserStart: 'type:interact action',
			Lexer: lexer
		}
		addBaseRules(this.grammer);
		Object.freeze(this);
	}

	_addRule(rule, spec){
		if(!rule){
			return;
		}
		if(Array.isArray(rule)){
			return rule.forEach(r=>this._addRule(r, spec))
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
		//first add the value tokenized
		this._addRule({
			name: spec.valueType,
			description: spec.description,
			symbols: tokenize.bind(lexer)(spec.label).map(token=>({literal: token}))
		}, spec)
		//add value not tokenized - used for suggestTokens
		this._addRule({
			name: spec.valueType,
			description: spec.description,
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
			
			//add the type rule
			const typeRule = patternAsGrammer(
				'type:' + spec.name + (spec.specializedFor? '<t>' : ''), 
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
					name: 'type:' + isa,
					symbols: ['type:' + spec.name + (spec.specializedFor? '<t>' : '')],
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
				symbols: ['value:' + spec.basicType],
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
					symbols:[{literal}],
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
							symbols:[{literal:JSON.stringify(example)}],
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
		const isaRule = {
			name: 'type:' + parent,
			symbols: ['type:' + type],
			source: 'isa',
			postprocess: takeFirst
		}
		this._addRule(isaRule)
}

	/**
	 * Called after adding the last type. This is when macro expansion is done
	 */
	endTypes(){
		this.specializedTypes.forEach(({rule, T})=>{
			const sList = this.dictionary.getClassMembers(T);
			sList.forEach(s=>{
				const sRule = {
					name: parameterizeType(rule.name, s),
					postprocess: rule.postprocess,
					symbols: expandSymbols(rule.symbols, s, this.dictionary)
				}
				this.grammer.ParserRules.push(sRule);
			})
		})
		this._ensurePlurals()
	}

	getGrammer(){
		return this.grammer;
	}

	parse(text, target='type:interact action', logger){
		this.grammer.ParserStart = target;
		logger.debug('parsing text',JSON.stringify(text));
		logger.debug('target is',target)
		const parser = new Parsley(this.grammer);
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
			symbols:[{type:'DIGITS'}],
			postprocess: takeFirst
		},
		{
			name:'integer',
			symbols:['integer','digit'],
			postprocess: data=>data[0] * 10 + data[1]
		},
		{
			name:'integer',
			symbols:['integer',{type:'DIGITS'}],
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
	return type
	.replace(/^(?:t|T)<(.*)>([\*\?]*)$/,parameter + '<$1>$2')
	.replace(/^(.*)<(?:t|T)>([\*\?]*)$/,'$1<' + parameter + '>$2')
	.replace(/^(?:t|T)([\*\?]*)$/,parameter + '$2')
}

function expandSymbols(source, s, dictionary){
	const ret = [];
	source.forEach(item=>{
		if(typeof item !== 'string'){
			ret.push(item)
		}else{
			const matched = item.match(/^\s*T\s*\|(.+)$/);
			if(matched){
				//this is an expansion item. Replace with literal and tokenize
				const spec = dictionary.getTypeSpec(s)
				const text = spec[matched[1]];
				const tokens = tokenize.call(lexer, text);
				ret.push(...tokens.map(token=>({literal:token})));
			}else{
				ret.push(parameterizeType(item, s));
			}
		}
	})
	return ret;
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

function dumpParser(res, dictionary, logger){
	logger.log(markStringPos(res.lexer.buffer, res.lexer.col), '==>',res);
	const hasResults = res.results.length > 0;
	if(hasResults){
		logger.log('RESULTS:');
		res.results.forEach(result=>{
			logger.log(stringify(createLocation(result, dictionary)), result);
		})	
	}
	const column = res.table[res.current];
	column.states.forEach(state=>{
		if(state.wantedBy.length > 0){
			return;
		}
		logger.log(
			'  ',
			state.dot, 
			state.rule.postprocess? (state.rule.postprocess.typeName || '') +':': '?', 
			ruleText(state.rule)
		)
		printStateDependant(state, column.states, 3, hasResults);
	})
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

function traceContext(contextName, state, path = []){
	if(!state){
		return;
	}
	const newPath = path.concat(state)
	if(state.context){//db} && state.context[contextName]){
		console.log('got it', newPath)
	}else{
		state.wantedBy.forEach(state=>traceContext(contextName, state, newPath));
		traceContext(contextName, state.left, newPath)
	}
}