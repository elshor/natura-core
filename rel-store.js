const PACKAGES_URI = 'https://natura.dev/packages/'
export default class RelStore {
	constructor(){
		this.facts = [];
		this.rules = [];
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
	match(subject, predicate, object){
		const ret = [];
		this.facts.forEach(fact=>{
			const binding = fact.bind(subject, predicate, object);
			if(binding){
				ret.push(binding);
			}
		})
		this.rules.forEach(rule => {
			const bindings = rule.bind(subject, predicate, object, this);
			ret.push(... bindings)
		})
		return ret;
	}
	query(predicate, object){
		const bindings = this.match('T', predicate, object);
		console.log('bindings', bindings);
		return bindings.map(b=>b.T)
	}

	getByAssertion(assertion, pkg){
		const parsed = assertion.match(/^(.*)\<(.*)\>$/)
		if(!parsed){
			//this is not an assertion - return empty list
			return [];
		}
		const res = this.query(parsed[1], parsed[2])
		if(res.length > 0){
			console.log('RES', res);
		}
		return res;
	}
}

class Fact {
	constructor(subject, predicate, object){
		this.subject = subject;
		this.predicate= predicate;
		this.object = object;
	}
	bind(subject, predicate, object, bindings = {}){
		const s = bindItem(this.subject, subject, bindings)
		const p = bindItem(this.predicate, predicate, bindings)
		const o = bindItem(this.object, object, bindings)
		if(s && p && o){
			return Object.assign(Object.create(bindings),s,p,o)
		}else{
			return null;
		}
	}
}

const ANY = {};

class Rule {
	constructor(result, statements){
		this.result = result;
		this.statements = statements;
	}
	bind(subject, predicate, object, kb ){
		const start = new Fact(subject, predicate,object).bind(...this.result);
		if(!start){
			//rule doesn't match pattern
			return [];
		}
		const mapping = {}
		Object.entries(start).forEach(([key,value])=>{
			if(isVariable(value)){
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
				newBindings.push(
					... kb.match(
						b[stmt[0]] || stmt[0], 
						b[stmt[1]] || stmt[1], 
						b[stmt[2]] || stmt[2]
					).map(o=>Object.assign({},b,o))
				)
			}
			stateBindings = newBindings;
		}
		return stateBindings.map(binding=>{
			const ret = {};
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
