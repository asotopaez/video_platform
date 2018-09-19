'use strict';


var isConectaReady = false;

module.exports = function(Creditcardcustomer) {
 Creditcardcustomer.validatesPresenceOf('customer_user_id', {message: 'Relations cannot be blank'});
 var app = require('../../server/server');
//--------------------------------//
//-----INIT CONECKTA-------//
//--------------------------------//

/*
	Authors: asotopaez@gmail.com
	Name: ChaptersListAdvance
	Description: Remote Method that list chapters and show advances
*/
var conekta = require('./conekta_control');
var customer = require('./conekta_customer');
var card = require('./conekta_card');
var payment = require('./conekta_payment');
var suscription = require('./conekta_suscription');

//--------------------------------//
//------INIT OBJECTS CONEKTA------//
//--------------------------------//

var conektaCL = new conekta.CL_Conekta();
var oCustomer = new customer.CL_Customer();
var oCard = new card.CL_Card();
var oPayment = new payment.CL_Payment();
var oSuscription = new suscription.CL_Suscription();
var oConekta;

oConekta = conektaCL.init();
oCustomer.constructor(oConekta);
oCard.constructor(oConekta);
oPayment.constructor(oConekta);
oSuscription.constructor(oConekta);

setTimeout(function(){ 
	isConectaReady = true;
}, 3500);

//-------------------------------------------------//
//------------Funtions Override Methods-----------//
//-----------------------------------------------//



function DeleteCardConekta(ConektaId,TokenId,callback){

	var tokenCard = TokenId;
	var idConekta = ConektaId;


	oCard.deleteCard(idConekta,tokenCard,respond);
	
	function respond(oResp){

		if(oResp.object != undefined){
			if(oResp.object == "error"){
				callback({error: oResp.details});
			}
			else callback({mensaje : oResp.message});
		}
		else callback({error: "Error desconocido"});
	}
}



function getCustomer(oCustomerid,callBack){
	var Customeruser = app.models.CustomerUser;
	Customeruser.find({where: {id: oCustomerid}}, function(err, customerdata) { 
		callBack(customerdata)
	})
}


function insertExtraDataToCustomer(oCustomer,oCustomeridCk,callback){
	var Customeruser = app.models.CustomerUser;
	Customeruser.updateAll( {"email": oCustomer.email}, { "$addToSet": { "payment_sources": oCustomeridCk } }, function(err, results) {
		if(err){
			callback({error:err.message});
		}else{
			callback({mensaje : 'El cliente: '+oCustomer.email+' se actualizo exitosamente',registrado : true});
		}
	});
}

//--------------------------------------------//
//------------REMOTE METHODS CONEKTA----------//
//--------------------------------------------//



function createCardConekta(ctx,callback){
	var oDataCard = {};
	var idCustomer = ctx.instance.customer_user_id; 
	var idConekta = ctx.instance.parent_id;
	var tokenCard = ctx.instance.token_id;
	var typeCard = ctx.instance.type;
	var isDefault = ctx.instance.default;

	oCard.createCard(tokenCard,typeCard,idConekta,respond);

	function respond(oResp){

		if(oResp.object != undefined){
			if(oResp.object == "error"){
				callback({error: oResp});
			}
			else callback({mensaje : oResp});
		}
		else if(oResp._id != undefined){
			oDataCard = oResp._json;
			var oDataCardCustomerRel = {"token_id":tokenCard,"type":typeCard} 
			if(isDefault) setDefaultCard(idCustomer,oDataCardCustomerRel,send);
			else send();
		}
		else callback({error: "Error desconocido"});
	}

	function send(){
		callback(oDataCard);
	}
}


function createSuscriptionConekta(ctx,callback){
	var oDataCard = {};
	var Plan = ctx.instance.plan_id; 
	var idConekta = ctx.instance.parent_id;
	oSuscription.createSuscriptionCardCustomer(Plan,idConekta,respond);

		function respond(oResp){

			if(oResp.object != undefined){
				if(oResp.object == "error"){
					callback({error: oResp});
				}
				else callback({mensaje : oResp});
			}
			else callback({error: "Error desconocido"});
		}
}




//------------------------------------//
//------------MIDD CONECKTA-----------//
//------------------------------------//

function setDefaultCard(idCustomer,tokenCard,callBack){
	var isSucces = false;
	var oUpdate = {};
	var oAux;

	getCustomer(idCustomer,customerFinded);

	function customerFinded(oData){
		
		if(oData.error == undefined){
			oData.default_payment_source_id = tokenCard.token_id;
			oAux['email'] = oData.email;
			oUpdate.id_conekta = oData.id_conekta;
			oUpdate.default_payment_source_id = oData.default_payment_source_id;
			oCustomer.updateCustomer(oUpdate,end);
		}
		else callBack(isSucces);
	}

	function end(oResp){
		isSucces = true;
		callBack(isSucces);
		insertExtraDataToCustomer(oAux,tokenCard,emptyf);
	}
}

function changeDefaultCard(idCustomer,idCard,callBack){
	var isSucces = false;
	getCustomer(idCustomer,customerFinded);

	function customerFinded(oData){
		if(oData.error == undefined){
			oData.id_cliente = idCustomer;

			if(oData.default_card_id == idCard){
				oData.default_card_id = "";
				end(oData);
			}
			else callBack(true);
		}	
		else callBack(isSucces);
	}

	function end(oData){
		isSucces = true;
		insertExtraDataToCustomer(oData,emptyf);
		callBack(isSucces);
	}
}

var emptyf = function(data){
	//Function empty
}


//Controleres
Creditcardcustomer.observe("after save", function(myitem,next) {
	if(myitem.isNewInstance!=true&&myitem.isNewInstance!=undefined){
		//console.log("update CreditCard")
	}else{	
		createCardConekta(myitem,function(response){
			createSuscriptionConekta(myitem,function(response){
				//console.log("suscription", response)
				if (response.error!=undefined){
					next();
				}else{
					myitem.instance['suscription_conekta_id'] = response.mensaje['id']
					myitem.instance['card_conekta_id'] = response.mensaje['card_id']
					myitem.instance['status_card'] = response.mensaje['status']
					next();
				}
			});
		});

	}
  
});



// Functions delete customer (missing)
Creditcardcustomer.observe('before delete', function(ctx, next){
    var iddbCard = ctx.where['id']
	Creditcardcustomer.find({where: {id:iddbCard }}, function(err, creditdata) { 
		var idCustomerConekta = creditdata[0].parent_id
		var tokenCard = creditdata[0].token_id
		if(idCustomerConekta){
			DeleteCardConekta(idCustomerConekta,tokenCard,function(response){
				//console.log(response)
			});
		}
    	next();
	});
});



}//END CONTROLLER
