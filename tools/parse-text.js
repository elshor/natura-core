import stringify from "../stringify.js";
import { getDictionary } from "../dictionary.js";
import { registerLoader } from "../loader.js";
import { readFileSync } from 'fs'

registerLoader(id=>{
	const text = readFileSync('/ml/natura-suggest/packages/' + id + '.json');
	return JSON.parse(text);
})

const packages = ["interact","datetime","query","college_1","elshor","core"];
const text = 'how many professors are in the "biology" department';
const target = 'type:interact action'

async function parse(text, packages){
	const dictionary = await getDictionary(packages);
	const parsed = dictionary.parse(text, target);
	if(parsed.length === 0){
		const wants = dictionary.parseWants(text, target);
		console.info('No parse found');
		const tokens = dictionary.suggestTokens(text);
		console.info(
			'suggestedTokens:',
			tokens.length > 0 && tokens.info
				? tokens.info(',') : 'no suggestions')
		console.info(
			'WANTS',
			Object.entries(wants.wants).map(([key,value])=>{
				return key + ':\n  ' + value.map(item=>item.toString()).join('\n  ')
			}).join('\n')
		)
	
		process.exit(-1)
	}else{
		console.info(JSON.stringify(parsed[0],null, '  '));
	}
	console.info('STRINGIFY',await stringify(parsed, dictionary))
}
await parse(text, packages);