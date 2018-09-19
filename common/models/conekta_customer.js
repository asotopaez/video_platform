function CL_Customer(){
	var conekta;

	this.constructor = constructor;
	this.getCustomer = getCustomer;
	this.createCustomer = createCustomer;
	this.deleteCustomer = deleteCustomer;
	this.updateCustomer = updateCustomer;

	function constructor(oConekta){
		conekta = oConekta;
	}


	function getCustomer(idCustomer,callBack){
		conekta.Customer.find(idCustomer,respond)


		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			if(oRespond._id == idCustomer){
				callBack(oRespond)
			}
			else if(oRespond.object == "error"){
				callBack({error : oRespond.message})
			}
			else callBack({error: "No se puede mostrar al cliente."});
		}
	}





	function createCustomer(oCustomer,callBack){
		var oCustomerClean = {}
		oCustomerClean['email'] = oCustomer['email']
		oCustomerClean['phone'] = oCustomer['phone']
		oCustomerClean['name'] = oCustomer['name']
		//oCustomerClean['plan_id'] = oCustomer['plan_id']
		oCustomerClean['corporate'] = oCustomer['corporate']
		conekta.Customer.create(oCustomerClean,respond);
		function respond(err, res){
			if(err) callBack(err);
			else callBack(res);
		}
	}

	function deleteCustomer(idCustomer,callBack){
		conekta.Customer.find(idCustomer,customerFinded)

		function customerFinded(err,customer){
			if(err) end(err);
			else customer.delete(respond);
		}

		function respond(err, res){
			if(err) end(err);
			else end(res);
		}

		function end(oRespond){
			if(oRespond._id == idCustomer){
				callBack({mensaje : "Cliente " + idCustomer + " eliminado"})
			}
			else if(oRespond.object == "error"){
				callBack({error : oRespond.message})
			}
			else callBack({error: "No se pudo eliminar cliente"});
		}
	}

	function updateCustomer(oCustomer,callBack){
		conekta.Customer.find(oCustomer.id_conekta,customerFinded);
		
		function customerFinded(err,customer){
			if(err) callBack(err);
			else{
				delete oCustomer["id_conekta"];
				customer.update(oCustomer,respond);
			}
		}

		function respond(err, res){
			if(err) callBack(err);
			else callBack(res);
		}
	}
}

module.exports.CL_Customer  = CL_Customer;

