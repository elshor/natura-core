//default language is English
import pluralize from 'pluralize'
export default function(){
	return en;
}
const en = {
	singular(type){
		return pluralize.singular(type);
	},
	plural(type){
		return pluralize(type);
	}
}
