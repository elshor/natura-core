import {Rule} from './parsely.js'

export function expandRule(rule, term){
	const {symbols, mapping} = expandSymbols(rule.symbols, term)
	const postprocess = rule.postprocess
		? generatePostprocessSpecialized(rule.postprocess,term, mapping)
		: null;
	return new Rule(
		rule.name + '<' + term + '>',
		symbols,
		postprocess,
		rule.description,
		rule.source,
		null,
		rule.pkg,
		rule.noSuggest
	)
}

function generatePostprocessSpecialized(fn, specializedFor, mapping){
	return postprocessSpecialized.bind({fn, specializedFor, mapping});
}

/** postprocess function that calls wrap function and ads $specializedFor property to output object */
function postprocessSpecialized(data, reference, fail){
	const {fn, specializedFor, mapping} = this;
	const mappedData = mapping.map(pos=>data[pos]);
	const ret = fn(mappedData, reference, fail);
	if(ret && typeof ret === 'object'){
		ret.$specializedFor = specializedFor;
	}
	return ret;
}


function expandSymbols(source, s){
	const symbols = [];
	const mapping = [];
	source.forEach(item=>{
		if(typeof item !== 'string'){
			mapping.push(symbols.length);
			symbols.push(item)
		}else{
			mapping.push(symbols.length);
			symbols.push(parameterizeType(item, s));
		}
	})
	return {symbols, mapping};
}

function parameterizeType(type, parameter){
	return type
	.replace(/(.*)<(?:t|T)>([\*\?]*)/,'$1<' + parameter + '>$2')
}

/** Test if the rule can be expanded i.e. it uses symbol expansions */
export function isExpandable(rule){
	for(let i=0;i<rule.symbols.length;++i){
		const symbol = rule.symbols[i];
		if(typeof symbol === 'string' && parameterizeType(symbol, 'dummy') !== symbol){
			return true;
		}
	}
	return false;
}
