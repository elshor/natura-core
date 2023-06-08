import {Rule} from './parsely.js'

export default function expandRule(rule, term){
	console.log('generating', rule.name + '<' + term + '>')
	const {symbols, mapping} = expandSymbols(rule.symbols, term)
	const postprocess = rule.postprocess
		? generatePostprocessSpecialized(rule.postprocess,s, mapping)
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
			const matched = item.match(/^\s*T\s*\|(.+)$/);
			if(matched){
				//this is an expansion item. Replace with literal and tokenize
				const spec = dictionary.getTypeSpec(s)
				const text = spec[matched[1]];
				const tokens = tokenize.call(lexer, text);
				mapping.push(symbols.length);
				symbols.push(...tokens.map(token=>({literal:token})));
			}else{
				mapping.push(symbols.length);
				symbols.push(parameterizeType(item, s));
			}
		}
	})
	return {symbols, mapping};
}

function parameterizeType(type, parameter){
	return type
	.replace(/(.*)<(?:t|T)>([\*\?]*)/,'$1<' + parameter + '>$2')
}

