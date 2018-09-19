function CL_Card(){
	var conekta;
	this.constructor = constructor;
	this.createCard = createCard;
	this.deleteCard = deleteCard;

	function constructor(oConekta){
		conekta = oConekta;
	}

	function createCard(tokenCard,typeCard,idCustomer,callBack){

		conekta.Customer.find(idCustomer, customerFinded);

		function customerFinded(err,customer){
			if(err) end(err);
			else customer.createPaymentSource({token_id : tokenCard, type:typeCard },respond);
		}

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			callBack(oRespond);
		}
	}

	function deleteCard(idCustomer,token,callBack){
		conekta.Customer.find(idCustomer, cardFinded);

		function cardFinded(err, customer){
			//console.log("1",err,customer)
			if(err){
				if(err.object != undefined) end({error: err.object.message});
				else end(err);
			}
			else{
				var iPos = searchItem("_id",token,customer.payment_sources);
				if(iPos >= 0) customer.payment_sources.get(iPos).delete(respond);
				else end({error: "Tarjeta no encontrada"});
			}
		}

		function respond(err, res){
			//console.log("2",err,res)
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			if(oRespond._json != undefined){
				if(oRespond._json.deleted){
					callBack({
						mensaje : "Tarjeta " + token + " eliminada",
						id: token
					});
				}
				else{
					callBack({
						error : "La tarjeta " + token + " no fue eliminada"
					});
				}
			}
			else callBack(oRespond);
		}
	}

	function searchItem(key,value,array){
		var iPos = -1;
		if(array.length > 0){
			for(var x = 0; x < array.length; x++){
				if(array[x][key] == value){
					iPos = x;
					break;
				}
			}
		}
		return iPos;
	}
}

module.exports.CL_Card  = CL_Card;