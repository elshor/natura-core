import { getDictionary } from "../dictionary.js";
import { registerLoader } from "../loader.js";
import {readFileSync} from 'fs'
import inquirer from 'inquirer';
import inquirerCommand from 'inquirer-command-prompt'
import inquirerPrompt from 'inquirer-autocomplete-prompt';
import 'colors'
const MAX_DEPTH = 5;

inquirer.registerPrompt('command',inquirerCommand)
inquirer.registerPrompt('autocomplete', inquirerPrompt);

const options = {
	packages: ["interact","datetime","core","query","college_1","elshor"],
	target: 'query',
	text: '',
	noSkip: false
}
registerLoader(id=>{
	const text = readFileSync('/ml/natura-suggest/packages/' + id + '.json');
	return JSON.parse(text);
})

async function suggest({text, dictionary, target, stateIds}){
	const tokens = dictionary.suggestTokens(text, target,{precedingSpace:'_'});
	const parsed = dictionary.parse(text, target)
	const wants = dictionary.parseWants(text, target);
	let lastId = 0;
	console.info(parsed.length >0? '[complete]'.bgBlue:'[incomplete]'.bgBlue,tokens.join(', '));
	console.info('WANTS');
	Object.entries(wants.wants).forEach(([key,value])=>{
		console.info(key);
		value.forEach(item=>{
			lastId++;
			stateIds[lastId] = item;
			console.info('    ', lastId + '.',item.toString())
		})
	})
	return tokens;
}
await topLoop(options);

function ruleToString(rule){
	return rule.symbols.map(getSymbolShortDisplay).join(' ')
}

function getSymbolShortDisplay(symbol) {
	var type = typeof symbol;
	if (type === "string") {
			return symbol;
	} else if (type === "object") {
			if (symbol.literal) {
					return JSON.stringify(symbol.literal);
			} else if (symbol instanceof RegExp) {
					return symbol.toString();
			} else if (symbol.type) {
					return '%' + symbol.type;
			} else if (symbol.test) {
					return '<' + String(symbol.test) + '>';
			} else if(symbol.example){
				return 'example: ' + symbol.example;
			} else {
					throw new Error('Unknown symbol type: ' + JSON.stringify(symbol));
			}
	}
}

async function topLoop(options){
	let {target, packages, text, noSkip} = options;
	const stateIds = [];
	const dictionary = await getDictionary(packages);
	const stack = [text];
	console.clear();
	while(true){
		//loop until no tokens
		console.info(text.brightBlue)
		const tokens = await suggest({text, dictionary, target, stateIds});
		if(tokens.length === 1 && !noSkip){
			const token = tokens[0]
				.replace(/_/g,' ') //spaces as underscore
				.replace("[SP]",' ')
				.replace(/  +/g,' ')//normalize spaces
			if(token === '</s>'){
				const parsed = dictionary.parse(text, target);
				if(parsed.length > 0){
					console.info('Completed'.bgBlue)
					console.info(JSON.stringify(parsed[0], null, '  '));
				}
				break;
			}
			if(token === ' ' && text.endsWith(' ')){
				//we can only add space after space - this is probably an endless loop => break;
				break;
			}
			text += token;
			console.clear();
			continue;
		}
		if(tokens.length === 0){
			console.info('No Suggestions'.bgBlue)
			const parsed = dictionary.parse(text, target);
			if(parsed.length > 0){
				console.info('Completed'.bgBlue)
				console.info(JSON.stringify(parsed[0], null, '  '));	
			}
			break;
		}
		console.info((target + ':').green, text.green);
		console.info('  n# for state tree, target: for change target'.grey)
		const value = await inquirer.prompt({
			type: 'autocomplete',
			name: 'token',
			loop: false,
			message: text.green,
			source(answersSoFar, input=''){
				return tokens
					.filter(token=>{
						return token.startsWith(input) ||
							token.startsWith('_' + input)
					})
					.concat(input, 'BACK','END')
					.map(token=>(token === ' '? '_' : token))
					.filter(c=>  c !== '')
				
			}
		});
		if(value.token.match(/(\d*)\#$/)){
			const state = stateIds[Number.parseInt(value.token.match(/(\d*)\#$/)[1])]
			console.info('WANTED BY')
			state.wantedBy.forEach(w=>{
				dumpState(w, 1);
			})
			continue;	
		}
		if(value.token.endsWith(':') && value.token.length > 1){
			//this is a request to chane target
			target = value.token.substr(0, value.token.length - 1);
			console.info(('changed target to ' + target.bgBlue).bgBlue)
			console.clear();
			continue;
		}
		if(value.token === 'END' || value.token.trim() === '</s>'){
			const parsed = dictionary.parse(text, target);
			if(parsed.length > 0){
				console.info('Completed'.bgBlue)
				console.info(JSON.stringify(parsed[0], null, '  '));
			}else{
				console.info('Parse Failed'.bgBlue)
			}
			break;
		}
		if(value.token === 'BACK'){
			stack.pop();
			text = stack[stack.length - 1];
			console.clear();
			continue;
		}
		text += value.token.replace("_"," ");
		stack.push(text);
	}

	//show rules
	const names = uniqueNames(dictionary.parser.grammer.ParserRules)
		.concat(... dictionary.parser.assertions.getAssertions().map(a=>"=>" + a))
	while(true){
		try{
		const value = await inquirer.prompt({
			type: 'autocomplete',
			name: 'answer',
			loop: false,
			message: "Which rules do you want to show? Enter to restart",
			source(_, input=''){
				const ret = names.filter(name=>{
					return name.toLowerCase().startsWith(input.toLowerCase()) ||
					name.toLowerCase().startsWith('type:' + input.toLowerCase()) ||
					name.toLowerCase().startsWith('=>' + input.toLowerCase())
				});
				if(input === ''){
					ret.unshift('RESTART');
				}
				if(input !== '' && !names.includes(input)){
					ret.unshift(input);
				}
				return ret;
			}
		})
		if(value.answer === 'RESTART'){
			setImmediate(()=>topLoop(options));
			break;
		}
		console.info(value.answer.green);
		if(value.answer.startsWith('=>')){
			dictionary.parser.assertions.getByAssertionAll(value.answer.substr(2)).forEach(type=>{
				console.info('  ',type.toString(), type.assumptions? JSON.stringify(type.assumptions) : '')
			})
		}else{
			dictionary.parser
			.getGrammer()
			.getRulesByName(value.answer)
			.forEach(rule=>{
				console.info('  ',ruleToString(rule));
		})
		}
	}catch(e){console.log('got exception',e)}
	}
}

function uniqueNames(rules){
	const names = {};
	rules.forEach(rule=>{
		names[rule.name] = true;
	})
	return Object.keys(names);
}

function unique(list){
	const items = {};
	list.forEach(item=>{
		items[item] = true;
	})
	return Object.keys(items);
}

function dumpState(state, offset=0){
	const spaces = ' '.repeat(offset * 4);
	console.info(spaces, state.toString());
	if(offset < MAX_DEPTH){
		state.wantedBy.forEach(w=>dumpState(w, offset + 1));
	}
}