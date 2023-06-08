import { exit } from "process";
import { getDictionary } from "../dictionary.js";
import { registerLoader } from "../loader.js";
import {readFileSync} from 'fs'
import inquirer from 'inquirer';
import inquirerCommand from 'inquirer-command-prompt'
import inquirerPrompt from 'inquirer-autocomplete-prompt';
import 'colors'

inquirer.registerPrompt('command',inquirerCommand)
inquirer.registerPrompt('autocomplete', inquirerPrompt);

const options = {
	packages: ["interact","datetime","query","college_1","elshor","core"],
	target: 'interact action',
	text: ''
}
registerLoader(id=>{
	const text = readFileSync('/ml/natura-suggest/packages/' + id + '.json');
	return JSON.parse(text);
})

async function suggest({text, dictionary, target}){
	const tokens = dictionary.suggestTokens(text, target,{precedingSpace:'_'});
	const parsed = dictionary.parse(text, target)
	const wants = dictionary.parseWants(text, target);
	console.info(parsed.length >0? '[complete]'.bgBlue:'[incomplete]'.bgBlue,tokens.join(', '));
	console.info(
		'WANTS\n',
		Object.entries(wants.wants).map(([key,value])=>{
			return key 
				+ ':\n  ' 
				+ unique(
					value
					.map(item=>item.toString().replace(/context \d+$/,'') + (item.rule?.source || ''))
					).join('\n  ')
		}).join('\n')
	)
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
			} else {
					throw new Error('Unknown symbol type: ' + symbol);
			}
	}
}

async function topLoop(options){
	let {target, packages, text} = options;
	const dictionary = await getDictionary(packages);
	const stack = [text];
	while(true){
		//loop until no tokens
		console.clear();
		console.info(text.brightBlue)
		const tokens = await suggest({text, dictionary, target});
		if(tokens.length === 1){
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
		if(value.token.endsWith(':') && value.token.length > 1){
			//this is a request to chane target
			target = value.token.substr(0, value.token.length - 1);
			console.info(('changed target to ' + target.bgBlue).bgBlue)
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