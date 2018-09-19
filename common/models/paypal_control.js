var paypal = require('paypal-rest-sdk');

function CL_Paypal(dafaultName){
	var api_Key = "sandbox";
	var isProduccion = false; //sandbox or live
	
	this.init = init;

	function init(){
		var client_id = ""; // please provide your client id here
		var client_secret = ""; // provide your client secret here
		
		if(isProduccion) api_Key = "live";
		else api_Key;
		console.log("paypal",api_Key)
		// configure paypal with the credentials you got when you created your paypal app
		paypal.configure({
		  'mode': api_Key,  
		  'client_id': client_id,  
		  'client_secret': client_secret  
		});
		return paypal;
	}
}

module.exports.CL_Paypal   = CL_Paypal;
