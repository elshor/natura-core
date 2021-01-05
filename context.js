import {computeSpecProperty} from './spec'

/**
 * a context iterator is passed to context search functions. It is called for each context entry that matches the search
 * @callback contextIterator
 * @param {String} type the type of entity found
 * @param {String} name the name of the entity found
 * @param {String} path the path identifying the entity
 * @param {*} value value of the entity if relevant
 * @returns {booldean} return false if the search should stop
 */
/**
 * Search for entities within the location context
 * @param {Location} location 
 * @param {contextIterator} iterator 
 * @param {String} type 
 * @param {String} name 
 */
export function contextSearch(location,iterator,type,name){
	let current = previousContextLocation(location);//skip current
	let cont = true;
	while(current && cont !== false){
		cont = visit(current,iterator,type,name);
		current = previousContextLocation(current);
	}
}

function visit(location,iterator,type,name){
	const referenced = location.referenced;
	if(referenced.isEmpty){
		return true;//continue search
	}
	const currentSpec = referenced.spec;
	
	//iterate context
	const entries = computeSpecProperty(currentSpec,referenced,'context',[]);
	for(let i=0;i<entries.length;++i){
		const b = visitEntry(referenced, entries[i],iterator,type,name);
		if(b === false){
			return false;//end search
		}
	}

	//search scope
	if(scopeSearch(location,iterator,type,name) === false){
		return false;
	}
	
	//continue search
	return true;//continue
}

function visitEntry(referenced,entry,iterator,type,name){
	if(!entry || typeof entry !== 'object'){
		return true;
	}
	switch(entry.$type){
		case 'basic emit':
			return basicEmit(referenced,entry,iterator,type,name);
		case 'use scope':
			return useScope(referenced,entry,iterator,type,name);
		case 'emit component':
			return emitComponent(referenced,entry,iterator,type,name);
		default:
			return true;
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
		referenced.path
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

function basicEmit(referenced,entry,iterator,type,name){
	if(!entry){
		return true;
	}
	if(type && !referenced.dictionary.isa(entry.type,type||'any')){
		return true;//continue search
	}
	if(name && name !== entry.name){
		return true;
	}
	return iterator(entry.type,entry.name,referenced.path,entry.value) !== false;
}

function scopeSearch(location,iterator,type,name){
	const referenced = location.referenced;
	if(referenced.isEmpty){
		return true;//continue search
	}
	const currentSpec = referenced.spec;
	if(typeof currentSpec.scopeSearch === 'function'){
		return currentSpec.scopeSearch(location,iterator,type,name) !== false;
	}
	const entries = computeSpecProperty(currentSpec,referenced,'scope',[]);
	for(let i=0;i<entries.length;++i){
		const b = visitEntry(referenced, entries[i],iterator,type,name);
		if(b === false){
			return false;//end search
		}else{
			return true;
		}
	}
}

function useScope(referenced,entry,iterator,type,name){
	const property = referenced.child(entry.property).referenced;
	return scopeSearch(property,iterator,type,name) !== false;
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

function match(dictionary, it, queryType,queryName,type,name,path){
	const matchType = !queryType || dictionary.isa(type,queryType);
	const matchName = !queryName || queryName === name;
	if(matchType && matchName){
		return it(type,name,path);
	}else{
		return true;
	}
}