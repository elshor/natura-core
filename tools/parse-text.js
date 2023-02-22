import { getDictionary } from "../dictionary.js";
const packages = ["interact@dev", "ga@dev", "date-time@dev","core@dev"];
const text = 'show a table of events named "page_view" display';

async function parse(text, packages){
	const dictionary = await getDictionary(packages);
	const parsed = dictionary.parse(text);
	if(parsed.length === 0){
		console.log('No parsed found');
	}else{
		console.log(JSON.stringify(parsed[0],null, '  '));
	}
}
await parse(text, packages);