import { getDictionary } from "./dictionary.js";

export default async function parse(text, packages){
	const dictionary = await getDictionary(packages);
	return dictionary.parse(text);
}