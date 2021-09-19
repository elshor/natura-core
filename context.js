/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { assume, depracated } from './error.js';
import {calcTemplate} from './template.js'
import Type from './type.js'
import Reference from './reference.js'
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
	let current = previousContextLocation(location);//skip current
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
	const referenced = location.referenced;
	if(referenced.isEmpty){
		return true;//continue search
	}

	visitIt?visitIt('location',referenced):null;
	const currentSpec = referenced.spec;

	//iterate property spec context
	const parent = referenced.parent;
	if(parent && parent.spec.properties){
		const parentProperties = referenced.parent.spec.properties;
		const propertyEntries = (parentProperties[referenced.property]||{}).context || [];
		for(let i=0;i<propertyEntries.length;++i){
			const b = visitEntry(referenced, propertyEntries[i],iterator,type,name,scope,visitIt);
			if(b === false){
				return false;//end search
			}
		}
	}

	//iterate context
	const entries = currentSpec.context || [];
	for(let i=0;i<entries.length;++i){
		const b = visitEntry(referenced, entries[i],iterator,type,name,scope,visitIt);
		if(b === false){
			return false;//end search
		}
	}

	//search scope
	if(scopeSearch(referenced,referenced.type,iterator,type,name,scope,null,visitIt) === false){
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
			return useScope(referenced,entry,iterator,type,name,scope,null,visitIt);
		case 'use context':
			return useContext(referenced,entry,iterator,type,name,scope,visitIt);
		case 'emit property':
			return emitProperty(referenced,entry,iterator,type,name);
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

function scopeEntry(referenced,entry,iterator,type,name,scope,scopeName,visitIt){
	//calculate the type
	const entryType = Type(entry.type,referenced).toString();
	const spec = referenced.dictionary.getTypeSpec(entryType);
	
	//calculate emit name
	const emitProperty = entry.name? 
		calcTemplate(entry.name,referenced.contextNoSearch) : 
		referenced.lang.theType(specContextType(spec));
	const emitName = referenced.lang.of(emitProperty,matchRole(spec.role,Role.model)?scopeName:null);
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
			access: scope + ">" + (entry.access||entry.name),
			role:entry.role || 'artifact'
		},
		entry.description,
		referenced.path + (entry.path? '/' + entry.path : '')
	)===false){
		return false;
	}
	const entityIsCollection = true;//db need to calculate this
	if(entry.useScope || entityIsCollection){
		//also emit the scope of the emited type.
		return scopeSearch(referenced,entryType,iterator,type,name,scope + ">" + entry.access,emitName, visitIt);
	}else{
		return true;
	}
}
function basicEmit(referenced,entry,iterator,type,name,scope,visitIt){
	//calculate the type
	const entryType = Type(entry.type,referenced).toString();
	
		//calculate emit name
		const emitName = entry.name? 
		calcTemplate(entry.name,referenced.contextNoSearch) : 
		function(type){
			const spec = referenced.dictionary.getTypeSpec(type);
			return referenced.lang.theType(specContextType(spec));
		}(entryType);

	//if access starts with + then replace + with location $id
	const access = typeof entry.access === 'string' && entry.access.charAt(0)==='+'?
		referenced.child('$id').value + entry.access.substr(1) : (entry.access||'')
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
			access: scope + ">" + access,
			role:entry.role || 'artifact'
		},
		entry.description,
		referenced.path + (entry.path? '/' + entry.path : '')
	)===false){
		return false;
	}
	const entityIsCollection = true;//db need to calculate this
	if(entry.useScope || entityIsCollection){
		//also emit the scope of the emited type.
		return scopeSearch(referenced,entryType,iterator,type,name,scope + ">" + entry.access, emitName, visitIt);
	}else{
		return true;
	}
}

function emitProperty(location,entry,iterator,type,name,scope){
	const property = location.child(entry.property);
	const propertyType = Type(property.type,property);
	const emitName = entry.name || 'the {{$location.type}}';
	let toProcess;
	//TODO handle dictionary types
	if(propertyType.isCollection){
		toProcess = property.children;
	}else{
		toProcess = [property];
	}

	for(let i=0;i<toProcess.length;++i){
		const value = toProcess[i].value;
		if(value === undefined){
			continue;
		}
		try{
			const valueName = calcTemplate(emitName,toProcess[i].contextNoSearch);
			const access = calcTemplate(entry.access||'',toProcess[i].contextNoSearch);
			const matched =  match(
				location.dictionary,
				iterator,
				type,
				name,
				toProcess[i].type,
				valueName,
				{
					$type:'reference',
					label:valueName,
					valueType:toProcess[i].type,
					access: (scope ||'') + ">" + access,
					role:entry.role || 'artifact'
				},
				undefined,
				toProcess[i].path
			);
			if(matched === false){
				return false;
			}
		}catch(e){
			console.error('There was an error processing context',e);
		}
	}
}

function scopeSearch(location,scopeType,iterator,type,name,scope,scopeName,visitIt){
	const currentSpec = location.dictionary.getTypeSpec(scopeType);
	if(typeof currentSpec.scopeSearch === 'function'){
		return currentSpec.scopeSearch(location,iterator,type,name,scope,scopeName,visitIt) !== false;
	}
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
 */
function useContext(referenced,entry,iterator,type,name,scope,visitIt){
	const property = referenced.child(entry.property).referenced;
	if(property.isEmpty){
		return true;//continue search
	}
	return visit(property,iterator,type,name,scope,visitIt);
}

function useScope(referenced,entry,iterator,type,name,scope,scopeName, visitIt){
	const property = referenced.child(entry.property).referenced;
	if(property.isEmpty){
		return true;//continue search
	}
	scope = entry.access? scope+'>' + entry.access : scope;
	return scopeSearch(
		property,
		property.type,
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
		}else{
			return location.parent;
		}
	}
	return location.previous || location.parent;
}

function match(dictionary, it, queryType,queryName, type,name,value,description,path){
	const matchType = !queryType || dictionary.isa(type,queryType);
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
			if(prop in entity){
				return entity[prop];
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