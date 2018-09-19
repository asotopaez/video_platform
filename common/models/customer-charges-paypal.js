'use strict';
const nodemailer = require('nodemailer');
module.exports = function(Customerchargespaypal) {

	/*
		Authors: asotopaez@gmail.com
		Name: get_customer_data_conekta
		Description: 
	*/

	Customerchargespaypal.get_charges_data_paypal = function(data, cb) {
		//console.log(data)

		//Using nodemailer

	    // create reusable transporter object using the default SMTP transport
	    let transporter = nodemailer.createTransport({
    		host: 'smtp.zoho.eu',
    		port: 465,
    		secure: true, //ssl
    		auth: {
            	user:'asotopaez@gmail.com',
            	pass:'A14873603A',
            }
    	});
		 	
		if (data.resource_type == 'order' && data.event_type == 'PAYMENT.ORDER.CREATED' && data.resource.state == 'completed') {
		    //console.log(data)
		    // setup email data with unicode symbols
		    let mailOptions = {
		        from: '"Fred Foo 👻" <asotopaez@gmail.com>', // sender address
		        to: 'asotopaez@gmail.com', // list of receivers
		        subject: 'Pago comprobado ✔', // Subject line
		        text: 'Tu pago ha sido confirmado.', // plain text body
		        html: '<b>Muchas gracias</b>' // html body
		    };
		  /*
		  transporter.sendMail(mailOptions, function(error, info){
		  	  console.log(info)
		      if(error){ console.log(error); }
		    });
		  */
		  data['id_paypal'] = data['id']
		  delete data['id']
		  Customerchargespaypal.create(data,function(err,results){
		  	cb(null,{})
		  });
		}else{
		  data['id_paypal'] = data['id']
		  delete data['id']
		  Customerchargespaypal.create(data,function(err,results){
		  	cb(null,{})
		  });
		}
		
	}


	Customerchargespaypal.remoteMethod('get_charges_data_paypal', {
		  description: '',
	      accepts: {arg: 'data', type: 'object' , default: '{}' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});




};
