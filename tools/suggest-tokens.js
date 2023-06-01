import { getDictionary } from "../dictionary.js";
import { registerLoader } from "../loader.js";
import {readFileSync} from 'fs'

const options = {
	packages: ["interact","datetime","query","college_1","core"],
	target: 'show a table',
	text: 'show a table of students, where'
}
registerLoader(id=>{
	const text = readFileSync('/ml/natura-suggest/packages/' + id + '.json');
	return JSON.parse(text);
})

async function suggest({text, packages, target}){
	const dictionary = await getDictionary(packages);
	const tokens = dictionary.suggestTokens(text, target);
	const parsed = dictionary.parse(text)
	const wants = dictionary.parseWants(text);
	console.info(parsed.length >0? '[complete]':'[incomplete]',tokens.join(', '));
	console.info(
		'WANTS',
		wants.completed?'[completed]\n' : '[failed]\n', 
		Object.entries(wants.wants).map(([key,value])=>{
			return key + ':\n  ' + value.map(item=>item.toString()).join('\n  ')
		}).join('\n')
	)
}
await suggest(options);