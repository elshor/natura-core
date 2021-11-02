/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import HB from 'handlebars';
import { specContextType } from './spec.js';

export function calcTemplate(templateText,context){
	if(typeof templateText !== 'string'){
		//if templateText is not a string then return null
		return null;
	}
	try{
		const template = HB.compile(templateText,{noEscape:true});
		return template(context,{allowProtoPropertiesByDefault:true});
	}catch(e){
		console.error('Error parsing template',JSON.stringify(templateText),'for',context);
	}
}

//register template functions
HB.registerHelper('the',function(type){
	const dictionary = this.$dictionary;
	return 'the ' + (dictionary? specContextType(dictionary.getTypeSpec(type)) : type)
})
