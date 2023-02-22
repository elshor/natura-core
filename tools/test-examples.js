import pLimit from 'p-limit';
import axios from 'axios';
import {readFileSync} from 'fs'
const API_CALL = 'http://localhost:8000/translate'
const MAX_CONCURRENT = 10
const filename = process.argv[2];
if(!filename){
	console.info('You must specify file name')
}
const stats = {
	1: 0,
	2:0,
	3:0,
	4:0,
	5:0,
	fail: 0
}
const json = JSON.parse(readFileSync(filename, 'utf-8'));
console.log('you got',json.examples.length,'examples');
const limit = pLimit(MAX_CONCURRENT);
const start = Date.now();
const res = json.examples.map(e=>limit(testExample, e.input,e.output, json.packages));
Promise.all(res).then(resolved=>{
	const avgTime = (Date.now() - start) / json.examples.length;
	console.log('completed all examples', Math.round(avgTime))
	resolved.forEach(([result])=>{
		stats[result]++;
	})
}).then(()=>{
	console.log('stats',stats);
})

async function testExample(input, output, packages){
	try{
		const res = await axios.post(
			API_CALL,
			{text: input, packages},
			{}
		)
		const index = res.data.map(item=>item.text).indexOf(output);
		const result = index < 0? 'fail' : (index + 1);
		if(result === 'fail'){
			console.log('[' + result + ']',input);
			res.data.forEach(item=>{
				console.log('  ', item.text);
			})
		}
		return [result, input];
	}catch(e){
		console.error('Exception from suggest API', e.respone)
	}
}
