'use strict';
const nodemailer = require('nodemailer');
const template1 = require('../../server/www/utilidades/template.js')

function email(object,receivers){
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    nodemailer.createTestAccount((err, account) => {
    
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'alejandro.soto666@gmail.com', // generated ethereal user
                pass: 'A14873603a'  // generated ethereal password
            }
        });

        var mailOptions = {
                from: 'Hola', // sender address
                to: receivers, // list of receivers
                subject: object.subject, // Subject line
                // text: 'Hello world?', // plain text body
                html: template1(object) // html body
            }

        if(object.type=="recovery_pass"){
            // setup email data with unicode symbols
            mailOptions = {
                from: 'Recuperacion de contraseña.', // sender address
                to: receivers, // list of receivers
                subject: object.subject, // Subject line
                // text: 'Hello world?', // plain text body
                html: template1(object) // html body
            };
        }else{
            
        }
        console.log(mailOptions)
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
};

module.exports = email;