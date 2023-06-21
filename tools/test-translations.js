import { getDictionary } from "../dictionary.js";
import { registerLoader } from "../loader.js";
import {readFileSync} from 'fs'
import 'colors'

const options = {
	path:'/home/elshor/natura-suggest/docs/college_translations.txt',
	packages: ["interact","datetime","core","query","college_1","elshor"],
	target: 'query'
}

registerLoader(id=>{
	const text = readFileSync('/ml/natura-suggest/packages/' + id + '.json');
	return JSON.parse(text);
})

async function run({packages, target,path}){
	let success = 0;
	let total = 0;
	const dictionary = await getDictionary(packages);
	readFileSync(path,'utf-8')
	.split('\n')
	.filter(line=>!line.match(/^\d+\./))
	.filter(line=>line.length > 0)
	.map(line=>line.trim())
	.forEach(line=>{
		++total;
		const parsed = parse(line, dictionary, target);
		if(parsed){
			++success;
			console.info('SUCCESS'.green,line);
		}else{
			console.info('FAIL'.red, line);
		}
	})
	console.info('got',success,'out of', total)
}

run(options);
	
function parse(text, dictionary, target){
	const parsed = dictionary.parse(text, target);
	if(parsed.length === 0){
		return null;
	}else{
		return parsed[0];
	}
}	