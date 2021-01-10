import { assume } from './error';
import Reference from './reference'

/**
 * @name ContextEntry
 * @param {String} type 
 * @param {String} name
 * @param {String} path the path identifying the reference. This can be used to ensure a reference does not appear twice in the suggestions
 * @param {*} value
 * @param {String} description
 */
/**
 * a context iterator is passed to context search functions. It is called for each context entry that matches the search
 * @callback contextIterator
 * @param {ContextEntry} entry the context entry to return
 * @param {*} value value of the entity
 * @returns {booldean} return false if the search should stop
 */
/**
 * Search for entities within the location context
 * @param {Location} location 
 * @param {contextIterator} iterator 
 * @param {String} type 
 * @param {String} name 
 * @param {String} scope the current scope. Each time a use scope is followed, the new scope is added to the scope with a preceding # symbol
 */
export function contextSearch(location,iterator,type,name,scope='',visitIt){
	let current = previousContextLocation(location);//skip current
	let cont = true;
	while(current && cont !== false){
		cont = visit(current,iterator,type,name,scope,visitIt);
		current = previousContextLocation(current);
	}
}

function visit(location,iterator,type,name,scope,visitIt){
	const referenced = location.referenced;
	if(referenced.isEmpty){
		return true;//continue search
	}
	visitIt?visitIt('location',referenced):null;
	const currentSpec = referenced.spec;

	//iterate context
	const entries = currentSpec.context || [];
	for(let i=0;i<entries.length;++i){
		const b = visitEntry(referenced, entries[i],iterator,type,name,scope,visitIt);
		if(b === false){
			return false;//end search
		}
	}

	//search scope
	if(scopeSearch(referenced,referenced.type,iterator,type,name,scope,visitIt) === false){
		return false;
	}

	//continue search
	return true;//continue
}

function visitEntry(referenced,entry,iterator,type,name,scope='',visitIt){
	if(!entry || typeof entry !== 'object'){
		return true;
	}
	visitIt?visitIt('context',referenced,entry):null;
	switch(entry.$type){
		case 'basic emit':
			return basicEmit(referenced,entry,iterator,type,name,scope);
		case 'use scope':
			return useScope(referenced,entry,iterator,type,name,scope,visitIt);
		case 'emit property':
			return emitProperty(referenced,entry,iterator,type,name);
		default:
			assume(false,'expected known context entry. Got',entry.$type);
		}
}
function visitScopeEntry(referenced,entry,iterator,type,name,scope='',visitIt=undefined){
	scope = scope || '';
	if(!entry || typeof entry !== 'object'){
		return true;
	}
	visitIt?visitIt('scope',referenced,entry):null;
	switch(entry.$type){
		case 'basic emit':
			return basicEmit(referenced,entry,iterator,type,name,scope,visitIt);
		case 'use scope':
			return useScope(referenced,entry,iterator,type,name,scope,visitIt);
		case 'emit component':
			return emitComponent(referenced,entry,iterator,type,name);
		case 'emit hash':
			return emitHash(referenced,entry,iterator,type,name);
		default:
			assume(false,'expected known scope entry. Got',entry.$type);
	}
}

function emitComponent(referenced,entry,it,type,name){
	//TODO this is a hack. Need to find a way to define scopeSearch in package
	const ref = referenced.child('ref').value;
	if(ref && match(
		referenced.dictionary,
		it,
		type,
		name,
		'a component',
		ref + ' component',
		Reference(ref + ' component','a component',referenced.path)
	) === false){
		return false;
	}
	const children = referenced.child('children').children;
	for(let i = 0;i<children.length;++i){
		if(emitComponent(children[i],entry,it,type,name) === false){
			return false;
		}
	}
	return true;
}

function basicEmit(referenced,entry,iterator,type,name,scope){
	return match(
		referenced.dictionary,
		iterator,
		type,
		name,
		entry.type,
		entry.name,
		Reference(entry.name,entry.type,scope + "#" + entry.access)
	);
}

function emitProperty(location,entry,iterator,type,name,scope){
	const property = location.child(entry.property).value;
	if(!property){
		return true;
	}
	return match(
		location.dictionary,
		iterator,
		type,
		name,
		entry.type,
		entry.name,
		property
	);
}

function emitHash(location,entry,iterator,type,name,scope=''){
	const dictionary = location.dictionary;
	const children = location.child(entry.property).children;
	for(let i=0;i<children.length;++i){
		const itemType = children[i].type;
		const instanceType = dictionary.isInstance(itemType)? itemType : dictionary.getTypeSpec(itemType).instanceType || 'a ' + itemType;
		if(match(
			dictionary,
			iterator,
			type,
			name,
			instanceType,
			children[i].property,
			Reference(children[i].property,instanceType,scope+'#'+children[i].property)
		) === false){
			return false;
		}
		if(entry.proxyFor){
			const proxy = children[i].child(entry.proxyFor);
			const itemType = proxy.type;
			let instanceType;
			if(dictionary.isInstance(itemType)){
				instanceType = itemType;
			}else if(proxy.isReference){
				instanceType = proxy.value.valueType;
			}else if(dictionary.isa(itemType,'expression')){
				 instanceType = proxy.spec.valueType;
			}else{
				 instanceType = dictionary.getInstanceType(itemType);
			}
			if(match(
				dictionary,
				iterator,
				type,
				name,
				instanceType,
				children[i].property,
				proxy.isReference? proxy.value : Reference(
					children[i].property,
					instanceType,
					scope+'#'+children[i].property+'/proxy'
				)
			) === false){
				return false;
			}	
		}
	}
	return true;
}

function scopeSearch(location,scopeType,iterator,type,name,scope,visitIt){
	const currentSpec = location.dictionary.getTypeSpec(scopeType);
	if(typeof currentSpec.scopeSearch === 'function'){
		return currentSpec.scopeSearch(location,iterator,type,name,scope) !== false;
	}
	const entries = currentSpec.scope || [];
	for(let i=0;i<entries.length;++i){
		const b = visitScopeEntry(location, entries[i],iterator,type,name,scope,visitIt);
		if(b === false){
			return false;//end search
		}
	}
	return true;//continue search
}

function useScope(referenced,entry,iterator,type,name,scope,visitIt){
	const property = referenced.child(entry.property).referenced;
	if(property.isEmpty){
		return true;//continue search
	}
	scope = entry.access? scope+'#' + entry.access : scope;
	return scopeSearch(
		property,
		property.type,
		iterator,
		type,
		name,
		scope,
		visitIt
	) !== false;
}
/**
 * Find the location to be visited before current location when evaluating context. The order in which context is evaluated determines
 * @param {Location} location current location
 * @returns {Location}
 */
function previousContextLocation(location){
	if(!location){
		return null;
	}
	const parent = location.parent;
	const emitOrder = parent? (parent.spec.emitOrder || []): null;
	if(Array.isArray(emitOrder)){
		//we have emitOrder defined. Check where we are and move to previous location
		const pos = emitOrder.indexOf(location.property);
		if(pos > 0){
			return location.sibling(emitOrder[pos-1]);
		}else{
			return location.parent;
		}
	}
	return location.previous || location.parent;
}

function match(dictionary, it, queryType,queryName, type,name,value){
	const matchType = !queryType || dictionary.isa(type,queryType);
	const matchName = !queryName || queryName === name;
	if(matchType && matchName){
		return it({type,name,value});
	}else{
		return true;
	}
}

export function contextEntries(location,type,name){
	const values = {};
	contextSearch(location,(entry)=>{
		const id = (entry && typeof entry.value === 'object')?
			entry.value.path||entry.name : 
			entry.value;
		if(!values[id]){
			values[id] = entry;
		}
		return true;
	},type,name);
	return Object.values(values);
}

export function locate(location,type,name){
	let value;
	contextSearch(location,entry=>{
		value = entry.value;
	},type,name);
	return value;
}