'use strict';

module.exports = function(Customeruser) {
	var app = require('../../server/server');
	var moment = require('moment');


	//Customeruser.validatesPresenceOf('type_customer_id','zip_code_id','status_id', {message: 'Relations cannot be blank'});
	Customeruser.afterRemote('login', function(context, customer, next) {
		var AccountPlan = app.models.AccountPlan
		var ObjectID = require('mongodb').ObjectID;
		Customeruser.find({where: {id: customer.userId}}, function(err, customerdata) { 
			customer.metadata = customerdata[0]
			customer.token = customer.id
			AccountPlan.find({where:{"id":ObjectID(customerdata[0].plan_id)}}, function(err,plan_info){
				customer.plan_info = {"plan_id":plan_info[0].id,"plan":plan_info[0].name,"cantidad":"$"+String(plan_info[0].amount/100)+" MXN"}
	    		next()
			})
		});
	});




	//---------------conekta-----------------//
	var conekta = require('./conekta_control');
	var customer = require('./conekta_customer');
	var suscription = require('./conekta_suscription');
	var charge = require('./conekta_payment');
	var conektaCL 	= new conekta.CL_Conekta();
	var oCustomer 	= new customer.CL_Customer();
	var oSuscription = new suscription.CL_Suscription();
	var oCharge = new charge.CL_Payment();
	var oConekta;

	oConekta = conektaCL.init();
	oCustomer.constructor(oConekta);
	oSuscription.constructor(oConekta);
	oCharge.constructor(oConekta);

	var isConectaReady = false;

	setTimeout(function(){ 
		isConectaReady = true;
	}, 3500);



	//---------------paypal-----------------//
	var paypal = require('./paypal_control');
	var paypal_suscription = require('./paypal_suscription');
	var paypalCL 	= new paypal.CL_Paypal();
	var oPaypal = paypalCL.init();
	var oSuscription_paypal = new paypal_suscription.CL_Suscription();

	oSuscription_paypal.constructor(oPaypal);



	//--------------------------------//
	//-------(Functions block)--------//
	//--------------------------------//

	var emptyf = function(data){
		//Function empty
	}

	/*
		Authors: asotopaez@gmail.com
		Name: DeleteCustomer
		Description: Function that delete customer

	*/

	function DeleteCustomer(idCustomer,callBack){

		if(isConectaReady){
			if(idCustomer == undefined) callBack({error: "Falta parametro id"});
			else oCustomer.deleteCustomer(idCustomer,callBack);
		}
	}

	/*
		Authors: asotopaez@gmail.com
		Name: DeleteCustomerUserRollback
		Description: Function that delete customer

	*/

	function DeleteCustomerUserRollback(idCustomer){

		  Customeruser.destroyById(idCustomer,function (err,result){
		  	  if(err) callBack({error:err.message});
		      else callBack({mensaje : 'El cliente con el id: '+idCustomer+' se elimino exitosamente'});
		  })
	}


	/*
		Authors: asotopaez@gmail.com
		Name: insertExtraDataToCustomer
		Description: Function that update data about customer into database

	*/
	function insertExtraDataToCustomer(oCustomer,oCustomeridCk,callback){

		Customeruser.updateAll( {"email": oCustomer.email}, {id_conekta : oCustomeridCk}, function(err, results) {
			if(err){
				callback({error:err.message});
			}else{
				callback({mensaje : 'El cliente: '+oCustomer.email+' se creo exitosamente'});
			}
		});
	}

	/*
		Authors: asotopaez@gmail.com
		Name: createCustomerConekta
		Description: Function that create customer to conekta

	*/
	function createCustomerConekta(ctx,cbres){
		var oClienteData = {};
		oClienteData = ctx;
		oCustomer.createCustomer(oClienteData,respond);
		var oClienteDataback;
		function respond(oResp){
			if(oResp.object == "error"){
				DeleteCustomerUserRollback(oClienteData.id)
				cbres({error: oResp});	
			} 
			else if(oResp._json != undefined){
				oClienteDataback = oResp._json;
				if(oClienteDataback.id != undefined){
					insertExtraDataToCustomer(oClienteData,oClienteDataback.id, function(oResps){
						if(oResps.mensaje != undefined){
							var object = {
								mensaje : "Se genero cliente " + oClienteData.id,
								id : oClienteData.id,
								conekta_id : oClienteDataback.id
							};
							cbres(object);
						}
						else{
							DeleteCustomerUserRollback(oClienteData.id);
							DeleteCustomer(oClienteDataback.id,empty); //Realizar rollBack		
							cbres({error: "Error al guardar datos en la BD del cliente " + oClienteData.id});
						}
					});
				}
				else{
					DeleteCustomerUserRollback(oClienteData.id)
					cbres({error: "No se genero id del cliente"});		
				}
			}
			else{
				DeleteCustomerUserRollback(oClienteData.id);
				cbres({error: "createCustomer - Error desconocido"});
			}
		}

	}


	/*
		Authors: asotopaez@gmail.com
		Name: updateCustomerConekta
		Description: Function that update data customer to conekta

	*/
	function updateCustomerConekta(ctx,cbres){
	  var oClienteData = ctx.instance;

	  	oCustomer.updateCustomer(oClienteData,respond);

		function respond(oResp){
			if(oResp.object == "error") cbres({error: oResp});
			else if(oResp._json != undefined){
				cbres({"msj":"UpdateCustomer - Success"});
			}
			else cbres({error: "UpdateCustomer - Error desconocido"});
		}

	}

	/*
		Authors: asotopaez@gmail.com
		Name: chargeCustomerConekta
		Description: Function that generate charges to customer into conekta

	*/
	function chargeCustomerConekta(charges,cbres){
	  var oClienteDataCharges = charges;

	  	oCharge.GenerateCharge(oClienteDataCharges,respond);

		function respond(oResp){
			if(oResp.object == "error") cbres({error: oResp});
			else if(oResp._json != undefined){
				cbres(oResp);
			}
			else cbres({error: "GenerateCharge - Error desconocido"});
		}

	}


	/*
		Authors: asotopaez@gmail.com
		Name: updateSuscriptionCustomerConekta
		Description: Function that update customerdata suscription plan or card to conekta 

	*/
	function updateSuscriptionCustomerConekta(ctx,callback){
		var oDataCard = {};
		var Plan = ctx.plan_id; 
		var Card = ctx.card_id;
		var idConekta = ctx.id_conekta;
		oSuscription.updateSuscriptionCardCustomer(Plan,Card,idConekta,respond);

			function respond(oResp){

				if(oResp.object != undefined){
					callback({mensaje : oResp});
				}
				else callback({error: "Error desconocido"});
			}
	}


	/*
		Authors: asotopaez@gmail.com
		Name: cancelSuscriptionCustomerConekta
		Description: Function that cancel customerdata suscription plan to conekta 

	*/
	function cancelSuscriptionCustomerConekta(ctx,callback){
		var oDataCard = {};
		var idConekta = ctx.id_conekta;
		oSuscription.cancelSuscriptionCardCustomer(idConekta,respond);

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




	// Controllers
	// Functions create customer 
	Customeruser.afterRemote("create", function(ctx,myitem,next) {

	  var Student = app.models.Student;
	  var StatusCustomers = app.models.StatusCustomer;
	  var CreditCardCustomer = app.models.CreditCardCustomer;
	  
	  if(ctx.req.body["data_card_type"]=="paypal"){
			StatusCustomers.find({where: {name: "Activo"}}, function(err, status) {
				ctx.req.body["status_id"] = status[0]["id"]
	  			Student.create(ctx.req.body,function(err,results){
					Customeruser.updateAll({"id": myitem.id}, { status_id : status[0]["id"], "id_billing_agreement_paypal":ctx.req.body["id_billing_agreement_paypal"]}, function(err, results) {
					});
	  				next();
	  			});
	  		});
	  }else{
		  createCustomerConekta(myitem,function(response){
				var ctxcard = ctx.req.body["data_card"]
				ctxcard['parent_id'] = response.conekta_id
				ctxcard['customer_user_id'] = myitem.id
				ctxcard['plan_id'] = myitem.plan_id
			  	ctx.req.body["customer_user_id"] = myitem.id
				delete ctx.req.body["payment_sources"]
				delete ctx.req.body["plan_id"]
				delete ctx.req.body["data_card"]
			  	CreditCardCustomer.create(ctxcard,function(err,results){
			  		if (err){
			  			StatusCustomers.find({where: {name: "Test"}}, function(err, status) {
							ctx.req.body["status_id"] = status[0]["id"]
				  			Student.create(ctx.req.body,function(err,results){
								Customeruser.updateAll({"id": myitem.id}, { status_id : status[0]["id"]}, function(err, results) {
								});
				  				next();
				  			});
				  		});	
			  		}else{ 
			  			if(results.status_card=='active'){
							StatusCustomers.find({where: {name: "Activo"}}, function(err, status) {
								ctx.req.body["status_id"] = status[0]["id"]
					  			Student.create(ctx.req.body,function(err,results){	
									Customeruser.updateAll({"id": myitem.id}, { status_id : status[0]["id"]}, function(err, results) {
									});
					  				next();
					  			});
					  		});	
			  			}else{
						  	next(new Error('La tarjeta ingresada ha sido declinada. Por favor intenta con otro método de pago.'))	
			  			}
			  		}
				});
		  	});	
	  }
	});

	// Functions update customer 
	Customeruser.observe("after save", function(ctx,next) {
	  if(ctx.isNewInstance!=true&&ctx.isNewInstance!=undefined){
	  	updateCustomerConekta(ctx,function(response){
	  		//console.log(response)
	  	});
	  	next();
	  }else{
	  	next();
	  }
	});

	// Functions delete customer
	Customeruser.observe('before delete', function(ctx, next){
	    var iddbCustomer = ctx.where['id']['inq'][0]
		Customeruser.find({where: {id:iddbCustomer }}, function(err, customerdata) { 
			var idCustomerConekta = customerdata[0].id_conekta
			if(idCustomerConekta){
				DeleteCustomer(idCustomerConekta,function(response){
					//console.log(response)
				});
			}
	    	next();
		});
	});


	/*
		Authors: asotopaez@gmail.com
		Name: customer_save_students
		Description: Remote Method that customer save students. 
	*/

	  Customeruser.customer_save_students = function(data, cb) {
	    var student = data
	    var customer_user_id = data['customer_user_id']
	    var plan_id = data['plan_id']
	    var Student = app.models.Student;
	    var CustomerUser = app.models.CustomerUser;
	    var StatusCustomers = app.models.StatusCustomer;
	    var PlanCustomers = app.models.AccountPlan;
	    
	    if(student&&customer_user_id&&plan_id){
	      delete student['plan_id']
	      StatusCustomers.find({where: {name: "Activo"}}, function(err, status) {
	        var status_active_id = status[0]["id"]
	        student["status_id"] = status_active_id
	        Student.find({where: {customer_user_id: customer_user_id}}, function(err, customerdatastudent) {
	          
	          var count_students = {"act":0, "inact":0}
	          function howManyActives(reg) {
	            if (reg["status_id"] == String(status_active_id) && reg["activate"]==true){
	                 count_students['act'] += 1
	                return count_students;
	            }else{
	                count_students['inact'] += 1
	                return count_students; 
	            }
	          }
	          var filtroactivos = customerdatastudent.filter(howManyActives);

	          if(count_students['act'] < 5 && count_students['inact'] <= 2){

	              CustomerUser.find({where: {id: customer_user_id}}, function(err, customerdata){
	                var conektaid = customerdata[0]['id_conekta']
	                var customer_created = new Date(customerdata[0]['create_at'])
	                var datesnow  = new Date() 
	                var month = datesnow.getUTCMonth() + 1;
	                var monthwo = datesnow.getUTCMonth() + 2;
	                var day = customer_created.getUTCDate();
	                var year = datesnow.getUTCFullYear();
	                var date_created = year + "-" + month + "-" + day;
	                var startDate = moment(date_created, "YYYY-MM-DD");
	                var endDate = moment(startDate).add(30, 'd').toDate("YYYY-MM-DD");
	                var nextcut = ((endDate - datesnow) / (1000*60*60*24)).toFixed()
	                var ctxfake = {"id_conekta":conektaid,"plan_id":plan_id,"card_id":null}
	                if (plan_id!=customerdata[0]['plan_id']){

	                  updateSuscriptionCustomerConekta(ctxfake,function(results){
	                    //console.log("update_suscription",results)
	                    if(results.mensaje!=undefined && results.mensaje['status']=='active'){

	                      PlanCustomers.find({where: {id: plan_id}}, function(err, plandata){
	                            if (plandata[0].number_students > 1 ){
	                                var charges = (((plandata[0].amount)/30) * nextcut).toFixed(0)
	                                var chargecustomer = { "currency": "MXN",  "customer_info": { "customer_id": conektaid },  "line_items": [{ "name": "Ajuste de plan Familiar - Cobro proporcional",
	                                          "unit_price": charges,
	                              "quantity": 1
	                            }],
	                            "charges": [{
	                              "payment_method": {
	                                "type": "default"
	                              }
	                            }]
	                          }
	                          chargeCustomerConekta(chargecustomer,function(results){
	                              if(results._id!=undefined && results._json["payment_status"]=='paid'){
	                                Student.create(student,function(err,results){
	                                  if(err){
	                                    cb(err)
	                                  }else{
	                                    Customeruser.updateAll({"email": customerdata.email}, { plan_id : plan_id}, function(err, results) {
	                                      if(err){
	                                        cb(err)
	                                      }else{
	                                        cb(null,{"message":"Estudiante registrado con exito."})
	                                      }
	                                    });
	                                  }
	                                });
	                              }else{

	                                cb({"message":"El cargo a la tarjeta ingresada ha sido declinada. Por favor intenta con otro método de pago. Gracias","name": "ConektaError"})

	                              }

	                            })
	                          }
	                      });

	                    }else{
	                      cb({"message":"No se pudo cambiar al plan familiar. Por favor intenta mas tarde. Gracias","name": "ConektaError"})
	                    }
	                  });

	                }else{
	                  Student.create(student,function(err,results){
	                    if(err){
	                      cb({"error":err})
	                    }else{
	                      cb(null,{"message":"Estudiante registrado con exito."})
	                    }
	                  });
	                }
	              });

	          }else{
	            if(count_students['inact'] >= 2 && count_students['act'] < 5){
	              cb({"message":"Llego al limite de estudiantes inactivos, Eliminelo o Activelo de nuevo","name": "ValidationError"})
	            }else{
	              cb({"message":"Llego al limite tu plan familiar. Solo tiene capacidad de 5 miembros activos y 2 inactivos. ","name": "ValidationError"})
	            }
	          }   
	        });
	      });
	    }else{
	      cb({"message":"Envie los parametros solicitados."})
	    }
	  }


	Customeruser.remoteMethod('customer_save_students', {
		  description: 'Remote Method that customer save students and update your suscription.',
	      accepts: {arg: 'data', type: 'object' , default: '{}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});




	/*
		Authors: asotopaez@gmail.com
		Name: get_customer_data_conekta
		Description: Remote Method that get information about customer from conekta. 
	*/

	Customeruser.get_customer_data_conekta = function(data, cb) {
		var customer_user_id = data['customer_user_id']
		var results = {}
		if(customer_user_id){
			Customeruser.find({where: {id: customer_user_id}}, function(err, customerdata){
				if (customerdata){
					oCustomer.getCustomer(customerdata[0].id_conekta,respond)

					function respond(oResp){
						if(oResp._id != undefined){
							if(oResp.object == "error"){
								cb({error: oResp});
							}
							else cb(null,oResp._json);
						}
						else cb({error: "Error desconocido"});
						}				
				}else{
					cb({"msj":"No existe este consumidor."})
				}
			});
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('get_customer_data_conekta', {
		  description: 'Remote Method that customer get customer data',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});




	/*
		Authors: asotopaez@gmail.com
		Name: paypal_billing_agreements
		Description: Remote Method that create an agreemnt with the customer and your plans. 
	*/

	Customeruser.paypal_billing_agreements = function(data, cb) {
		var billing_data = data
		var plan_name = billing_data["plan_name"]
		var plan_id = billing_data["plan_id_paypal"]
		var customer_email = billing_data["email"]
		var isoDate = new Date();
			isoDate.setSeconds(isoDate.getSeconds() + 4);
			isoDate.toISOString().slice(0, 19) + 'Z';

		var billing_agreements_params =  {
		    "name": plan_name,
		    "description": plan_name,
		    "start_date": isoDate,
		    "plan": {
		        "id": plan_id
		    },
		    "payer": {
		        "payment_method": "paypal",
		        "payer_info": {
    				"email": customer_email
  				}
		    }
		};

		if(billing_data){
			oSuscription_paypal.createSuscription(billing_agreements_params,respond)

			function respond(oResp){

				if(oResp.hasOwnProperty('httpStatusCode') && oResp.httpStatusCode!=200){
					cb(oResp);
				}else{
					cb(null,oResp);
				}
			}
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('paypal_billing_agreements', {
		  description: 'Remote Method that create an agreemnt with the customer and your plans',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});



	/*
		Authors: asotopaez@gmail.com
		Name: paypal_billing_execute
		Description: Remote Method that execute suscriptions on Paypal. 
	*/

	Customeruser.paypal_billing_execute = function(data, cb) {
		var token_id = data["token"]
		if(token_id){
			oSuscription_paypal.executeSuscription(token_id,respond)

			function respond(oResp){
				console.log(oResp)
				if(oResp.hasOwnProperty('httpStatusCode') && oResp.httpStatusCode!=200){
					cb(oResp);
				}else{
					cb(null,{"id_billing_agreement_paypal":oResp.id});
				}
			}
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('paypal_billing_execute', {
		  description: 'Remote Method that execute suscriptions on Paypal.',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});


	/*
		Authors: asotopaez@gmail.com
		Name: get_charges_conekta
		Description: Remote Method that get information about customer charges on conekta. 
	*/

	Customeruser.get_charges_conekta = function(data, cb) {
		var customer_user_id = data['customer_user_id']
		var CustomerChargesConekta = app.models.CustomerChargesConekta
		var results = {}
		if(customer_user_id){
			Customeruser.find({where: {id: customer_user_id}}, function(err, customerdata){
				if (customerdata.length>0){
					var customer_coneckta = customerdata[0].id_conekta
					var results = []
					CustomerChargesConekta.find({where: {"type":"charge.paid","data.object.customer_id":customer_coneckta}, order:"id DESC"}, function(err, charges){
						if(err){
							cb(err)
						}else{
							if(charges.length>0){

								for (var i=0; i < charges.length; i++ ){
									var dateunix = moment.unix(charges[i].data.object['paid_at']).format("DD/MM/YYYY");
									var id_order = charges[i].data.object['id']
									var plan_type = charges[i].data.object['description']
									var amount = (charges[i].data.object['amount']) /100 
									if (plan_type=='Payment from order'){
										plan_type = "Ajuste de plan Familiar - Cobro proporcional"
									}
									results.push({"date_paid":dateunix,"order_id":id_order,"plan":plan_type,"amount":"$"+String(amount)+" MXN"})
								}
							}

							cb(null,results);
						}
					});			
				}else{
					cb({"message":"No existe este consumidor."})
				}
			});
		}else{
			cb({"message":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('get_charges_conekta', {
		  description: 'Remote Method that get information about customer charges on conekta.',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});



	/*
		Authors: asotopaez@gmail.com
		Name: change_suscription
		Description: Remote Method that change suscription. 
	*/

	Customeruser.change_suscription = function(data, cb) {
		var customer_user_id = data['customer_user_id']
	    var plan_id = data['plan_id']
	    var student_inactive =  data['student_id']
	    var PlanCustomers = app.models.AccountPlan;
	    var Student = app.models.Student;
	    var ObjectID = require('mongodb').ObjectID;
		var results = {}
		if(customer_user_id){
	            Customeruser.find({where: {id: customer_user_id}}, function(err, customerdata){
	                var conektaid = customerdata[0]['id_conekta']
	                var customer_created = new Date(customerdata[0]['create_at'])
	                var datesnow  = new Date() 
	                var month = datesnow.getUTCMonth() + 1;
	                var monthwo = datesnow.getUTCMonth() + 2;
	                var day = customer_created.getUTCDate();
	                var year = datesnow.getUTCFullYear();
	                var date_created = year + "-" + month + "-" + day;
	                var startDate = moment(date_created, "YYYY-MM-DD");
	                var endDate = moment(startDate).add(30, 'd').toDate("YYYY-MM-DD");
	                var nextcut = ((endDate - datesnow) / (1000*60*60*24)).toFixed()
	                var ctxfake = {"id_conekta":conektaid,"plan_id":plan_id,"card_id":null}


	                updateSuscriptionCustomerConekta(ctxfake,function(results){

	                    if(results.mensaje!=undefined && results.mensaje['status']=='active'){

	                      PlanCustomers.find({where: {id: plan_id}}, function(err, plandata){
	                           	if (plandata[0].number_students > 1){
	                                var charges = (((plandata[0].amount)/30) * nextcut).toFixed(0)
	                                var chargecustomer = { "currency": "MXN",  "customer_info": { "customer_id": conektaid },  "line_items": [{ "name": "Ajuste de plan Familiar - Cobro proporcional",
	                                        "unit_price": charges,
	                              			"quantity": 1
	                            			}],
	                            			"charges": [{
	                              			"payment_method": {
	                                		"type": "default"
	                              			}
	                            		}]
	                          		}
	                          		chargeCustomerConekta(chargecustomer,function(results){
		                              if(results._id!=undefined && results._json["payment_status"]=='paid'){
		                              		Customeruser.updateAll({"email": customerdata.email}, { plan_id : plan_id}, function(err, results) {
		                                      if(err){
		                                        cb(err)
		                                      }else{
		                                        cb(null,{"message":"El plan fue cambiado con exito."})
		                                      }
		                                    });
		                              }else{
	                                	cb({"message":"El cargo a la tarjeta ingresada ha sido declinada. Por favor intenta con otro método de pago. Gracias","name": "ConektaError"})
	                              	  }
	                            	})
	                          }else{
	                          		var studentssarre = []
                          			for (var iii = 0; iii < student_inactive.length; iii++) {
			 							studentssarre.push(ObjectID(student_inactive[iii]))
			 						}
	                          		Customeruser.updateAll({"email": customerdata.email}, { plan_id : plan_id}, function(err, results) {
		                                if(err){
		                                    cb(err)
		                                }else{
									        var studentwhere = {"_id": {'$in':studentssarre}}
									        Customeruser.getDataSource().connector.connect(function(err, db) {
									          var collection = db.collection('Student');
									              collection.update(studentwhere,{"$set":{ "activate" : false}}, function(err, data) {
									                if (err) {
									                    cb(err)
									                }else{
									                    cb(null,{"message":"El plan fue cambiado con exito. Recuerde activar a un estudiante en este plan."})
									                }
									              });
									        });
		                                }
		                            });
	                          }
	                      });

	                    }else{
	                    	if(results.mensaje['status']=='canceled'){
	                      		cb({"message":"No se pudo cambiar al plan. Por favor active su cuenta nuevamente. Gracias!!!","name": "ConektaError"})
	                    	}else{
	                    		cb({"message":"No se pudo cambiar al plan. Intentelo mas tarde. Gracias!!!","name": "ConektaError"})
	                    	}
	                    }
	                });


	              });
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('change_suscription', {
		  description: 'Remote Method that change plan.',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});



	/*
		Authors: asotopaez@gmail.com
		Name: change_payment_method
		Description: Remote Method that change payment method. 
	*/

	Customeruser.change_payment_method = function(data, cb) {
		var customer_user_id = data['customer_user_id']
		

		
		var results = {}
		if(customer_user_id){
			Customeruser.find({where: {id: customer_user_id}}, function(err, customerdata){
				if (customerdata){
					var ctxfake = {"id_conekta":conektaid,"plan_id":plan_id,"card_id":null}

					updateSuscriptionCustomerConekta(ctxfake,function(results){
	                	console.log(results)
	                });
				}else{

				}
			});

		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('change_payment_method', {
		  description: 'Remote Method that change payment method.',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});






	/*
		Authors: asotopaez@gmail.com
		Name: pause_suscription
		Description: Remote Method that pause suscription. 
	*/

	Customeruser.pause_suscription = function(data, cb) {
		var customer_user_id = data['customer_user_id']
		var StatusCustomers = app.models.StatusCustomer;
		var results = {}
		if(customer_user_id){
			Customeruser.find({where: {id: customer_user_id}}, function(err, customerdata){
				if (customerdata){

					oSuscription.pauseSuscriptionCardCustomer(customerdata[0].id_conekta,respond)

					function respond(oResp){
						//console.log(oResp)
						if(oResp.id != undefined){
							if(oResp.object == "error"){
								cb({error: oResp});
							}
							else{
								StatusCustomers.find({where: {name: "Pendiente de pago"}}, function(err, status) {								
									Customeruser.updateAll({"id": customer_user_id}, { status_id : status[0]["id"]}, function(err, results) {
										if(err){
											cb(err)
										}else{
											cb(null,{"msj":"El cliente pauso su plan con exito."})
										}
									});
								});	
							} 
						}
						else cb({error: "Error desconocido"});
						}				
				}else{
					cb({"msj":"No existe este consumidor."})
				}
			});
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('pause_suscription', {
		  description: 'Remote Method that pause suscription.',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});

	/*
		Authors: asotopaez@gmail.com
		Name: resume_suscription
		Description: Remote Method that resume suscription. 
	*/

	Customeruser.resume_suscription = function(data, cb) {
		var customer_user_id = data['customer_user_id']
		var StatusCustomers = app.models.StatusCustomer;
		var results = {}
		if(customer_user_id){
			Customeruser.find({where: {id: customer_user_id}}, function(err, customerdata){
				if (customerdata){

					oSuscription.resumeSuscriptionCardCustomer(customerdata[0].id_conekta,respond)

					function respond(oResp){
						if(oResp.id != undefined){
							if(oResp.object == "error"){
								cb({error: oResp});
							}
							else{
								StatusCustomers.find({where: {name: "Activo"}}, function(err, status) {
									Customeruser.updateAll({"id": customer_user_id}, { status_id : status[0]["id"]}, function(err, results) {
										if(err){
											cb(err)
										}else{
											cb(null,{"msj":"El cliente reactivo su plan con exito."})
										}
									});
								});
							} 
						}
						else cb({error: "Error desconocido"});
						}				
				}else{
					cb({"msj":"No existe este consumidor."})
				}
			});
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('resume_suscription', {
		  description: 'Remote Method that resume suscription.',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});


	/*
		Authors: asotopaez@gmail.com
		Name: cancel_suscription
		Description: Remote Method that resume suscription. 
	*/

	Customeruser.cancel_suscription = function(data, cb) {
		var customer_user_id = data['customer_user_id']
		var StatusCustomers = app.models.StatusCustomer;
		var results = {}
		if(customer_user_id){
			Customeruser.find({where: {id: customer_user_id}}, function(err, customerdata){
				if (customerdata){

					oSuscription.cancelSuscriptionCardCustomer(customerdata[0].id_conekta,respond)

					function respond(oResp){
						if(oResp.id != undefined){
							if(oResp.object == "error"){
								cb({error: oResp});
							}
							else{
								StatusCustomers.find({where: {name: "Cancelado"}}, function(err, status) {								
									Customeruser.updateAll({"id": customer_user_id}, { status_id : status[0]["id"]}, function(err, results) {
										if(err){
											cb(err)
										}else{
											cb(null,{"msj":"El cliente cancelo su plan con exito."})
										}
									});
								});
							}
						}
						else cb({error: "Error desconocido"});
						}				
				}else{
					cb({"msj":"No existe este consumidor."})
				}
			});
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Customeruser.remoteMethod('cancel_suscription', {
		  description: 'Remote Method that cancel suscription.',
	      accepts: {arg: 'data', type: 'object' , default: '{"customer_user_id":"string"}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});




};
