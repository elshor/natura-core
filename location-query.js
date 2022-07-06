/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { createLocation } from "./location.js";
export default function locationQuery(location,path){ 
	if(path[0]==='/'){
		//the location is relative to top
		location = createLocation(location.data,location.dictionary);
	}
	let current = [location];
	const parts = path.split('/');
	parts.forEach(part=>{
		const now = [];
		current.forEach(l=>follow(l,part,now,location.dictionary));
		current = now;
	})
	return current;
}

function follow(location,part,current,dictionary){
	//TODO add other meta properties such as spec etc.
	if(!location){
		return;
	}
	if(!location.isLocation){
		//current object is not a location - wrap it in a location
		location = createLocation(location,dictionary);
	}else{
		location = location.referenced;
	}
	switch(part){
		case '':
		case '.':
		case '$':
			current.push(location);
			return;
		case '..':
			current.push(location.parent);
			return;
		case  '*':
			current.push(...location.children);
			return;
		case '**':
			current.push(...allChildren(location));
			return;
		case '$previous':
			current.push(location.previous);
			return;
		case '$valueTypeSpec':
			current.push(createLocation(location.valueTypeSpec,dictionary));
			return;
	}
	//check if this is a filter
	const query = part.match(/^\?(isa)\W+(.*)$/);
	if(query){
		//we are in a query - if pass then add current location
		const test = query[1];
		const arg = query[2];
		switch(test){
			case 'isa':
				if(location.dictionary.isa(location.type,arg)){
					current.push(location);
				}
				break;
			default:
				//unidentified test
				console.error('location query using unknown test',test,'- failing the test');
		}
	}else{
		current.push(location.child(part));
	}
}

function allChildren(location){
	const ret = [];
	function visitChildren(location){
		location.children.forEach(child=>{
			ret.push(child);
			visitChildren(child);
		})
	}
	visitChildren(location);
	return ret;
}

