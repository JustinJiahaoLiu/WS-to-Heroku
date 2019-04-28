module.exports = class Message{
	constructor(id="", msgType="", senderName="", msgContent="", gameSaving =32){
		this.id = id;
		this.type = msgType;
		this.name = senderName;
		this.data = msgContent;
		this.save = gameSaving;
	}

	//convert obj to strings
	stringify(){
		return JSON.stringify(this);
	}
};