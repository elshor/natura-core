import axios from 'axios'

const url = 'https://ide.natura.dev/api/doc/'

const packages = {}
let loader = null;
export function registerLoader(fn){
	loader = fn;
}

/**
 * Load packages. Use cache if the package was loaded in previous call
 */
export async function loadPackage(id){
	if(loader){
		return loader(id);
	}
	id = 'public:' + id;//qualify package.
	//TODO handle private packages
	if(packages[id]){
		return packages[id];
	}
	try{
		const res = await axios.get(url + encodeURIComponent(id));
		return res.data;
	}catch(e){
		throw new Error('Could not load package ' + id);
	}
}