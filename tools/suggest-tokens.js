import { getDictionary } from "../dictionary.js";
const packages = ["interact@dev", "ga@dev", "date-time@dev","core@dev"];
const text = 'show the value of checkouts, where city starts with "some text", after July 28, 2020'
async function suggest(text, packages){
	const dictionary = await getDictionary(packages);
	const tokens = dictionary.suggestTokens(text);
	console.log(tokens.join(', '));
}
await suggest(text, packages);