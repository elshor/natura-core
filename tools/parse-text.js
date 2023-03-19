import { getDictionary } from "../dictionary.js";
const packages = ["interact@dev", "ga@dev", "date-time@dev","core@dev","define@dev"];
const text = 'define number of sessions where exit page is the web page';
const target = 'type:interact action'

async function parse(text, packages){
	const dictionary = await getDictionary(packages);
	const parsed = dictionary.parse(text, target);
	if(parsed.length === 0){
		const wants = dictionary.parseWants(text, target);
		console.info('No parse found');
		const tokens = dictionary.suggestTokens(text);
		console.info('suggestedTokens:',tokens.length > 0?tokens.info(',') : 'no suggestions')
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
}
await parse(text, packages);