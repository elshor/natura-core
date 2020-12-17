import {IllegalType} from './error.js'

export default function Type(type,location){
	if(typeof type === 'string'){
		return new BaseType(type);
	}
	if(type === undefined || type === null){
		return undefined;
	}
	if(type instanceof BaseType){
		return type;
	}else if(type !== null && typeof type === 'object'){
		switch(type.$type){
			case 'copy type':
				const val = location.parent.value;
				if(val && typeof val === 'object' && val[type.property]){
					return new BaseType(val[type.property]);
				}else{
					return new BaseType('any');
				}
			default:
				throw new Error(IllegalType);
		}
	}
}

class BaseType{
	constructor(type){
		this.type = type;
	}
	toString(){
		return this.type.toString();
	}
}

export function isCollectionType(type){
	return type? type.match(/\*$/) !== null : false;
}
