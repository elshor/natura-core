/*
 *   Copyright (c) 2021 DSAS Holdings LTD.
 *   All rights reserved.
 */
import jsdoc from 'jsdoc-api'
import {sentenceCase} from 'change-case'
import fs from 'fs'
import {patternFields} from '../pattern.js'
import upload from './upload.mjs'
import {uploadS3} from './uploads3.mjs'
import terminal from  'terminal-kit';
import {assume} from '../error.js'
import { exit } from 'process'

const term = terminal.terminal;

processFile(process.argv[2]);

function warn(input,...items){
	items.forEach(item=>term.yellow(item));
	if(input.meta){
		term.yellow(` (${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
	}else{
		term.yellow('(no file info)\n');
	}
}

function error(input,...items){
	items.forEach(item=>term.red(item));
	if(input.meta){
		term.red(` (${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
	}else{
		term.red('(no file info)\n')
	}
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
		instances:{$type:'entity definition group',members:[]},
		actions:{$type:'action definition group',members:[]},
		properties:{$type:'entity definition group',members:[]},
		events:{$type:'event definition group',members:[]},
		traits:{$type:'entity definition group',members:[]},
		expressions:{$type:'expression definition group',name:'expressions',members:[]}
	};
	try{
		input.forEach(item=>addTypeDef(item,output));
	}catch(e){
		error(input,'Exception while processing file',e.message,e.stack);
		exit(1);
	}
	await upload(output);
	await uploadS3('natura-code','packages/'+filename+'/index.js',fs.readFileSync(path,'utf8'),'text/javascript');
	term.green.bold(new Date().toLocaleTimeString(),' uploaded ',filename,' package');
}

function addTypeDef(input,output){
	const naturaTag = (input.tags||[]).find(item=>item.title==="natura");
	if(naturaTag){
		const parsed = naturaTag.text.match(/^(options|expression|action|event|trait|entity|object)(\s+(.*))?$/);
		if(parsed){
			switch(parsed[1]){
				case 'action':
					return addActionType(input,parsed[3],output.actions.members);
				case 'event':
					return addEventType(input,parsed[3],output.events.members);
				case 'trait':
					return addTraitType(input,parsed[3],output.traits.members);
				case 'entity':
					return addEntityType(input,parsed[3],output.entities.members);
				case 'object':
					return addObjectType(input,parsed[3],output.entities.members,output.properties.members);
				case 'expression':
					return addExpressionType(input,parsed[3],output.expressions.members);
				case 'options':
					return addOptionsType(input,parsed[3],output.instances.members);
			}
		}else{
			term.red('Error - using an unidentified natura tag format at ',`(${input.meta.filename}:${input.meta.lineno}:${input.meta.columnno})\n`);
		}
	}
}

function addActionType(input,pattern,output){
	const def = {
		name:appType(input.name),
		$type:'js action',
		isa:['action'],
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		pattern,
		description:input.description
	};
	processProperties(input.params||[],def);
	processShow(input,pattern,def);
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

function addOptionsType(input,pattern,instances){
	(input.properties||[]).forEach(prop=>{
		const valueType = prop.type.names? prop.type.names[0] : prop.memberof;
		let value = safeParse(prop.defaultvalue);
		if(value === undefined){
			value = prop.defaultvalue;
		}
		const def = {
			$type:'js instance',
			id:prop.longname,
			description:prop.description,
			type:appType(valueType),
			value,
			label:safeParse(prop.name) || prop.name
		}
		instances.push(def);
	})

}

function addExpressionType(input,pattern,output){
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
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		pattern,
		valueType:appType(input.returns[0].type.names,true),
		description:input.description,
	};
	processProperties(input.params,def);
	processShow(input,pattern,def);
	processAdditionalTags(input,def);
	output.push(def);
}

function addEventType(input,pattern,output){
	const def = {
		name:appType(input.name),
		$type:'js event',
		isa:['event'],
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		pattern,
		description:input.description,
	};
	processProperties(input.params,def);
	processShow(input,pattern,def);
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
	const def = {
		name:appType(input.name),
		$type:'js type',
		title:appType(input.name),
		instanceType: appType(input.name,true),
		isa:['application type'],
		pattern,
		description:input.description
	}
	processProperties(input.properties,def);
	processShow(input,pattern,def);
	def.scope = Object.entries(def.properties).map(([key,value])=>(
		{
			$type:'basic emit',
			type:value.type,
			name:value.placeholder,
			access:key.replace(/\./g,">"),
			description:value.description
		}
	))

	//check if there is a  type definition. This can be used to register options or isa relationships
	if(input.type && typeof input.type==='object' && Array.isArray(input.type.names)){
			input.type.names.forEach(item=>{
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
			};
		});
	}

	//if the kind of input is function then add fn property
	if(input.kind === 'function'){
		def.fn = `${input.name}@${moduleName(input)}(${(input.properties||[]).map(item=>item.name).join(',')})`;

	}
	processAdditionalTags(input,def);
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
	};
	processProperties(input.properties,def);
	processAdditionalTags(input,def);

	//register all properties
	Object.entries(def.properties).forEach(([key,value])=>{
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
	const thisType = appType(input.this||'any');
	const def = {
		$type:'js trait',
		name:appType(input.name),
		subject:thisType,
		isa:['trait.' + thisType],
		fn:`${input.name}@${moduleName(input)}(${(input.params||[]).map(item=>item.name).join(',')})`,
		pattern,
		description:input.description,
	};
	processProperties(input.params,def);
	processAdditionalTags(input,def);
	processShow(input,pattern,def);
	
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

/**
 * Generate properties object. Note: this function can have side effect on owner so only call this function with owner once per owner
 * @param params 
 * @param owner 
 * @returns 
 */
function processProperties(params=[],owner){
	assume(owner,'processProperties must have an owner');
	const ret = {};
	params.forEach(param=>{
		const spec = {
			$type:'js type prop',
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
				const parts=mod.split(':').map(item=>item.trim());
				switch(parts[0]){
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
					case 'pathOptions':
						spec.options = {$type:'path options',path:parts[1]}
						break;
					case 'no insert':
						spec.childSpec = spec.childSpec || {};
						spec.childSpec.noInsert = true;
						break;
						case 'no cut':
							spec.childSpec = spec.childSpec || {};
							spec.childSpec.noCut = true;
							break;
						case 'no paste':
							spec.childSpec = spec.childSpec || {};
							spec.childSpec.noPaste = true;
							break;
						case 'no copy':
							spec.childSpec = spec.childSpec || {};
							spec.childSpec.noCopy = true;
							break;
						case 'emit':
							if(owner){
								owner.context = owner.context || [];
								owner.context.push({
									$type:'emit property',
									property:param.name,
									type:spec.type,
									name: parts[1] || 'the ' + spec.type,
								});	
							}
							break;
				}
			})
		}

		if(param.type && Array.isArray(param.type.names) && param.type.names.length > 1){
			//this is a selection type. Assuming types are JSON parsable
			spec.options = param.type.names.map(name=>safeParse(name)).filter(name=>name !== undefined);
			spec.$type = 'js options prop'
		}
		//set property spec
		ret[param.name] = spec;
	});
	owner.properties = ret;
}

function processShow(input,pattern,def){
	assume(def && def.properties,'processProperties must be called before processShow');
	const fields = getFields(input,pattern,def.properties);
	def.show = Object.keys(def.properties).filter(name=>!fields.includes(name));
	def.inlineDetails = def.inlineDetails || (def.show.length>0 ? 'collapsed' : 'none');
}

function moduleName(def){
	const parsed = (def.meta.filename||'').match(/^(.+?)(:?\.[a-zA-Z]+)?$/);
	if(!parsed){
		throw new Error('unexpected explain format');
	}
	return '/packages/'+parsed[1];
}

/**
 * get the tag value
 * @param input input data from jsdoc parser
 * @param tag the tag to look for. this must be lowercase
 * @returns The tag value if exists or null if the tag exists but has no value
 */
function getTag(input,tag){
	const item =  (input.tags||[]).find(item=>item.title===tag);
	if(item){
		return item.value || null;
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

function getFields(input,pattern,props){
	assume(props,'getFields must have props');
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
		def.isa = (def.isa||[]).concat(isa.split(',').map(item=>item.trim()).map(item=>appType(item)));
	}
	const template = getTag(input,'temp');
	if(template){
		def.template = template;
	}
	if(getTag(input,'inlineexpanded') !== undefined){
		def.inlineDetails = "expanded";
		def.expanded = true;
	}
	const hat = getTag(input,'hat');
	if(hat){
		const parsed = hat.match(/^(\S+?)\s+([^\s\|]+?)(?:\s+([^\s\|][^\|]+?))?\s*(?:\|\s*(.*))?$/);
		if(!parsed){
			error(input,'The hat tag has the wrong format. Should be: icon topic paths?| description');
		}else{
			def.hat = {
				$type:'hat action',
				action:{
					$type:'post message',
					topic: parsed[2],
					message:parsed[3]
				},
				hint:parsed[4],
				icon:parsed[1]
			}
		}
	}
	const change = getTag(input,'change');
	if(change){
		const parsed = change.match(/^\s*(\S+)(?:\s+(.*))?$/);
		if(!parsed){
			error(input,'The change tag has the wrong format. Should be: topic path/to/object?');
		}else{
			def.onchange = {
				$type:'post message',
				topic: parsed[1],
				message:parsed[2]?parsed[2].trim() : undefined
			}
		}
	}
	const del = getTag(input,'delete');
	if(del){
		const parsed = del.match(/^\s*(\S+)(?:\s+(.*))?$/);
		if(!parsed){
			error(input,'The delete tag has the wrong format. Should be: topic path/to/object?');
		}else{
			def.ondelete = {
				$type:'post message',
				topic: parsed[1],
				message:parsed[2]?parsed[2].trim() : undefined
			}
		}
	}
	const create = getTag(input,'create');
	if(create){
		const parsed = create.match(/^\s*(\S+)(?:\s+(.*))?$/);
		if(!parsed){
			error(input,'The create tag has the wrong format. Should be: topic path/to/object?');
		}else{
			def.oncreate = {
				$type:'post message',
				topic: parsed[1],
				message:parsed[2]?parsed[2].trim() : undefined
			}
		}
	}

	const action = getTag(input,'action');
	if(action){
		const parsed = action.match(/^(\S+?)\s+([^\s\|]+?)(?:\s+([^\s\|][^\|]+?))?\s*(?:\|\s*(.*))?$/);
		if(!parsed){
			error(input,'The action tag has the wrong format. Should be: icon topic paths?| description');
		}else{
			def.actions = [{
				$type:'hat action',
				action:{
					$type:'post message',
					topic: parsed[2],
					message:parsed[3]
				},
				hint:parsed[4],
				description:parsed[4],
				icon:parsed[1]
			}]
		}
	}
}
