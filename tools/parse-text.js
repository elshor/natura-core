import { getDictionary } from "../dictionary.js";
const packages = ["interact@dev", "ga@dev", "date-time@dev","core@dev","define@dev"];
const text = 'define number of events named "page_view" where web page ';
//const text = 'define number of events named "page_view" where web page is the web page';
const target = 'trait<web page>'

async function parse(text, packages){
	const dictionary = await getDictionary(packages);
	const parsed = dictionary.parse(text, target);
	if(parsed.length === 0){
		console.log('No parsed found');
		process.exit(-1)
	}else{
		console.log(JSON.stringify(parsed[0],null, '  '));
	}
}
await parse(text, packages);