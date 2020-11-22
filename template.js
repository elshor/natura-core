import HB from 'handlebars';

export function calcTemplate(templateText,context){
	const template = HB.compile(templateText,{noEscape:true});
	return template(context);
}
