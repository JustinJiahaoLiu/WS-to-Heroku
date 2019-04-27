module.exports = class Message{
	constructor(id="", msgType="", senderName="", msgContent=""){
		this.id = id;
		this.type = msgType;
		this.name = senderName;
		this.data = msgContent;
	}

	//convert obj to strings
	stringify(){
		return JSON.stringify(this);
	}
};