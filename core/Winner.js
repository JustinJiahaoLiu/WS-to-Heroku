module.exports = class Winner{
	constructor(id="", name="", result=""){
		this.id = id;
		this.name = name;
		this.result = result;
	}

	//convert obj to strings
	stringify(){
		return JSON.stringify(this);
	}
};