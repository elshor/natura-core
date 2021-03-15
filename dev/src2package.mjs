import jsdoc from 'jsdoc-api'
import {sentenceCase} from 'change-case'
import fs from 'fs'
import {patternFields} from '../pattern.js'
import upload from './upload.mjs'
import {uploadS3} from './uploads3.mjs'
import terminal from  'terminal-kit';
const term = terminal.terminal;

processFile(process.argv[2]);

function warn(input,...items){
	term.yellow(...items);
	term.yellow(` (${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
}

function error(input,...items){
	term.red(...items);
	term.red(` (${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
}


async function processFile(path){
	const filename = path.match(/\/|\\([^\\\/]*)\.(js|mjs)$/)[1];
	let input;
	try{
		input = jsdoc.explainSync({files:path});
	}catch(e){
		error('document parse error',e.message);
	}
	const output = {
		$type:'package',
		packages:['base'],
		name:filename,
		_id:'public:'+filename,
		files:['packages/'+filename+'/index.js'],
		entities:{$type:'entity definition group',members:[]},
		actions:{$type:'action definition group',members:[]},
		properties:[],
		events:{$type:'event definition group',members:[]},
		traits:[],
		expressions:{$type:'expression definition group',name:'expressions',members:[]}
	};
	input.forEach(item=>addTypeDef(item,output));
	await upload(output);
	await uploadS3('natura-code','packages/'+filename+'/index.js',fs.readFileSync(path,'utf8'),'text/javascript');
	term.green.bold(new Date().toLocaleTimeString(),' uploaded ',filename,' package');
}

function addTypeDef(input,output){
	const naturaTag = (input.tags||[]).find(item=>item.title==="natura");
	if(naturaTag){
		const parsed = naturaTag.text.match(/^(expression|action|event|trait|entity|object)(\s+(.*))?$/);
		if(parsed){
			switch(parsed[1]){
				case 'action':
					return addActionType(input,parsed[3],output.actions.members);
				case 'event':
					return addEventType(input,parsed[3],output.events.members);
				case 'trait':
					return addTraitType(input,parsed[3],output.traits);
				case 'entity':
					return addEntityType(input,parsed[3],output.entities.members);
				case 'object':
					return addObjectType(input,parsed[3],output.entities.members,output.properties);
				case 'expression':
					return addExpressionType(input,parsed[3],output.expressions.members);
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
		$type:'js action',
		isa:['action'],
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params||[])
	};
	processAdditionalTags(input,def);
	if(Array.isArray(input.returns)){
		def.context = [];
		input.returns.forEach(returnItem=>{
			const type = appType(returnItem.type.names,true);
			if(typeof returnItem.description !== 'string'  || returnItem.description.trim()===''){
				//no reference or access specified
				def.context.push({
					$type:'basic emit',
					type,
					name:'the return value',
					access:'_'
				});
			}else{
				//there are both, access and name
				const parsed = returnItem.description.match(/^\s*(.+?)\s*(\-\s*(.*?)\s*)?$/);
				def.context.push({
					$type:'basic emit',
					type,
					name: parsed[3] || parsed[1],
					access:parsed[3]? parsed[1] : '_'//if access defined then use it, otherwise _
				});
			}
		})
	}

	output.push(def);
}

function addExpressionType(input,pattern,output){
	const fields = getFields(input,pattern);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	if(!Array.isArray(input.returns) || input.returns.length !== 1){
		error(input,'Expression must be defined with exactly one returns type');
		return;
	}
	if(!input.returns[0].type){
		error(input,'The expression "',input.name,'" does not have a return type defined. Make sure the definition has a curly bracket enclosed type definition');
		return;
	}
	const def = {
		name:appType(input.name),
		$type:'js expression',
		isa:['expression'],
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		valueType:appType(input.returns[0].type.names,true),
		description:input.description,
		properties:propertiesObject(input.params||[])
	};
	processAdditionalTags(input,def);
	output.push(def);
}

function addEventType(input,pattern,output){
	const fields = getFields(input,pattern);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	const def = {
		name:appType(input.name),
		$type:'js event',
		isa:['event'],
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params||[])
	};
	processAdditionalTags(input,def);
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
		$type:'js type',
		title:appType(input.name),
		instanceType: appType(input.name,true),
		isa:['application type'],
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

	//if the kind of input is function then add fn property
	if(input.kind === 'function'){
		def.fn = `${input.name}@${moduleName(input)}(${(input.properties||[]).map(item=>item.name).join(',')})`;

	}
	output.push(def);
}

function addObjectType(input,pattern,output,properties){
	const def = {
		name:appType(input.name),
		$type:'js type',
		instanceType: appType(input.name,true),
		isa:['application type'],
		show : (input.properties||[]).map(prop=>prop.name),
		description:input.description,
		properties:propertiesObject(input.properties||[]),
	};
	processAdditionalTags(input,def);

	//register all properties
	Object.entries(propertiesObject(input.properties||[])).forEach(([key,value])=>{
		properties.push({
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
		$type:'js trait',
		name:appType(input.name),
		subject:thisType,
		isa:['trait.' + thisType],
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params||[])
	};
	processAdditionalTags(input,def);
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

	//if name ends with $ then in any case don't generate an instance
	if(name.endsWith('$') || name.match(/^Array\.\<(.+)\$\>$/)){
		instance = false;
	}
	let ending = '';
	if(name.match(/^Array\.\<(.+)\>$/)){
		name = name.match(/^Array\.\<(.+)\$?\>$/)[1];
		ending = '*';
	}
	const humanName = (name||'').split('.').map(item=>sentenceCase(item)).join('.');
	const type = humanName.toLocaleLowerCase().trim();
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
			title:appType(param.name)
		};
		const parsed = (param.description||'').match(/^\s*(.+?)\s*(\-\s*(.*?)\s*)?(\((.*)\))?\s*$/);
		if(parsed && parsed[3]){
			//split the description to description and placeholder
			spec.placeholder = parsed[1];
			spec.description = parsed[3];
		}else if(parsed && parsed[1]){
			spec.placeholder = parsed[1];
		}

		//check for additional property modifiers
		if(parsed && parsed[5]){
			parsed[5].split(',').map(item=>item.trim()).forEach(mod=>{
				switch(mod){
					case 'expanded':
						spec.expanded = true;
						break;
					case 'readonly':
						spec.readonly = true;
						break;
					case 'required':
						spec.required = true;
						break;
					case 'hideName':
					case 'hide name':
						spec.hideName = true;
						break;
				}
			})
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
	return '/packages/'+parsed[1];
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
	const props = propertiesObject(input.params||input.properties || []);
	const fields = patternFields(pattern).map(field=>{
		if(!props[field.name]){
			warn(input,'the field "',field.name,'" in the pattern "',pattern,'" is not in the params list');
		}
		return field.name;
	});
	return fields;
}

function processAdditionalTags(input,def){
	const title = getTag(input,'title');
	if(title){
		def.title = title;
	}
	const isa = getTag(input,'isa');
	if(isa){
		def.isa = isa.split(',').map(item=>item.trim()).map(item=>appType(item));
	}
	if(getTag(input,'inlineExpanded')){
		def.inlineDetails = "expanded";
		def.expanded = true;
	}
}