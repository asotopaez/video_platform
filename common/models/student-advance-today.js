'use strict';

module.exports = function(Studentadvancetoday) {

var app = require('../../server/server');

//--------------------------------------------//
//--CreateUpdateQuizAdvance(Functions block)--//
//-------------------------------------------//

/*
	Authors: asotopaez@gmail.com
	Name: CreateUpdateQuizAdvance
	Description: Function that update student advance and create
*/


function CreateUpdateQuizAdvance(ctx,cbres){
	var QuizStudentAdvance = app.models.QuizStudentAdvance;	
	var ouizAdvance = {}
	var quizAdvanceupdate = {}
	ouizAdvance = ctx.instance
	var quiz_id = ctx.instance['quiz_id']
	var student_id = ctx.instance['student_id']
	var extra_pointsadd = ctx.instance['extra_points_video']

	quizAdvanceupdate = { "$inc" : { "extra_points_video" : extra_pointsadd }}


    var quizupdatedirect = function(quiz_id,student_id,quizAdvanceupdate,callback){
        Studentadvancetoday.getDataSource().connector.connect(function(err, db) {
          var collection = db.collection('QuizStudentAdvance');
              collection.update({"quiz_id": quiz_id,"student_id":student_id},quizAdvanceupdate, function(err, data) {
                if (err) {
                    callback({error:err});
                }else{
                    callback(data);
                }
              });
        });
    }

	QuizStudentAdvance.find({where: {"quiz_id": quiz_id,"student_id":student_id}},function(err,quizad){
	  	if(quizad.length){
			quizupdatedirect(quiz_id,student_id,quizAdvanceupdate,function(quizadup){
				cbres(quizadup)
			});
	  	}else{
	  		ouizAdvance['extra_points_video'] = extra_pointsadd
	  		QuizStudentAdvance.create(ouizAdvance,function(err,response){
	  			if(err){
					cbres({error:err.message});
				}else{
					cbres(response);
				}
	  		})
	  	}
	});

}


Studentadvancetoday.observe('after save', function(ctx, next){
   if(ctx.isNewInstance){
	  CreateUpdateQuizAdvance(ctx,function(response){
	  });
   }
  next();
});




};
