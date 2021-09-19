/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
//default language is English
import pluralize from 'pluralize'
export default function(){
	return en;
}
const en = {
	singular(type){
		return pluralize.singular(type);
	},
	plural(type){
		return pluralize(type);
	},
	theType(type){
		return 'the ' + type;
	},
	of(property,object){
		if(!object){
			return property;
		}else{
			return `${property} of ${object}`;
		}
	},
}
