/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { assume } from './error.js';
import {calcTemplate} from './template.js'
import Type from './type.js'
import {createLocation} from './location.js'
import { specContextType } from './spec.js';
import {Role,matchRole} from './role.js'

/**
 * @name ContextEntry
 * @param {String} type
 * @param {String} name
 * @param {String} path the path identifying the reference. This can be used to ensure a reference does not appear twice in the suggestions or to prevent a self suggestions where the path is equal to the suggestion location
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
 * @param {String} type type to search for or null for any type
 * @param {String} name name to search for or null for any name
 * @param {String} scope the current scope. Each time a use scope is followed, the new scope is added to the scope with a preceding > symbol
 */
export function contextSearch(location,iterator,type,name,scope='',visitIt){
	let current = location;
	let cont = true;
	while(current && cont !== false){
		cont = visit(current,iterator,type,name,scope,visitIt);
		current = previousContextLocation(current);
	}
}

/**
 * Visit a location in search for context entries. This function searches context entries in the location spec and property spec (the value in spec.properties). It also searches current scope
 * @param {Location} location location to visit
 * @param {contextIterator} iterator 
 * @param {String} type type to search for
 * @param {String} name name to search for
 * @param {String} scope current scope. the reference access will be a join of scope and current access
 * @param {Function} visitIt a callback function used mostly for debug purposes
 */
function visit(location,iterator,type,name,scope,visitIt){
	if(!location){
		return true;
	}
	const referenced = location.referenced;
	if(alreadyVisited(location,iterator)){
		return true;
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
			return useScope(referenced,entry,iterator,type,name,scope,null,visitIt);
		case 'use context':
			return useContext(referenced,entry,iterator,type,name,scope,visitIt);
		default:
			assume(false,'expected known context entry. Got',entry.$type);
		}
}

function visitScopeEntry(referenced,entry,iterator,type,name,scope='',scopeName,visitIt=undefined){
	scope = scope || '';
	if(!entry || typeof entry !== 'object'){
		return true;
	}
	visitIt?visitIt('scope',referenced,entry):null;
	return scopeEntry(referenced,entry,iterator,type,name,scope,scopeName,visitIt);
}

function scopeEntry(referenced,entry,iterator,type,name,scope,scopeName){
	//calculate the type
	const entryType = Type(entry.type,referenced).toString();
	const spec = referenced.dictionary.getTypeSpec(entryType);
	
	//calculate emit name
	const emitProperty = entry.name? 
		calcTemplate(entry.name,referenced.contextNoSearch) : 
		referenced.lang.theType(specContextType(spec));
		const useOf = matchRole(spec.role,Role.model)||matchRole(spec.role,Role.type);
	const emitName = referenced.lang.of(emitProperty,useOf?scopeName:null);
	if(match(
		referenced.dictionary,
		iterator,
		type,
		name,
		entryType,
		emitName,
		{
			$type:'reference',
			label:emitName,
			valueType:entryType,
			access: scope + "." + (entry.access||entry.name),
			role:entry.role || 'artifact'
		},
		entry.description,
		referenced.path + (entry.path? '/' + entry.path : '')
	)===false){
		return false;
	}
	return true;
}

/**
 * 
 * @param {Location} original 
 * @param {String} entry.path 
 * @param {String} entry.scope
 * @param {String} entry.type
 * @param {String} entry.name
 * @param {String} entry.access
 * @param {String} entry.description
 * @param {*} iterator 
 * @param {*} type 
 * @param {*} name 
 * @param {*} scope 
 * @param {*} visitIt 
 * @returns 
 */
function basicEmit(original,entry,iterator,type,name,scope='',visitIt){
	const locations = relativeLocations(original,entry.path||'');
	scope = entry.scope? 
		(scope + entry.scope + '.') : 
		scope;
	
	for(let i=0;i<locations.length;++i){
		const referenced = locations[i].referenced;	
		
		//calculate the type
		const entryType = Type(entry.type||location.type,referenced).toString();
		
		//calculate emit name
		const emitName = entry.name? 
		calcTemplate(entry.name,referenced.contextNoSearch) : 
		function(type){
			const spec = referenced.dictionary.getTypeSpec(type);
			return referenced.lang.theType(specContextType(spec));
		}(entryType);
		if(emitName===''){
			//emit name is empty - disregard this entry - cannot display it
			return true;
		}
		
		//calculate access
		const access = calcTemplate(entry.access||entry.name,referenced.contextNoSearch);
		if(access===''){
			//access is empty - this means we need to disregard this entry
			return true;
		}
		
		if(match(
			referenced.dictionary,
			iterator,
			type,
			name,
			entryType,
			emitName,
			{
				$type:'reference',
				label:emitName,
				valueType:entryType,
				access: scope + access,
				role:entry.role || 'artifact'
			},
			entry.description,
			referenced.path
		)===false){
			return false;
		}
		if(entry.useScope){
			//also emit the scope of the emited type.
			return scopeSearch(referenced,entryType,iterator,type,name,scope + access, emitName, visitIt);
		}else{
			return true;
		}
	}
}

/**
 * 
 * @param {Location} location location to search its scope
 * @param {String} scopeType 
 * @param {contextIterator} iterator 
 * @param {String} type type to search for
 * @param {String} name name to search for
 * @param {String} scope current scope
 * @param {*} scopeName 
 * @param {*} visitIt 
 * @returns 
 */
function scopeSearch(location,scopeType,iterator,type,name,scope,scopeName,visitIt){
	const currentSpec = location.dictionary.getTypeSpec(scopeType);
	visitIt?visitIt('scope-search',location):null;
	const entries = currentSpec.scope || [];
	for(let i=0;i<entries.length;++i){
		const b = visitScopeEntry(location, entries[i],iterator,type,name,scope,scopeName,visitIt);
		if(b === false){
			return false;//end search
		}
	}
	return true;//continue search
}

/**
 * use the context of a property. It goes over context entries of property spec
 * @param {Location} referenced
 * @param {String} entry.path
 * @param {String} entry.scope
 */
function useContext(referenced,entry,iterator,type,name,scope,visitIt){
	const locations = relativeLocations(referenced,entry.path);
	return iterateArray(
		locations,
		iterator,
		type,
		name,
		entry.scope? (scope + entry.scope + '.') : scope,
		visitIt
		);
}

function useScope(referenced,entry,iterator,type,name,scope,scopeName, visitIt){
	const location = relativeLocations(referenced,entry.path).referenced;
	if(location.isEmpty){
		return true;//continue search
	}
	scope = entry.access? scope+'.' + entry.access : scope;
	return scopeSearch(
		location,
		location.type,
		iterator,
		type,
		name,
		scope,
		scopeName,
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
	if(Array.isArray(emitOrder) && !Type(parent.spec.type,parent).isCollection){
		//we have emitOrder defined. Check where we are and move to previous location
		const pos = emitOrder.indexOf(location.property);
		if(pos > 0){
			return location.sibling(emitOrder[pos-1]);
		}
	}
	return null;
}

function match(dictionary, it, queryType,queryName, type,name,value,description,path){
	function searchString(type){
		return type.searchString || type.toString();
	}
	const matchType = !queryType || dictionary.isa(searchString(type),searchString(queryType));
	const matchName = !queryName || queryName === name;
	if(matchType && matchName){
		return it({type,name,value,description,path});
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

/**
 * Create a context object that encapsulates all entities in the location context. The return value is a proxy. When getting a property the following search is executed
 * <br>if property is $location then return the location
 * <br>if property is $dictionary then return the dictionary of current location
 * <br>if property is $isProxy then return true
 * <br>if property is $value then calculate the value of current location. If the location is a reference then dereference it first
 * <br>if value of current location has the search property then return it
 * <br>search the context for an entity with name equal to the property
 * <br>
 * if `contextLocation` is specified then use its context for context search rather than searching the location context. This might be usefull for example after deleting an entity where we want to use its parent context search.
 * @param {Location} location current location
 * @param  {Location|Object} contextLocation optional location to use for context search. If the value is a non-location object then treat it as object context where if the get property is equal to a property in the context object then return it. Default is location
 * @returns Object
 */
export function locationContext(location,contextLocation=location){
	return new Proxy(location,{
		get(location,prop){
			if(prop === '$location'){
				return location;
			}
			if(prop==='$dictionary'){
				return location.dictionary;
			}
			if(prop==='$value'){
				//return the value of current location (dereferenced)
				return location.referenced.value;
			}
			if(prop==='$isProxy'){
				//this property signals that we can use $value
				return true;
			}

			//check if location value has the property
			const entity = location.referenced.value;
			const propValue = entity[prop];
			if(propValue !== undefined){
				return propValue;
			}

			//search context
			if(contextLocation.isLocation){
				let found;
				contextSearch(contextLocation,({type,name,value})=>{
					found = value;
					return false;
				},null,prop)
				//wrap result in location object so we get dereference and other location features
				return createLocation(found,location.dictionary).entity;
			}else{
				if(prop in contextLocation){
					return contextLocation[prop];
				}
			}
		}
	})
}

function relativeLocations(location,path){
	function follow(location,part,current){
		switch(part){
			case '':
				current.push(location);
				break;
			case '..':
				current.push(location.parent);
				break;
			case  '*':
				current.push(...location.children);
				break;
			case '$previous':
				current.push(location.previous);
				break;
			default:
				current.push(location.child(part));
		}
	}
	let current = [location];
	const parts = path.split('/');
	parts.forEach(part=>{
		const now = [];
		current.forEach(l=>follow(l,part,now));
		current = now;
	})
	return current;
}

function iterateArray(locations,iterator,type,name,scope,visitIt){
	for(let location of locations){
		const b = visit(location,iterator,type,name,scope,visitIt);
		if(b===false){
			return false;
		}
	}
	return true;
}

function alreadyVisited(location,iterator){
	if(!iterator.state){
		iterator.state = IteratorState();
	}
	if(iterator.state.visited.has(location.path)){
		return true;
	}else{
		iterator.state.visited.add(location.path);
		return false;
	}
}

function IteratorState(){
	return {
		visited: new Set()
	}
}
