import { getDictionary } from "../dictionary.js";
const packages = ["interact@dev", "ga@dev", "date-time@dev","core@dev","define@dev"];
const text = 'define number of events named "page_view", where web page is the web page'
async function suggest(text, packages){
	const dictionary = await getDictionary(packages);
	const tokens = dictionary.suggestTokens(text);
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
await suggest(text, packages);