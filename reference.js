export default function reference(label,valueType,path){
	return {
		$type:'reference',
		label,
		valueType,
		path
	}
};