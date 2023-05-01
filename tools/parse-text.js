import { getDictionary } from "../dictionary.js";
const packages = ["interact@dev", "ga@dev", "date-time@dev","core@dev","define@dev"];
const text = 'show a table of the top 10 web pages by number of landings displaying url, number of landings';
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
}
await parse(text, packages);