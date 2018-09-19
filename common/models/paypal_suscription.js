function CL_Suscription(){
	var url = require('url');
	var paypal;
	this.constructor = constructor;
	this.createSuscription = createSuscription;
	this.executeSuscription = executeSuscription;
	this.updateSuscription = updateSuscription;
	this.getSuscription = getSuscription;
	this.balanceSuscription = balanceSuscription;
	this.reactivateSuscription = reactivateSuscription;
	this.setbalanceSuscription = setbalanceSuscription;
	this.suspendSuscription = suspendSuscription;
	this.listTransactions = listTransactions;
	this.cancelSuscription = cancelSuscription;

	function constructor(oPaypal){
		paypal = oPaypal;
	}



	function createSuscription(billingAgreementAttributes,callBack){
		//console.log("params",billingAgreementAttributes)
		paypal.billingAgreement.create(billingAgreementAttributes, respond);

		function respond(err, billingAgreement){
			//console.log("1",err,billingAgreement)
            if (err) {
                end(err);
            } else {
                //console.log("Create Billing Agreement Response");
                //console.log(billingAgreement);
                var approval_url;
                var execute_url;
                var token_aproval;
                var forend = 0;
                for (var index = 0; index < billingAgreement.links.length; index++) {
                    if (billingAgreement.links[index].rel === 'approval_url') {
                        approval_url = billingAgreement.links[index].href;
                        token_aproval = url.parse(approval_url, true).query.token

                    }else{
                    	var execute_url = billingAgreement.links[index].href;
                    }
                    forend = index+1
 					if(forend==billingAgreement.links.length){
                    	end({"execute_url":execute_url,"approval_url":approval_url,"token_aproval":token_aproval})
 					}
                }
            }
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}

	function executeSuscription(paymentToken,callBack){
		
		paypal.billingAgreement.execute(paymentToken, respond);

		function respond(err, res){
			console.log(err, res)
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}




	function updateSuscription(billingAgreementId,billing_agreement_update_attributes,callBack){

		paypal.billingAgreement.get(billingAgreementId, billingAgreementFind);

		function billingAgreementFind(err, billingAgreement){
			if(err) end(err);
			else paypal.billingAgreement.update(billingAgreementId, billing_agreement_update_attributes,respond);
		}

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


	function getSuscription(billingAgreementId,callBack){

		paypal.billingAgreement.get(billingAgreementId, respond);

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


	function balanceSuscription(billingAgreementId, amount, note ,callBack){

        var outstanding_amount_note = {
            "note": note,
            "amount": {
		    	"value" : amount,
		    	"currency" : "MXN"
			}
        }; 

		paypal.billingAgreement.billBalance(billingAgreementId,outstanding_amount, respond);

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}

	function setbalanceSuscription(billingAgreementId,amount,callBack){

		var outstanding_amount = {
		    "value" : amount,
		    "currency" : "MXN"
		};
		paypal.billingAgreement.setBalance(billingAgreementId,outstanding_amount, respond);

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}

	function reactivateSuscription(billingAgreementId,callBack){

		paypal.billingAgreement.reactivate(billingAgreementId, respond);

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}

	function suspendSuscription(billingAgreementId,callBack){

		paypal.billingAgreement.suspend(billingAgreementId, respond);

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}

	function listTransactions(billingAgreementId, start_date, end_date,callBack){

		paypal.billingAgreement.searchTransactions(billingAgreementId, start_date, end_date, respond);

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}

	function cancelSuscription(billingAgreementId,note,callBack){
		var cancel_note = {
		    "note": note
		};
		paypal.billingAgreement.cancel(billingAgreementId,cancel_note, respond);

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}


}

module.exports.CL_Suscription  = CL_Suscription;