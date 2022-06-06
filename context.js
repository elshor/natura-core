/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { assume } from './error.js';
import {calcTemplate} from './template.js'
import Type from './type.js'
import {createLocation,relativeLocations, shadowLocation} from './location.js'
import { specContextType, Spec } from './spec.js';
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
 * @param {Boolean} useExpected use expectedSpec instead of spec. This should be used for the first entry when looking for suggestions because we are looking for replacements to current value - we don't want to take current value into account
 */
export function contextSearch(location,iterator,type,name,scope='',visitIt,useExpected){
	let current = useExpected? shadowLocation(location) : location;
	let cont = true;
	while(current && cont !== false){
		cont = visit(current,iterator,type,name,scope,visitIt );
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
	//if useExpected, we are at the fist entry that we want to change. We need to ignore this entry (we want to remove it)
	const referenced = location.referenced;
	if(alreadyVisited(scope,location,iterator)){
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
		case 'emit value':
			return emitValue(referenced,entry,iterator,type,name,scope);
		case 'emit entity':
			return emitEntity(referenced,entry,iterator,type,name,scope);
		case 'use scope':
			return useScope(referenced,entry,iterator,type,name,scope,null,visitIt);
		case 'use context':
			return useContext(referenced,entry,iterator,type,name,scope,visitIt);
		default:
			assume(false,'In context array, got unknown context entry type',entry.$type);
		}
}

function visitScopeEntry(referenced,entry,iterator,type,name,scope='',scopeName,visitIt){
	scope = scope || '';
	if(!entry || typeof entry !== 'object'){
		return true;
	}
	visitIt?visitIt('scope',referenced,entry):null;
	return scopeEntry(referenced,entry,iterator,type,name,scope,scopeName,visitIt);
}

/**
 * 
 * @param {String} entry.path
 * @param {String} entry.type
 * @param {String} entry.name
 * @param {String} entry.access
 * @returns 
 */
function scopeEntry(referenced,entry,iterator,type,name,scope,scopeName,visitIt){
	if(!scope){
		scope = '';
	}

	const locations = relativeLocations(referenced,entry.path||'');
	for(let i=0;i<locations.length;++i){
		const location = locations[i];
		if(entry.$type === 'scope mixin'){
			return scopeSearch(location,entry.key,iterator,type,name,scope,scopeName,visitIt)
		}
	
		//calculate the type
		const entryType = (typeof entry.type === 'string'?
			Type(calcTemplate(entry.type,location.contextNoSearch),location).toString() :
			Type(entry.type,location)
		);
		const spec = location.dictionary.getTypeSpec(entryType);
		
		//calculate emit name
		const emitProperty = entry.name? 
			calcTemplate(entry.name,locationContext(location,{scopeName})) : 
			location.lang.theType(specContextType(spec));
		if(!emitProperty || emitProperty.length === 0){
			//if entry does not have a calculated name then do not emit it
			continue;
		}
		const entryAccess = entry.access? calcTemplate(entry.access,location.contextNoSearch) : null;
		const emitName = emitProperty;
		const description = calcTemplate(entry.description||'',location.contextNoSearch);
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
				access: entryAccess?
					(scope + ((entryAccess==='this')? '' : ("." + (entryAccess||emitName)))):
					undefined,
				role:entry.role || 'artifact',
				path:location.path,
				description
			},
			description,
			location.path
		)===false){
			return false;
		}
	}
	return true;
}

/** emit an entity in the document. This emit references an existing a location in the document from another location */
function emitEntity(location,entry,iterator,type,name,scope='',visitIt){
	const emitName = entry.name?
		calcTemplate(entry.name,location.contextNoSearch,true):location.value?
			location.value.name : undefined;
	const emitType = location.type;
	if(!emitName){
		//if there is no name defiend then cannot emit it
		return true;
	}
	if(match(
		location.dictionary,
		iterator,
		type,
		name,
		emitType,
		emitName,
		{
			$type:'reference',
			label:emitName,
			valueType:emitType,
			path:location.path,
			role:entry.role || 'artifact'
		},
		entry.description,
		location.path
	)===false){
		return false;
	}else{
		return true;
	}
}
/**
 * 
 * @param {Location} original 
 * @param {String} entry.path 
 * @param {String} entry.scope
 * @param {String} entry.type
 * @param {String} entry.name
 * @param {String} entry.access the code name used to access the context entity. If empty then this entry is ignored
 * @param {String} entry.description
 * @param {*} iterator 
 * @param {*} type 
 * @param {*} name 
 * @param {*} scope 
 * @param {*} visitIt 
 * @returns 
 */
function basicEmit(original,entry,iterator,type,name,scope=''){
	const locations = relativeLocations(original,entry.path||'');
	scope = entry.scope? 
		(scope + entry.scope + '.') : 
		scope;
	
	for(let i=0;i<locations.length;++i){
		const referenced = locations[i].referenced;	
		
		//calculate the type
		let entryType;
		if(typeof entry.type === 'string'){
			entryType = calcTemplate(entry.type,referenced.contextNoSearch);
			if(!entryType){
				//the calculation failed - do not emit
				return true;
			}
		 }else if(typeof entry.type === 'object'){
			 //entry.type is a type object
			 entryType = Type(entry.type,referenced).toString();
		 }else{
			 entryType = location.type;
		 }
		
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
				path:referenced.path,
				role:entry.role || 'artifact'
			},
			entry.description,
			referenced.path
		)===false){
			return false;
		}
		return true;
	}
}

function emitValue(original,entry,iterator,type,name,scope='',visitIt){
	const location = original.referenced;
	const context = location.referenced.contextNoSearch;
	const emitType = calcTemplate(entry.type,context);
	const emitName = calcTemplate(entry.name,context);
	if(!emitName || emitName.length===0||!emitType||emitType.length===0){
		//if name or type are empty then don't emit
		return true;
	}
	const value = calcTemplate(entry.value,context);
	const description = calcTemplate(entry.description,context);
	if(match(
		location.dictionary,
		iterator,
		type,
		name,
		emitType,
		emitName,
		{
			$type:'reference',
			label:emitName,
			valueType:emitType,
			value,
			description,
			role:entry.role || 'artifact'
		},
		description,
		location.path
	)===false){
		return false;
	}
	return true;
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
function scopeSearch(location,key,iterator,type,name,scope,scopeName,visitIt){
	const currentSpec = location.spec;
	visitIt?visitIt('scope-search',location,{key}):null;
	const entries = currentSpec.scope?(currentSpec.scope[key] || []) : [];
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
	scope = scope || '';
	const locations = relativeLocations(referenced,entry.path);
	const entryScope = entry.scope?calcTemplate(entry.scope,referenced.contextNoSearch):'';
	return iterateArray(
		locations,
		iterator,
		type,
		name,
		entryScope? (scope + (entryScope||'') + '.') : scope,
		visitIt
		);
}

function useScope(referenced,entry,iterator,type,name,scope,scopeName, visitIt){
	scopeName = entry.scopeName? calcTemplate(entry.scopeName,referenced.contextNoSearch) : scopeName;
	const locations = relativeLocations(referenced,entry.path);
	for(let i=0;i<locations.length;++i){
		const location = locations[i];
		const entryAccess = entry.access? calcTemplate(entry.access,location.contextNoSearch ): null;
		scope = entryAccess? scope+'.' + entryAccess : scope;
		if(scopeSearch(
			location,
			entry.key,
			iterator,
			type,
			name,
			scope,
			scopeName,
			visitIt
		) === false){
			return false;
		};
	}
	return true;//continue search
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

export function contextEntries(location,type,name,useExpected){
	const values = {};
	contextSearch(
		location,
		(entry)=>{
			const id = (entry && typeof entry.value === 'object')?
				entry.value.path||entry.name :
				entry.value;
			if(!values[id]){
				values[id] = entry;
			}
			return true;
		},
		type,
		name,
		null,//scope
		null,//visitIt
		useExpected
	);
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
			if(prop === '$'){
				//$ just returns itself. This is done so we can start any path with $. (used in natura-pkg)
				return locationContext(location,contextLocation);
			}
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
			if(prop==='$parent'){
				return locationContext(location.parent,contextLocation);
			}
			if(prop==='$spec'){
				return Spec(location.spec);
			}
			if(prop==='$valueType'){
				const spec = location.spec;
				return spec.valueType || location.type;
			}
			if(prop==='$valueTypeSpec'){
				const valueType = location.spec.valueType || location.type;
				return Spec(location.dictionary.getTypeSpec(valueType),location.dictionary);
			}
			if(prop==='$type'){
				return location.type;
			}
			if(prop==='$isProxy'){
				//this property signals that we can use $value
				return true;
			}

			//check if location value has the property
			const propLocation = location.referenced.child(prop);
			const value = propLocation.value;
			if(value && typeof value === 'object'){
				//if this is a value reference then return the value
				if(value.$type === 'reference' && value.value){
					return value.value;
				}
				//this is an object - return a new context
				return locationContext(propLocation,contextLocation);
			}else if(typeof value  !== 'undefined'){
				//this is a non-object - return the raw value
				return value;
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


function iterateArray(locations,iterator,type,name,scope,visitIt){
	for(let location of locations){
		const b = visit(location,iterator,type,name,scope,visitIt);
		if(b===false){
			return false;
		}
	}
	return true;
}

function alreadyVisited(scope,location,iterator){
	//we need to specify scope so we always visit a location with the correct scope
	const key = `${scope}|${location.path}`;
	if(!iterator.state){
		iterator.state = IteratorState();
	}
	if(iterator.state.visited.has(key)){
		return true;
	}else{
		iterator.state.visited.add(key);
		return false;
	}
}

function IteratorState(){
	return {
		visited: new Set()
	}
}
