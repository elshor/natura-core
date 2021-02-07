import jsdoc from 'jsdoc-api'
import {sentenceCase} from 'change-case'
import fs from 'fs'
import {patternFields} from '../pattern.js'
import upload from './upload.mjs'
import terminal from  'terminal-kit';
const term = terminal.terminal;

processFile('./lib/','./packages/','jquery-ui');

function warn(input,...items){
	term.yellow(...items);
	term.yellow(` (${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
}

function error(input,...items){
	term.red(...items);
	term.red(` (${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
}


async function processFile(inputPath,outputPath,filename){
	const input = jsdoc.explainSync({
		files:inputPath + filename + '.js'
	});
	const output = {
		name:filename,
		_id:'public:'+filename,
		entities:{
			$type:'entity definition group',
			members:[],
			model:{isa:[]}
		}
	};
	input.forEach(item=>addTypeDef(item,output.entities.members));
	fs.writeFileSync(outputPath+filename+'.js','export default '+JSON.stringify(output,null,'  '));
	await upload(output);
	term.green.bold('uploaded ',filename,' package');
}

function addTypeDef(input,output){
	const naturaTag = (input.tags||[]).find(item=>item.title==="natura");
	if(naturaTag){
		const parsed = naturaTag.text.match(/^(expression|action|event|trait|entity|object)(\s+(.*))?$/);
		if(parsed){
			switch(parsed[1]){
				case 'action':
					return addActionType(input,parsed[3],output);
				case 'event':
					return addEventType(input,parsed[3],output);
				case 'trait':
					return addTraitType(input,parsed[3],output);
				case 'entity':
					return addEntityType(input,parsed[3],output);
				case 'object':
					return addObjectType(input,parsed[3],output);
				case 'expression':
					return addExpressionType(input,parsed[3],output);
			}
		}else{
			term.red('Error - using an unidentified natura tag format at ',`(${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
		}
	}
}

function addActionType(input,pattern,output){
	const fields = getFields(input,pattern);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	const def = {
		name:appType(input.name),
		isa:['action'],
		title:getTag(input,'title'),
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params||[])
	};

	output.push(def);
}

function addExpressionType(input,pattern,output){
	const fields = getFields(input,pattern);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	if(!Array.isArray(input.returns || input.returns.length !== 1)){
		term.red('Error - expression must be defined with exactly one returns type',`(${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
		return;
	}
	if(!input.returns[0].type){
		error(input,'The expression "',input.name,'" does not have a return type defined. Make sure the definition has a curly bracket enclosed type definition');
		return;
	}
	const def = {
		name:appType(input.name),
		isa:['expression'],
		title:getTag(input,'title'),
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		valueType:appType(input.returns[0].type.names,true),
		description:input.description,
		properties:propertiesObject(input.params||[])
	};

	output.push(def);
}

function addEventType(input,pattern,output){
	const fields = getFields(input,pattern);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	const def = {
		name:appType(input.name),
		isa:['event'],
		title:getTag(input,'title'),
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params||[])
	};
	if(input.type){
		//use scope of event type. this will enable for example referencing KeyState in MouseEvent
		def.scope = [{
			$type:'basic emit',
			type:appType(input.type.names),
			name:'the event',
			access:'event',
			useScope:true
		}]
	}
	output.push(def);
}

function addEntityType(input,pattern,output){
	const fields = getFields(input,pattern);
	const show = (input.properties||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	const def = {
		name:appType(input.name),
		title:appType(input.name),
		instanceType: appType(input.name,true),
		isa:['application type'],
		title:getTag(input,'title'),
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.properties||[]),
		scope: Object.entries(propertiesObject(input.properties||[])).map(([key,value])=>(
			{
				$type:'basic emit',
				type:value.type,
				name:value.placeholder,
				access:key.replace(/\./g,">"),
				description:value.description
			}
		))
	};

	//check if there is a  type definition. This can be used to register options or isa relationships
	((input.type||{}).names||[]).forEach(item=>{
		const json = safeParse(item);
		if(json === undefined){
			//assume the type is a type, not a JSON optino
			def.isa.push(appType(item));
		}else{
			//name is an option
			if(!def.options){
				def.options = [];
			}
			def.options.push(json);
		}
	});
	output.push(def);
}

function addObjectType(input,pattern,output){
	const def = {
		name:appType(input.name),
		instanceType: appType(input.name,true),
		isa:['application type'],
		title:getTag(input,'title'),
		description:input.description,
		properties:propertiesObject(input.properties||[]),
	};

	//register all properties
	Object.entries(propertiesObject(input.properties||[])).forEach(([key,value])=>{
		output.push({
			$type:'property',
			name:value.placeholder || appType(key),
			access:key.replace(/\./g,">"),
			objectType:appType(input.name),
			valueType:value.type,
			description:value.description
		})
	});

	output.push(def);
}


function addTraitType(input,pattern,output){
	const fields = getFields(input,pattern);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	const thisType = appType(input.this||'any');
	const def = {
		name:appType(input.name),
		isa:['trait.' + thisType],
		title:getTag(input,'title'),
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params||[])
	};
	output.push(def);
}

function appType(name,instance=false){
	if(Array.isArray(name)){
		if(name.length > 1){
			//several types defined. Treat it an an option property spec without a type
			return undefined;
		}else{
			return appType(name[0],instance);
		}
	}
	if(!typeof name === 'string'){
		throw new Error('unexpected format');
	}
	let ending = '';
	if(name.match(/^Array\.\<(.+)\>$/)){
		name = name.match(/^Array\.\<(.+)\>$/)[1];
		ending = '*';
}
	const type = sentenceCase(name||'').toLocaleLowerCase().trim();
	return instance?(asInstance(type) + ending) : (type + ending);
}

function asInstance(type){
	if(type === 'any'){
		return 'any instance';
	}
	const useAn = ['a','i','o','u','h','e'].includes(type[0]);
	return (useAn?'an ':'a ') + type;
}

function propertiesObject(params){
	const ret = {};
	(params||[]).forEach(param=>{
		const spec = {
			type:appType((param.type||{}).names,true),
		};
		if((param.description||'').match(/\-/)){
			//split the description to description and placeholder
			spec.placeholder = param.description.split('-')[0].trim();
			spec.description = param.description.split('-')[1].trim();
		}else{
			spec.placeholder = param.description;
		}

		if(param.type && Array.isArray(param.type.names) && param.type.names.length > 1){
			//this is a selection type. Assuming types are JSON parsable
			spec.options = param.type.names.map(name=>safeParse(name)).filter(name=>name !== undefined);
		}
		//set property spec
		ret[param.name] = spec;
	});
	return ret;
}

function moduleName(def){
	const parsed = (def.meta.filename||'').match(/^(.+?)(:?\.[a-zA-Z]+)?$/);
	if(!parsed){
		throw new Error('unexpected explain format');
	}
	return 'natura/lib/'+parsed[1];
}

function getTag(input,tag){
	const item =  (input.tags||[]).find(item=>item.title===tag);
	if(item){
		return item.value;
	}else{
		return undefined;
	}
}

function safeParse(text){
	try{
		return JSON.parse(text);
	}catch{
		return undefined;
	}
}

function getFields(input,pattern){
	const props = propertiesObject(input.params||[]);
	const fields = patternFields(pattern).map(field=>{
		if(!props[field.name]){
			warn(input,'the field "',field.name,'" in the pattern "',pattern,'" is not in the params list');
		}
		return field.name;
	});
	return fields;
}