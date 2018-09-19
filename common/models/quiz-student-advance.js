'use strict';

module.exports = function(Quizstudentadvance) {
	Quizstudentadvance.validatesPresenceOf('quiz_id','student_id','subject_id','chapter_id','topic_id', {message: 'Relations cannot be blank'});
	var ObjectID = require('mongodb').ObjectID;


	//------------------------------------//
	//--SaveQuizAdvance(Functions block)--//
	//------------------------------------//

    /*
		Authors: asotopaez@gmail.com
		Name: quizupdatedirect
		Description: Function that update quiz advance 

    */


    var quizupdatedirect = function(quiz_id,student_id,quizAdvanceupdate,callback){
    	var quizwhere = {"quiz_id": ObjectID(quiz_id), "student_id":ObjectID(student_id)}
        Quizstudentadvance.getDataSource().connector.connect(function(err, db) {
          var collection = db.collection('QuizStudentAdvance');
              collection.update(quizwhere,quizAdvanceupdate, function(err, data) {
                if (err) {
                    callback({error:err});
                }else{
                    callback(data);
                }
              });
        });
    }


    /*
		Authors: asotopaez@gmail.com
		Name: SaveQuizAdvance
		Description: Remote Method that save advance for student.

    */

    Quizstudentadvance.SaveQuizAdvance = function(data,cbres){
    	var quiz_id = data['quiz_id']
    	var student_id = data['student_id']
		var quizAdvanceupdate = {}
		var setdata = {}
		delete data['quiz_id']
		delete data['student_id']
		setdata["extra_points"] = data['extra_points']
		setdata["quiz_advance_percentaje"] = data['quiz_advance_percentaje']
		setdata["quiz_finish"] = data['quiz_finish']
		setdata["milisecons_quiz"] = data['milisecons_quiz']
		setdata["quiz_score"] = data['quiz_score']
		setdata["rupees_win"] = data['rupees_win']
		setdata["starts_win"] = data['starts_win']
		setdata["maps_win"] = data['maps_win']
		setdata["maps_win"] = data['maps_win']
		setdata["coordinates"] = data['coordinates']
		Quizstudentadvance.find({where: {"quiz_id": ObjectID(quiz_id), "student_id":ObjectID(student_id)}},function(err,quizad){
		  	if(quizad.length){
		  		if (setdata["quiz_score"] > quizad[0].quiz_score){
		  			if (setdata["quiz_score"] >= 6){
						quizAdvanceupdate = { "$inc" : { "attempts_succes" : 1 }, "$set":setdata }
						quizupdatedirect(quiz_id,student_id,quizAdvanceupdate,function(quizadup){
							cbres(null,quizadup)
						});
		  			}else{
		  				delete setdata["extra_points"]
		  				delete setdata["quiz_finish"]
		  				delete setdata["coordinates"]
		  				quizAdvanceupdate = { "$inc" : { "attempts_fail" : 1 }, "$set":setdata }
						quizupdatedirect(quiz_id,student_id,quizAdvanceupdate,function(quizadup){
		  					cbres(null,{"msg":"No hay nada ganado"})
						});
		  			}
		  		}else{
		  			var setdatawins = {}
		  			var updatepass = []
		  			if(setdata["extra_points"] > quizad[0].extra_points){
			  			setdatawins["extra_points"] =  setdata["extra_points"] 
		  				updatepass.push(true)
		  			}
		  			if(setdata["rupees_win"] > quizad[0].rupees_win){
		  				setdatawins["rupees_win"] = setdata["rupees_win"]
		  				updatepass.push(true)
		  			}
		  			if(setdata["starts_win"] > quizad[0].starts_win){
		  				setdatawins["starts_win"] = setdata["starts_win"]
		  				updatepass.push(true)
		  			}
		  			if(setdata["maps_win"] > quizad[0].maps_win){
		  				setdatawins["maps_win"] = setdata["maps_win"]
		  				updatepass.push(true)
		  			}
		  			if(updatepass.length>0){	  				
			  			quizAdvanceupdate = { "$inc" : { "attempts_succes" : 1 },"$set":setdatawins }
						quizupdatedirect(quiz_id,student_id,quizAdvanceupdate,function(quizadup){
							cbres(null,quizadup)
						});
		  			}else{
		  				quizAdvanceupdate = { "$inc" : { "attempts_fail" : 1 } }
						quizupdatedirect(quiz_id,student_id,quizAdvanceupdate,function(quizadup){
		  					cbres(null,{"msg":"No hay nada ganado"})
						});
		  			}
		  		}
		  	}else{
		  		cbres(null,{"msg":"No hay avances en los video de este topic."})
		  	}
		});


    }


	Quizstudentadvance.remoteMethod('SaveQuizAdvance', {
		  description: 'Create and Update Advance',
	      accepts: {arg: 'data', type: 'object' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});
};
