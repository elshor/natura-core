import jsdoc from 'jsdoc-api'
import {sentenceCase} from 'change-case'
import fs from 'fs'
import {patternFields} from '../pattern.js'
import upload from './upload.mjs'

processFile('./lib/','./packages/','jquery-ui');



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
	console.info('uploaded',filename,'package');
}

function addTypeDef(input,output){
	const naturaTag = (input.tags||[]).find(item=>item.title==="natura");
	if(naturaTag){
		const parsed = naturaTag.text.match(/^(expression|action|event)\s+(.*)$/);
		if(parsed){
			switch(parsed[1]){
				case 'action':
					return addActionType(input,parsed[2],output);
				case 'event':
					return addEventType(input,parsed[2],output);
			}
		}
	}
}

function addActionType(input,pattern,output){
	const fields = patternFields(pattern).map(field=>field.name);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	const def = {
		name:appType(input.name),
		isa:['action'],
		title:getTag(input,'title'),
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${input.params.map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params)
	};
	output.push(def);
}
function addEventType(input,pattern,output){
	const fields = patternFields(pattern).map(field=>field.name);
	const show = (input.params||[]).map(param=>param.name).filter(name=>!fields.includes(name));
	const def = {
		name:appType(input.name),
		isa:['event'],
		title:getTag(input,'title'),
		inlineDetails:show.length>0 ? 'collapsed' : 'none',
		fn:`${input.name}@${moduleName(input)}(${input.params.map(item=>item.name).join(',')})`,
		show,
		pattern,
		description:input.description,
		properties:propertiesObject(input.params)
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
	const type = sentenceCase(name||'').toLocaleLowerCase().trim();
	const useAn = ['a','i','o','u','h','e'].includes(type[0]);
	return instance?((useAn?'an ':'a ') + type) : type;
}

function propertiesObject(params){
	const ret = {};
	params.forEach(param=>{
		const spec = {
			type:appType(param.type.names,true),
		};
		if((param.description||'').match(/\-/)){
			//split the description to description and placeholder
			spec.placeholder = param.description.split('-')[0].trim();
			spec.description = param.description.split('-')[1].trim();
		}else{
			spec.placeholder = param.description;
		}

		if(Array.isArray(param.type.names) && param.type.names.length > 1){
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

