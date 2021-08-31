/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import HB from 'handlebars';

export function calcTemplate(templateText,context){
	if(typeof templateText !== 'string'){
		//if templateText is not a string then return null
		return null;
	}
	try{
		const template = HB.compile(templateText,{noEscape:true});
		return template(context,{allowProtoPropertiesByDefault:true});
	}catch(e){
		throw new Error('Error calculating template',templateText);
	}
}
