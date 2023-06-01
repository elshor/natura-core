import { getDictionary } from "../dictionary.js";
import { registerLoader } from "../loader.js";
import {readFileSync, writeFileSync} from 'fs'
import stringify from "../stringify.js";
const options = {
	showErrors: false,
	iterationsFactor: 20,
	maxTokens: 100,
	numberOfExamples: 100,
	packages:  ["interact","core","datetime","query","college_1"],
	target: 'show a table',
	startText: '',
	output: '/home/elshor/natura-suggest/examples.json'
}

registerLoader(id=>{
	const text = readFileSync('/ml/natura-suggest/packages/' + id + '.json');
	return JSON.parse(text);
})

async function main(options){
	const {numberOfExamples, iterationsFactor, packages, target, startText} = options;
	const examples = {};
	const dictionary = await getDictionary(packages)
	let count = 0;
	let uniqueCount = 0;
	while(Object.keys(examples).length < numberOfExamples && count <= iterationsFactor * numberOfExamples){
		const example = generateExample(options, dictionary, target, startText);
		count++;
		if(typeof example === 'string' && !examples[example]){
			uniqueCount++;
			console.info(count,example, '(' + uniqueCount + ')')
		}
		if(example){
			examples[example] = true;
		}
	}

	//generate examples
	const generatedExamples = [];
	for(let i=0;i<Object.keys(examples).length;++i){
		const inputString = Object.keys(examples)[i].replace(/\.$/,'');
		const parsed = dictionary.parse(inputString, target);
		const outputString = await stringify(parsed, dictionary)
		generatedExamples.push({
			input: inputString,
			output: outputString
		})
	}

	//generate json file
	const output = {
		created: new Date(),
		packages,
		target,
		startText,
		examples: generatedExamples
	}

	const outputText = JSON.stringify(output, null, '  ');
	writeFileSync(options.output, outputText, 'utf-8');
}

main(options);

function generateExample(options, dictionary, target, startText = ''){
	let text = startText;
	for(let i=0;i<options.maxTokens;++i){
		
		const token = nextToken(dictionary, text, target);
		if(token === null){
			if(text.endsWith('.')){
				//if text ends with . then we assume we tried to output a number instead of using example
				return generateExample(options, dictionary, target, startText);
			}
			if(options.showErrors){
				console.log('ERROR no suggestions for', JSON.stringify(text));
			}
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
		DIGIT: null,
		DIGITS: null
	}).filter(t=>t !== null && !t.includes('[SP]'))
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