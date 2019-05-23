module.exports = class Quiz{
	constructor(id="", question="", answer="", level=""){
		this.id = id;
		this.question = question;
		this.answer = answer;
		this.level = level;
	}

	//convert obj to strings
	stringify(){
		return JSON.stringify(this);
	}
};