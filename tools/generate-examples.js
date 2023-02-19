import { getDictionary } from "../dictionary.js";
const MAX_TOKENS = 100;
const ITERATIONS_FACTOR = 5
async function main(){
	const packages = ["interact@dev", "ga@dev", "date-time@dev","core@dev"];
	const target = 'type:interact action';
	const startText = ''
	const numberOfExamples = 50;
	const examples = {};
	const dictionary = await getDictionary(packages)
	let count = 0;
	while(Object.keys(examples).length < numberOfExamples && count <= ITERATIONS_FACTOR * numberOfExamples){
		const example = generateExample(dictionary, target, startText);
		count++;
		if(example){
			examples[example] = true;
		}
	}
	console.log('examples:\n');
	const list = Object.keys(examples);
	for(let i=0;i<list.length; ++i){
		console.log(i+1,':',list[i]);
	}
}

main();

function generateExample(dictionary, target, startText = ''){
	let text = startText;
	for(let i=0;i<MAX_TOKENS;++i){
		
		const token = nextToken(dictionary, text, target);
		if(token === null){
			if(text.endsWith('.')){
				//if text ends with . then we assume we tried to output a number instead of using example
				return generateExample(dictionary, target, startText);
			}
			console.log('ERROR no suggestions for', JSON.stringify(text));
			return null
		}
		if(token === '[EOS]'){
			return text + '.';
		}
		text += token;
	}
	return text;
}
function nextToken(dictionary, text, target){
	const tokens = dictionary.suggestTokens(text, target, {
		precedingSpace: ' ',
		eosToken: '[EOS]',
		DBQT: null,
		ANY: null,
		DIGIT: null
	}).filter(t=>t !== null)
	if(tokens.length === 0){
		return null;
	}
	const ret = tokens[Math.floor(Math.random() * tokens.length)];
	if(ret.trim() === ','){
		//normalize comma
		return ', ';
	}
	return ret;
}