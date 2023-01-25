import { patternAsGrammer } from "./pattern.js";
import stringify from "./stringify.js";
import moo from 'moo'
import { createLocation } from "./location.js";
import { Parser as Parsley } from "./parsely.js";

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
		this._addRule({
			name: spec.valueType,
			description: spec.description,
			symbols: tokenize.bind(lexer)(spec.label).map(token=>({literal: token}))
		}, spec)
	}
	_ensurePlurals(){
		//make sure all plural types (ending with *) are defined
		const plurals = {};
		this.grammer.ParserRules.forEach(rule=>{
			rule.symbols.forEach(symbol=>{
				if(typeof symbol === 'string' && symbol.endsWith('*') && !plurals[symbol]){
					//need to add a rule for this
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
		const pattern = spec.pattern || spec.title;
		if(pattern){
			if(spec.valueType){
				const rules = patternAsGrammer(
					spec.valueType,
					pattern, 
					spec, 
					tokenize.bind(lexer),
					parser.dictionary,
					pkg.name
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
				pkg.name
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
				pkg.name
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
		if(spec.basicType){
			parser._addRule({
				name: spec.name,
				symbols: [spec.basicType],
				source: spec.name + '$basic',
				postprocess: takeFirst
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
					symbols: rule.symbols.map(item=>{
						if(typeof item === 'string'){
							return parameterizeType(item, s);
						}else{
							return item;
						}
					})
				}
				this.grammer.ParserRules.push(sRule);
			})
		})
		this._ensurePlurals()
	}

	getGrammer(){
		return this.grammer;
	}

	parse(text, target='type:interact action'){
		this.grammer.ParserStart = target;
		const parser = new Parsley(this.grammer);
		try{
			const res = parser.feed(text);
			if(res.results){
				return res.results;
			}else{
				return [];
			}
		}catch(e){
			this.dictionary.log('got exception',e);
		}
	}

	
	_dumpParseRules(target){
		this.dictionary.log('dumping rules for',target);
		this.grammer.ParserRules.forEach(rule=>{
			if(rule.name === target){
				this.dictionary.log('  ', ruleText(rule));
			}
		})
	}
	_dumpUsedBy(target){
		this.dictionary.log('dumping rules used by',target);
		this.grammer.ParserRules.forEach(rule=>{
			if(rule.symbols.find(symbol=>symbol=== target)){
				this.dictionary.log('  ', ruleText(rule));
			}
		})
	}
}

function printStateDependant(state, states, indent=1, includeCompleted=false){
	states
		.filter(state1=>state1.wantedBy.includes(state))
		.forEach(s=>{
			if(s.isComplete && !includeCompleted){
				return;
			}
			this.dictionary.log(
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
		}
	)
}

function markStringPos(text, pos){
	return text.slice(0, pos) + '^' + text.slice(pos);
}

function parameterizeType(type, parameter){
	return type
	.replace(/^t<(.*)>([\*\?]*)$/,parameter + '<$1>$2')
	.replace(/^(.*)<t>([\*\?]*)$/,'$1<' + parameter + '>$2')
	.replace(/^t([\*\?]*)$/,parameter + '$2')
}

function listPush(data){
	return [...data[0], data[2]]
}

function takeFirst(data){
	return data[0];
}

function dumpParser(res, dictionary){
	dictionary.log(markStringPos(res.lexer.buffer, res.lexer.col), '==>',res);
	const hasResults = res.results.length > 0;
	if(hasResults){
		dictionary.log('RESULTS:');
		res.results.forEach(result=>{
			dictionary.log(stringify(createLocation(result, dictionary)), result);
		})	
	}
	const column = res.table[res.current];
	column.states.forEach(state=>{
		if(state.wantedBy.length > 0){
			return;
		}
		dictionary.log(
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

