import YAML from 'yaml';
import {readFileSync} from 'fs';

const PACKAGES_URI = 'https://natura.dev/packages/'
export default class RelStore {
	constructor(){
		this.facts = [];
		this.rules = [];

		//HACK should be part of packages
		this.loadRules('/ml/natura-core/rules.yaml')
	}

	addRule(predicate, statements){
		this.rules.push(new Rule(predicate, statements));
	}
	addAssertion(type, assertion, pkg){
		const parsed = assertion.match(/^(.*)\<(.*)\>$/)
		console.assert(parsed, 'assertion not matching pattern: ' + assertion)
		console.assert(typeof pkg === 'string','package must be a string');
		this.addRel(type, parsed[1], parsed[2], pkg)
	}

	addRel(subject, rel, object){
		this.facts.push(new Fact(subject, rel, object));
	}

	match(subject, predicate, object, fuzzy = false){
		const ret = [];
		this.facts.forEach(fact=>{
			const binding = fact.bind(subject, predicate, object, fuzzy);
			if(binding){
				ret.push(binding);
			}
		})

		this.rules.forEach(rule => {
			const bindings = rule.bind(subject, predicate, object, fuzzy, this);
			ret.push(... bindings)
		})

		return ret;
	}

	query(predicate, object, fuzzy){
		const bindings = this.match('T', predicate, object, fuzzy);
		return bindings
		.map(b=>b.assumptions?.length > 0? new FuzzyTerm(b.T, b.assumptions) : b.T)
	}

	getByAssertion(assertion, pkg){
		try{
			const parsed = assertion.match(/^(.*)\<(.*)\>$/)
			if(!parsed){
				//this is not an assertion - return empty list
				return [];
			}
			const res = this.query(parsed[1], parsed[2])
			.filter(t=>!t.assumptions)
			return res;
		}catch(e){
			console.error('EXCEPTION looking for', assertion,'\n',e)
			throw new Error('rel store failed to look for ' + assertion)
		}
	}

	getByAssertionFuzzy(assertion, pkg){
		try{
			const parsed = assertion.match(/^(.*)\<(.*)\>$/)
			if(!parsed){
				//this is not an assertion - return empty list
				return [];
			}
			const res = this.query(parsed[1], parsed[2], true)
			return res.filter(t=>t.assumptions);
		}catch(e){
			console.error('EXCEPTION looking for', assertion,'\n',e)
			throw new Error('rel store failed to look for ' + assertion)
		}
	}

	getByAssertionAll(assertion, pkg){
		try{
			const parsed = assertion.match(/^(.*)\<(.*)\>$/)
			if(!parsed){
				//this is not an assertion - return empty list
				return [];
			}
			const res = this.query(parsed[1], parsed[2], true)
			return res;
		}catch(e){
			console.error('EXCEPTION looking for', assertion,'\n',e)
			throw new Error('rel store failed to look for ' + assertion)
		}
	}

	getAssertions(){
		const ret = {};
		this.facts.forEach(fact=>{
			ret[fact.predicate + '<' + fact.object + '>'] = true;
		})
		return Object.keys(ret);
	}

	loadRules(path){
		const text = readFileSync(path, 'utf-8');
		const json = YAML.parse(text);
		json.forEach(rule=>this.addRule(rule.result, rule.from))
	}
}

class Fact {
	constructor(subject, predicate, object){
		this.subject = subject;
		this.predicate= predicate;
		this.object = object;
	}
	bind(subject, predicate, object, fuzzy, bindings = {}){
		const s = bindItem(this.subject, subject, bindings)
		const p = bindItem(this.predicate, predicate, bindings)
		const o = bindItem(this.object, object, bindings)
		if(p || !fuzzy){
			return mergeBindings(s,p,o);
		}
		//fuzzy processing
		const fuzzyP = bindItem(this.predicate, 'maybe-' + predicate, bindings);
		return mergeBindings(s,fuzzyP,o,{
			assumptions: [[this.subject, predicate, this.object]]
		})
	}
}

const ANY = {};

class Rule {
	constructor(result, statements){
		this.result = result;
		this.statements = statements;
	}
	bind(subject, predicate, object, fuzzy, kb ){
		const start = new Fact(subject, predicate,object).bind(...this.result, fuzzy);
		if(!start){
			//rule doesn't match pattern
			return [];
		}
		const mapping = {}
		Object.entries(start).forEach(([key,value])=>{
			if(isVariable(value.toString())){
				mapping[value] = key;
				delete start[key];
			}
		})
		let stateBindings = [start]
		
		for(let i = 0; i < this.statements.length; ++i){
			const stmt = this.statements[i];
			const newBindings = []
			for(let j=0;j<stateBindings.length;++j){
				const b = stateBindings[j];
				const generatedBindings = kb.match(
						b[stmt[0]] || stmt[0], 
						b[stmt[1]] || stmt[1], 
						b[stmt[2]] || stmt[2],
						fuzzy
				).map(o=>mergeBindings(b,o))
				newBindings.push(... generatedBindings);
			}
			stateBindings = newBindings;
		}
		return stateBindings.map(binding=>{
			//map the rule variables to the external variables
			const ret = {assumptions: binding.assumptions};
			Object.entries(mapping).forEach(([key,value])=>{
				ret[key] = binding[value]
			})
			return ret;
		});
	}

}

function isVariable(item){
	return item.match(/^[A-Z]/)
}

function bindItem(fact, rule, bindings){
	if(isVariable(rule)){
		if(bindings[rule] !== undefined){
			return bindings[rule] === fact? {} : null;
		}else{
			return {[rule]: fact}
		}
	}else{
		return (fact === rule)? {} : null;
	}
}

class FuzzyTerm {
	constructor(name, assumptions){
		this.name = name;
		this.assumptions = assumptions || []
	}
	toString(){
		return this.name;
	}
}

function mergeBindings(...bindings){
	let ret = {assumptions:[]};
	for(let i=0;i<bindings.length;++i){
		const b = bindings[i];
		if(typeof b !== 'object' || b === null){
				return null;
		}
		Object.entries(b).forEach(([key, value])=>{
			if(key === 'assumptions' && Array.isArray(value)){
				ret.assumptions.push(... value);
				return;
			}
			ret[key] = value;
		})
	}
	return ret;
}
