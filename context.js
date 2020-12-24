/**
 * Context represents the execution context. It is used to determine which entities are available at each location as suggestions.
 * <p>An execution context is an array of context entries. Each entry has the following fields:
 * <li>label - the text used in the suggestion list to identify the entity
 * <li>type - the type of entity
 * <li>ref - The reference name used to reference the entity.
 * @module context
 */
import {specEmits,specType} from './spec'
import {calcPattern} from './pattern'

/**
 * Calculate the expected execution context at a certain location. The spec will ontain al entities available at the input location. An execution function defined at the location can use all these entities.
 * @param {Location} location location of the context
 * @param {ExecutionContext} outerContext the outer context of the data. This can be used to represent the environment info and external data that can be referenced from within the location context
 */
export function contextSpec(location, outerContext=[]){
	const ret = [];

	let current = previousContextLocation(location);//skip current
	while(current){
		emitAtLocation(current,ret);
		current = previousContextLocation(current);
	}

	return ret.concat(outerContext);
}

function emitAtLocation(location,list,defaultEmitSelf=false){
	const referenced = location.referenced;
	const currentSpec = referenced.spec;
	const emits = specEmits(currentSpec,referenced);
	if(emits.length === 0 && defaultEmitSelf && !referenced.isEmpty){
		//emits not defined - emit entity at location
		const entry = {
			ref:referenced.patternText,
			type: specType(referenced.spec),
			path:referenced.path
		};
		addEmitEntity(entry,list,referenced.lang);
	}else{
		emits.forEach(entry=>{
			if(!entry){
				return;
			}
			if(entry.$type === 'emit children' && Array.isArray(referenced.value)){
				referenced.value.forEach((item,index)=>{
					emitAtLocation(referenced.child(index),list,true);
				})
			}else if(entry.$type === 'emit property'){
				//need to emit a property. If it is an array then emit its items. Otherwise emit the property itself
				referenced.childList(entry.property).forEach(item=>{
					emitAtLocation(item,list,true)
				});
			}else{
				addEmitEntity({
					path: referenced.path,
					type:entry.type,
					tag:entry.tag || entry.type,
					label:entry.label,
					ref:calcPattern(referenced,entry.ref)
				},list,referenced.lang);
			}
		});
	}
}

function emitEntryLabel(entry,lang){
	if(entry.label){
		return entry.label;
	}else if(entry.ref){
		return entry.ref;
	}else if(entry.tag){
		return lang.theType(entry.tag);
	}else{
		return lang.theType(entry.type);
	}
}


function addEmitEntity(entry,list,lang){
	entry.label = emitEntryLabel(entry,lang);
	entry.tag = entry.tag || entry.type;
	const index = list.findIndex(
		it=>it.label === entry.label && it.type === entry.type);
	if(index >= 0){
		//and entry with this label already exists - replace it
		list[index] = entry;
	}else{
		//add a new entry
		list.push(entry);
	}
}

function contextOrder(location){
	const ret = [location];
	let current = previousContextLocation(location);
	while(current){
		ret.push(current);
		current = previousContextLocation(current);
	}
	return ret;
}

export function dumpContextOrder(location){
	if(!location){
		console.error('Cannot dump context of null location')
		return;
	}
	let ret = 'context order for'+location.path;
	const locations = contextOrder(location);
	console.info('context order for',location.path);
	for(let i=0;i<locations.length;++i){
		ret += ('\n   '+locations[i].path);
	}
	console.info(ret);
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
