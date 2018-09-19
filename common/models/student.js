'use strict';

module.exports = function(Student) {
	var app = require('../../server/server');
	var async = require("async");
	var multer = require("multer");
	var moment = require('moment');
	var fs = require("fs");
	const Nodemailer =  require('./email_controller');

	//Student.validatesPresenceOf('level_id','grade_id','school_id', {message: 'Relations cannot be blank'});
	//--------------------------------------------//
	//-------------login complemented------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: StudentReportT
		Description: Function that find the data for report times consume in tests and videos
	*/
	Student.afterRemote('login', function(context, user, next) {
		Student.find({where: {id: user.userId}}, function(err, userdata) { 
			var Grade = app.models.Grade;
			var Subject = app.models.Subject;
			var School = app.models.School;
			var SubjectExamStudentAdvance = app.models.SubjectExamStudentAdvance;
			user.metadata = userdata[0]
			user.token = user.id
  			var startDate = moment(userdata[0]["create_at"], "YYYY-MM-DD");
  			var endDate = moment(startDate).add(15, 'd').toDate("YYYY-MM-DD");
  			var nowday = moment()
  			var countdown = ((endDate - nowday) / (1000*60*60*24));
  			userdata[0]['test_end_date'] = endDate 
  			userdata[0]['countdown'] = countdown.toFixed()
			Grade.find({where: {id: user.metadata.grade_id}},function(err, gradedata) {
				user.metadata.grade = gradedata;
			 	Subject.find({where: {grade_id: user.metadata.grade_id}},function(err, subjectsdata){
			 		user.metadata.subjects = subjectsdata;
			 		var arresubjects = []
			 		for (var i = 0; i < subjectsdata.length; i++) {
			 			arresubjects.push({"subject_id":subjectsdata[i].id})
			 		}

			 		SubjectExamStudentAdvance.find({where: {"student_id":user.userId,"or":arresubjects}}, function(err, subjectsadvancedata){
			 			for (var ii = 0; ii < subjectsdata.length; ii++) {
			 				if (subjectsadvancedata[ii] != undefined){
				 				var idadvance = String(subjectsadvancedata[ii].subject_id)
				 				var idsubject = String(subjectsdata[ii].id)
				 				if (idadvance==idsubject){
				 					user.metadata.subjects[ii].subjects_student_advance = subjectsadvancedata[ii]
				 				}
			 				}
			 			}
	    				//next()
						School.find({where: {level_id: user.school_id}},function(err, schools){
							user.metadata.school = schools[0];
							next()
						});
			 		});
			 	});
			})
		});
	});



	/*
		Authors: asotopaez@gmail.com
		Description: Remote hooks who save student in test mode.
	*/

	
	Student.observe('before save', function(ctx, next){
	   if(ctx.isNewInstance && ctx.instance["status_id"] == undefined){
		var StatusCustomers = app.models.StatusCustomer;
		StatusCustomers.find({where: {name: "Test"}}, function(err, status) {
			ctx.instance["status_id"] = status[0]["id"]
			next();
		});
	   }else{
	   		next();
	   }
	});


	//--------------------------------------------//
	//-------------student_grade_school------------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: student_grade_school
		Description: Remote Method that find grade and school it's update. 
	*/

	Student.student_grade_school = function(data, cb) {
		var student_email = data.email
		var results = {}
		if(student_email){
			Student.find({where: {email: student_email}}, function(err, userdata) {
				if (userdata.length > 0){
					if (userdata[0].grade_id != undefined && userdata[0].school_id != undefined){
						cb(null,{school:true,grade:true})
					}else if (userdata[0].grade_id == undefined && userdata[0].school_id != undefined){
						cb(null,{school:true,grade:false})
					}else if (userdata[0].grade_id != undefined && userdata[0].school_id == undefined){
						cb(null,{school:false,grade:true})
					}else{
						cb(null,{school:false,grade:false})
					}
				}else{
					cb({"error":"Usuario no encontrado."})
				}		
		    });	
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Student.remoteMethod('student_grade_school', {
		  description: ' that find grade and school its update.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "email":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});



	/*
		Authors: asotopaez@gmail.com
		Name: student_recover_pass
		Description: Remote Method permit to student recover you password.
	*/

	Student.student_recovery_password = function(data, cb) {
		var student_email = data.email
		var AccessToken = app.models.AccessToken;
		var results = {}
		if(student_email){
			Student.findOne({where: {email: student_email}}, function(err, userdata) {
				if (userdata["email"]!=undefined){
					userdata.createAccessToken(3600,function(err,newtoken){	
			            Nodemailer({
			              type:"recovery_pass",
			              subject:"Recuperacion de contraseña de estudiante.",
			              link_callback:"http://video_platform.mx/#/recovery_pass/"+newtoken["id"]
			            },[student_email]);
					})
					cb(null,{"msj":"Se ha enviado correo de recuperacion."})

				}else{
					cb({"error":"Usuario no encontrado."})
				}		
		    });	
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Student.remoteMethod('student_recovery_password', {
		  description: 'Student recovery password ',
	      accepts: {arg: 'data', type: 'object' , default: '{ "email":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});


	/*
		Authors: asotopaez@gmail.com
		Name: student_change_pass
		Description: Remote Method permit to student change you password.
	*/

	Student.student_change_password = function(data, cb) {
		var token = data.token
		var newpassword = data.password
		var AccessToken = app.models.AccessToken;
		var results = {}
		if(token&&newpassword){
			AccessToken.findOne({where: {"id": token}}, function(err, tokendata) {
				console.log("porras",tokendata)
				if (tokendata!=null){
					Student.findOne({where: {_id: tokendata["userId"]}},function(err,userdata){				
						userdata.updateAttribute('password', Student.hashPassword(newpassword), function(err, user) {
						 	if(err){
						 		cb({"error":err})
						 	}else{
						 		cb(null,{"msj":"El cambio de tu password ha sido exitoso."})
						 	}
						});
					});
				}else{
					cb({"error":"Token ivalido, tiempo maximo de espera."})
				}		
		    });	
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Student.remoteMethod('student_change_password', {
		  description: 'Student change password ',
	      accepts: {arg: 'data', type: 'object' , default: '{ "email":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});


	//--------------------------------------------//
	//-------------student_grade_school------------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: student_grade_school
		Description: Remote Method that find grade and school it's update. 
	*/

	Student.student_grade_school = function(data, cb) {
		var student_email = data.email
		var results = {}
		if(student_email){
			Student.find({where: {email: student_email}}, function(err, userdata) {
				if (userdata.length > 0){
					if (userdata[0].grade_id != undefined && userdata[0].school_id != undefined){
						cb(null,{school:true,grade:true})
					}else if (userdata[0].grade_id == undefined && userdata[0].school_id != undefined){
						cb(null,{school:true,grade:false})
					}else if (userdata[0].grade_id != undefined && userdata[0].school_id == undefined){
						cb(null,{school:false,grade:true})
					}else{
						cb(null,{school:false,grade:false})
					}
				}else{
					cb({"error":"Usuario no encontrado."})
				}		
		    });	
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Student.remoteMethod('student_grade_school', {
		  description: ' that find grade and school its update.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "email":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});






	//--------------------------------------------//
	//-------------student_update_grade_school------------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: student_update_grade_school
		Description: Remote Method update grade and school.
	*/

	Student.student_update_grade_school = function(data, cb) {
		var student_email = data.email
		var school_id = data.school_id;
		var grade_id = data.grade_id;
		var results = {}
		if(student_email&&school_id&&grade_id){
	        Student.updateAll({email: student_email},{
	          school_id:school_id,
	          grade_id: grade_id
	      	}, function (err, doc){
	            if (err) {
	              cb({"error":err});
	            }else{
	              if (doc != null){
	                cb(null,doc);
	              }else{
	                cb({"error":"email inexistente"});
	              }
	            }
	          });
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Student.remoteMethod('student_update_grade_school', {
		  description: 'IUpdate garde and school.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "email":"string", "student_id":"string", "grade_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'results', type: 'object'}
	});



	//--------------------------------------------//
	//-------------expirestudent------------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: expirestudent
		Description: Remote Method that find the status and calculate the 15 days for test. 
	*/

	Student.expirestudent = function(data, cb) {
		var student_id = data.student_id
		var results = {}
		if(student_id){
			Student.find({where: {id: student_id}}, function(err, userdata) {
				if (userdata.length > 0){
					var StatusCustomers = app.models.StatusCustomer;
					var CustomerUser = app.models.CustomerUser;
		  			var startDate = moment(userdata[0]["create_at"], "YYYY-MM-DD");
		  			var endDate = moment(startDate).add(15, 'd').toDate("YYYY-MM-DD");
		  			var nowday = moment()
		  			var countdown = ((endDate - nowday) / (1000*60*60*24));
		  			var statuses = userdata[0]["status_id"]
		  			results['create_at'] = userdata[0]["create_at"]
		  			results['test_end_date'] = endDate 
		  			results['countdown'] = countdown.toFixed()

			  		StatusCustomers.find({where: {id: statuses}}, function(err, status) {
			  			results['status_customer'] = status[0]["name"]
		  				if(userdata[0]["customer_user_id"]!=undefined && status[0]["name"] =="Activo"){
			  				CustomerUser.find({where: {id: userdata[0]["customer_user_id"]}},function(err, customerdata){
			  					if(String(customerdata[0]["status_id"])!=String(statuses)){
			  						results['status_customer'] = "Pendiente de pago"
			  						cb(null,results);
			  					}else{
			  						cb(null,results);
			  					}
			  				})

			  			}else{	  				
			  				cb(null,results);
			  			}
			  		});

				}else{
					cb({"error":"Usuario invalido."})
				}		
		    });	
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Student.remoteMethod('expirestudent', {
		  description: 'Information about rates related with student.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'expirestudent', type: 'object'}
	});



	//--------------------------------------------//
	//---subjects_update(Functions block)----------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: advancesubject
		Description: Function that caculate the advance in the subjects. 
	*/

    function advancesubject(subjects,student_id,userback,count,callback){
		var Chapter = app.models.Chapter;
		var Topic = app.models.Topic;
		var Video = app.models.Video;
		var Quiz = app.models.Quiz;
		var QuizStudentAdvance = app.models.QuizStudentAdvance;
		var Studentadvancetoday = app.models.StudentAdvanceToday;
		var counth = count
		var advancesubjects = 0
		Chapter.find({where: {"subject_id":subjects }}, function(err, chapters){
			if(chapters.length > 0){
	 			var arrechapters = []
	 			for (var ii = 0; ii < chapters.length; ii++) {
	 				arrechapters.push({"chapter_id":chapters[ii].id})
	 			}
	 			Topic.find({where: {"or":arrechapters }}, function(err, topics){
	 				var topisarre = []
	 				var quizlen = 0
	 				var videoslen = 0
	 				var quizstudent = 0
	 				var videosstudent = 0
					 async.series([
					 	function(done){
					 		if (topics.length > 0){
				 				for (var iii = 0; iii < topics.length; iii++) {
				 					var forend = iii+1
				 					topisarre.push({"topic_id":topics[iii].id})
				 					if(forend==topics.length){
				 						done(null,1)
				 					}
				 				}
					 		}else{
					 			done(null,1)
					 		}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							Quiz.find({where: {"or":topisarre }}, function(err, quizes){
								quizlen = quizes.length
						     	done(null,quizlen)
							})
					   	}else{
					   		done(null,quizlen)
					   	}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							QuizStudentAdvance.find({where: {"or":topisarre ,"and": [{ "student_id":student_id , "quiz_finish":true }]}}, function(err, quizesadvance){
								quizstudent  = quizesadvance.length
								done(null,quizstudent)
							})
					   	}else{
					   		done(null,quizstudent)
					   	}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							Video.find({where: {"or":topisarre }}, function(err, videos){
								videoslen = videos.length
								done(null,videoslen)
							});
					   	}else{
					   		done(null,videoslen)
					   	}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							Studentadvancetoday.find({where: {"or":topisarre ,"and": [{ "student_id":student_id , "progress":100}]}}, function(err, videosadvance){
								var videosstudent  = videosadvance.length
								done(null,videosstudent)
							})
					   	}else{
					   		done(null,videosstudent)
					   	}
					   },
					 ],
					 function(err,results){
					     if (err) {
					        callback({"error":err});
					     }else{
					     	var sumaquizvideos = results[1] + results[3]
					     	var sumaadvances = results[2] + results[4]
					     	if(sumaquizvideos > 0 && sumaadvances >0 ){
					     		advancesubjects = (sumaadvances / sumaquizvideos) * 100
					     	}
					     	userback.subjects[counth]["subjects_student_advance"] = advancesubjects
					     	callback({"resolve":userback , "count":counth})
					     };
					 });
	 			})
			}else{
				userback.subjects[counth]["subjects_student_advance"] = advancesubjects
				callback({"resolve":userback , "count":counth})
			}
 		});
    }

	/*
		Authors: asotopaez@gmail.com
		Name: subjects_call
		Description: Function that find and related grade, subject to calculate the advance. 
	*/

	function subjects_call(student_id,grade_id,callback){
		var userback = {"grade":[],"subjects":[]}
		if (student_id && grade_id){
			Student.find({where: {id: student_id}}, function(err, userdata) { 
				var Grade = app.models.Grade;
				var Subject = app.models.Subject;

				Grade.find({where: {id: grade_id }},function(err, gradedata) {
					userback.grade = gradedata;
				 	Subject.find({where: {grade_id: grade_id}},function(err, subjectsdata){
				 		userback.subjects = subjectsdata;
				 		var lentfinish = []
				 		for (var i = 0; i < subjectsdata.length; i++) {
				 			userback.subjects[i]["subjects_student_advance"] = 0
				 			advancesubject(subjectsdata[i].id,student_id,userback,i,function(results){
				 				lentfinish.push(results.count)
				 				if(lentfinish.length==subjectsdata.length){
		    						callback(results.resolve)
				 				}
				 			});
				 		}
				 	});
				})
			});
		}else{
			callback({"error":"Envie los parametros solicitados."})
		}
	}

	/*
		Authors: asotopaez@gmail.com
		Name: subjects_update
		Description: Remote Method that list the advance related into the subject. 
	*/

	Student.subjects_update = function(data, cb) {
		var grade_id = data.grade_id
		var student_id = data.student_id

		subjects_call(student_id,grade_id,function(results){
			if (results['error'] != undefined){
				cb(results)
			}else{
				cb(null,results)
			}
		});
	}


	Student.remoteMethod('subjects_update', {
		  description: 'Update information about subjects related with student.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "grade_id": "string" , "student_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'metadata', type: 'object'}
	});



	//--------------------------------------------//
	//---leaderboards(Functions block)------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: leadersboard_call
		Description: Function that find the leader board in the actual grade per subject. 
	*/

	function leadersboard_call(student_id,school_id,grade_choose,arreschoolsids,callback){
		const student_cons = student_id;
		const school_cons = school_id;
		var grade_student_select = grade_choose;
		var ObjectID = require('mongodb').ObjectID;

        var topaggregation = function(subjects,school_id,student_id,count,callback){
            Student.getDataSource().connector.connect(function(err, db) {
              var collection = db.collection('QuizStudentAdvance');
              var ObjectID = require('mongodb').ObjectID;
              var queryone = {}
              var querytwo = {}
              var student_id = student_id;
              var counth = count;
              var busquedafinal = []
              queryone["subject_id"]= {'$in':subjects};
              querytwo["students.school_id"] = school_id 
              if (school_cons){
                  busquedafinal = [
                        {
                            $match:queryone
                        },
                        {
                            $lookup:{ 
                                from: 'Student',
                                localField: 'student_id',
                                foreignField: '_id',
                                as: 'students' } 
                        },
                        { 
                            $project:{ 
                                _id: 1,
                                quiz_score: 1,
                                extra_points: 1,
                                extra_points_video:1,
                                milisecons_quiz:1,
                                subject_id:1,
                                extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] },
                                'students._id': 1,
                                'students.email': 1,
                                'students.name':1,
                                'students.school_id':1,
                                'students.foto':1
                                }
                        },
                        {
                            $match:querytwo
                        },
                        { 
                            $group: {
                                _id: {student:"$students.email",name: "$students.name",subject:"$subject_id" ,school_id:"$students.school_id",foto:"$students.foto"},
                                AmountPoints: { $sum: "$extra_points_f" }
                            },
                        },
                        { 
                            $sort: { "AmountPoints": -1 } 
                        },
                        { $limit: 100 }                 
                        ];
              }else{
                busquedafinal = [
                        {
                            $match:queryone
                        },
                        {
                            $lookup:{ 
                                from: 'Student',
                                localField: 'student_id',
                                foreignField: '_id',
                                as: 'students' } 
                        },
                        { 
                            $project:{ 
                                _id: 1,
                                quiz_score: 1,
                                extra_points: 1,
                                extra_points_video:1,
                                milisecons_quiz:1,
                                subject_id:1,
                                extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] },
                                'students._id': 1,
                                'students.email': 1,
                                'students.name':1,
                                'students.school_id':1,
                                'students.foto':1
                                }
                        },
                        { 
                            $group: {
                                _id: {student:"$students.email",name: "$students.name",subject:"$subject_id" ,school_id:"$students.school_id",foto:"$students.foto"},
                                AmountPoints: { $sum: "$extra_points_f" }
                            },
                        },
                        { 
                            $sort: { "AmountPoints": -1 } 
                        },
                        { $limit: 100 } 
                    ];

              }
              if(busquedafinal.length>0){       
                  collection.aggregate(busquedafinal, function(err, data) {
                    var results = {}
                    if (err) {
                        callback(err);
                    }else{
                    	
                    	var busquedaestudiante = [
                        {
                            $match:{"subject_id":{'$in':subjects},"student_id":ObjectID(student_cons),"quiz_finish":true }
                        },
                        { 
                            $project:{ 
                                _id: 1,
                                quiz_score: 1,
                                extra_points: 1,
                                milisecons_quiz:1,
                                subject_id:1
                                }
                        },
                        { 
                            $group: {
                                _id: {subject:"$subject_id" },
                                average: { $avg: "$quiz_score" },
                                quisez:  { $sum: 1 }
                            },
                        }
                    ];
                    collection.aggregate(busquedaestudiante, function(err, data2) {
		                    if (err) {
		                        callback(err);
		                    }else{
		                        if(data2.length > 0){
		                        	results['quisez'] = data2[0].quisez
		                        	results['average'] = data2[0].average

		                        }else{
		                        	results['quisez'] = 0
		                        	results['average'] = 0
		                        }
		                        results['subject_id'] = subjects[0]
		                        var tops = []
		                    	for (var i = 0; i < data.length; i++){
		                    		tops.push({"school_name":arreschoolsids[data[i]["_id"].school_id[0]],"username":data[i]["_id"].student[0],"points_win":data[i].AmountPoints})
		                    		data[i]["school_name"] = arreschoolsids[data[i]["_id"].school_id[0]]
		                    	}
		                        results['results'] = data
		                        results['count'] = counth
		                        callback(results);
		                    }
		                  });
                    }
                  });
              }
            });
        }

        var generalAvgaggregation = function(callback){
            Student.getDataSource().connector.connect(function(err, db) {
              var collection = db.collection('QuizStudentAdvance');
              var ObjectID = require('mongodb').ObjectID;
              var busquedaestudiante = [
                        {
                            $match:{"student_id":ObjectID(student_cons),"quiz_finish":true }
                        },
	                    { 
	                        $project:{ 
	                            _id: 1,
	                            student_id:1,
	                            quiz_score: 1,
	                            extra_points: 1,
	                            extra_points_video:1,
	                            extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] }
	                            }
	                    },
                        { 
                            $group: {
                                _id: {student_id:"$student_id" },
                                 average: { $avg: "$quiz_score" }, 
                                 points_win: { $sum: "$extra_points_f" }
                            },
                        },
                    ];
                    collection.aggregate(busquedaestudiante, function(err, data3) {
		                    if (err) {
		                        callback(err);
		                    }else{
		                    	var results = {}
		                    	if(data3.length>0){
		                    		results["average"] = data3[0].average
		                    		results["points_win"] = data3[0].points_win
		                    	}else{
		                    		results["average"] = 0
		                    		results["points_win"] = 0
		                    	}
		                        callback(results);
		                    }
		                  });

            });
        }

		const leaderboards_student = new Promise(
			    (resolve, reject) => { 
					const Subject = app.models.Subject;
					Student.find({where: {id: student_cons}}, function(err, userdata) {
						if(err){
							reject(err);
						}else{
							var grade_id = userdata[0].grade_id
				 			if (grade_student_select){
				 				grade_id = ObjectID(grade_student_select)
				 			}
							Subject.find({where: {grade_id: grade_id}},function(err, subjectsdata){
								var objsubjectadvance = {}
				 				var counthare = []
				 				if(subjectsdata.length>0){
					 				for (var i = 0; i < subjectsdata.length; i++) {
										var arresubjectsids = []
					 					objsubjectadvance[subjectsdata[i].id] = {"subject_id":subjectsdata[i].id,"subject":subjectsdata[i].name,"top":[],"quisez":0,"average":0}
					 					arresubjectsids.push(subjectsdata[i].id)
					 					topaggregation(arresubjectsids,school_cons,student_cons,i,function(quizagg){
	              							counthare.push(quizagg.count)
											objsubjectadvance[quizagg.subject_id]["top"] = quizagg.results
											objsubjectadvance[quizagg.subject_id]["quisez"] = quizagg.quisez
											objsubjectadvance[quizagg.subject_id]["average"] = quizagg.average
						 					if(counthare.length==subjectsdata.length){
						 						var results = {"subjects_advance":objsubjectadvance,"general_averge":{}}
						 						generalAvgaggregation(function(result){
													results["general_averge"] = result
						 							resolve(results)
												})
						 					}
										});
					 				}//endfor
				 				}else{
				 					resolve({"subjects_advance":{},"general_averge":{}})
				 				}

						 	});
						}
					});
			    }
			);

		const leaderboards_fulfill = function(studentdata){
			return Promise.resolve(studentdata);
		}	


		const leaderboards_fulfilled = function(datafull){
			callback(null,datafull)
		}

		// call our promise
		const askleaderboards = function (student_id) {
		    leaderboards_student
		    .then(leaderboards_fulfill)
		    .then(leaderboards_fulfilled)
		    .catch(error => console.log(error.message));
		};
		
		if (student_id){
			askleaderboards(student_id)
		}else{
			callback({"error":"Envie los parametros solicitados."})
		}
	}


	/*
		Authors: asotopaez@gmail.com
		Name: estadisticsboardtime
		Description: Remote Method that build leader board in the school.
	*/


	Student.leaderboards = function(data, cb) {
		var student_id = data.student_id
		var school_id = data.school_id
		const School = app.models.School
		var grade_choose = data.grade_choose;

		if(student_id){
			Student.find({where: {id: student_id}}, function(err, userdata) {			
				var arreschoolsids = {}
		        School.find({where: {level_id: userdata[0].level_id}},function(err, schools){
		        	for (var i = 0; i < schools.length; i++) {
		 					arreschoolsids[schools[i].id] = schools[i]
		 			}//endfor

					leadersboard_call(student_id,school_id,grade_choose,arreschoolsids,function(err,results){
						if(err){
							cb(err)
						}else{
							cb(null,results)
						}
					})

		        });	
			});


		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}


	Student.remoteMethod('leaderboards', {
		  description: 'Information about rates related with student.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'leaderboard_advance', type: 'object'}
	});


	//--------------------------------------------//
	//---winsboard(Functions block)------------//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: winsboard_call
		Description: Function that find and group the thinks won (points,starts,rupees,maps). 
	*/


    var winsboard_call = function(subject_id,student_id,callback){
            Student.getDataSource().connector.connect(function(err, db) {
              var collection = db.collection('QuizStudentAdvance');
              var ObjectID = require('mongodb').ObjectID;
              var queryone = {}
              var busquedafinal = []
              if(subject_id){
              	queryone["subject_id"]= ObjectID(subject_id);
              }
              queryone["student_id"]= ObjectID(student_id);
	          busquedafinal = [
	                    {
	                        $match:queryone
	                    },
	                    { 
	                        $project:{ 
	                            _id: 1,
	                            student_id:1,
	                            quiz_score: 1,
	                            extra_points: 1,
	                            extra_points_video:1,
	                            subject_id:1,
	                            rupees_win:1,
	                            starts_win:1,
	                            maps_win:1,
	                            extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] }
	                            }
	                    },
	                    { 
	                        $group: {
	                            _id: {student_id:"$student_id" },
	                            rupees_win: { $sum: "$rupees_win" }, 
	                            starts_win: { $sum: "$starts_win" }, 
	                            maps_win: { $sum: "$maps_win" },
	                            points_win: { $sum: "$extra_points_f" }
	                        },
	                    }
	                ];

              if(busquedafinal.length>0){       
                  collection.aggregate(busquedafinal, function(err, data) {
                    if (err) {
                        callback({"error":err});
                    }else{
                        callback(data);
                    }
                  });
              }
            });
    }
	
	/*
		Authors: asotopaez@gmail.com
		Name: estadisticsboardtime
		Description: Remote Method that build thinks won.
	*/
	Student.winsboard = function(data, cb) {
		var student_id = data.student_id
		var subject_id = data.subject_id
		if(student_id){
			winsboard_call(subject_id,student_id,function(results){
				if(results['error']!=undefined){
					cb(results)
				}else{
					cb(null,results)
				}
			})
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}



	Student.remoteMethod('winsboard', {
		  description: 'Information about starts, rupees_win, maps and points wins',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string","subject_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'winsboard', type: 'object'}
	});



	//--------------------------------------------//
	//------generaleaderboard(Functions block)---//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: generaleaderboard_call
		Description: Function that find and group the leader board in all video_platform. 
	*/


    var generaleaderboard_call = function(subjects, student_id,schoolstudent,arreschoolsids,callback){
            Student.getDataSource().connector.connect(function(err, db) {
              var collection = db.collection('QuizStudentAdvance');
              var ObjectID = require('mongodb').ObjectID;
              var queryone = {}
              var busquedafinal = []
              var sstudent_id = ObjectID(student_id)
              var sschool_id = schoolstudent
	          busquedafinal = [
	          			{
	          				$match:{"subject_id":{'$in':subjects},"student_id":sstudent_id, "quiz_finish": true }
	          			},
	                    {
                            $lookup:{ 
                                from: 'Subject',
                                localField: 'subject_id',
                                foreignField: '_id',
                                as: 'subjects' } 
                        },
	                   	{
                            $lookup:{ 
                                from: 'Student',
                                localField: 'student_id',
                                foreignField: '_id',
                                as: 'students' } 
                        },
	                    { 
	                        $project:{ 
	                            _id: 1,
	                            student_id:1,
	                            quiz_score: 1,
	                            starts_win:1,
	                            maps_win:1,
	                            extra_points: 1,
	                            extra_points_video:1,
	                            extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] },
	                            'subjects._id': 1,
                                'subjects.name': 1,
                                'students.email':1,
                                'students.name':1,
                                'students.foto':1
	                            }
	                    },
	                    { 
	                        $group: {
	                            _id: {subject_id:"$subjects._id",subject:"$subjects.name" ,student:"$students.email",name:"$students.name",foto:"$students.foto" },
	                            average: { $avg: "$quiz_score" }, 
	                            rupees_win: { $sum: "$rupees_win" }, 
	                            starts_win: { $sum: "$starts_win" }, 
	                            maps_win: { $sum: "$maps_win" },
	                            points_win: { $sum: "$extra_points_f" }
	                        },
	                    }
	                ];

              if(busquedafinal.length>0){       
                  collection.aggregate(busquedafinal, function(err, data) {
                    if (err) {
                        callback({"error":err});
                    }else{
                    	var busquedaestudiante = []
                    	var queryone = { "subject_id":{'$in':subjects} ,"quiz_finish": true}
                    	if(sschool_id){
                    		var querytwo = { "students.school_id": ObjectID(sschool_id) }
		                   	busquedaestudiante = [
		                        {
		                            $match:queryone
		                        },
		                       	{
		                            $lookup:{ 
		                                from: 'Student',
		                                localField: 'student_id',
		                                foreignField: '_id',
		                                as: 'students' } 
		                        },
		                        { 
		                            $project:{ 
		                                _id: 1,
		                                student_id:1,
		                                quiz_score:1, 
			                            extra_points: 1,
			                            extra_points_video:1,
			                            extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] },
		                                subject_id:1,
		                               	'subjects._id': 1,
		                                'subjects.name': 1,
		                                'students.email':1,
		                                'students.name':1,
		                                'students.school_id':1,
		                                'students.foto':1
		                                }
		                        },
		                        {
		                            $match:querytwo
		                        },
		                        { 
		                            $group: {
		                                _id: {student_id:"$student_id" ,student:"$students.email",name:"$students.name",school_id:"$students.school_id",foto:"$students.foto" },
		                                 average: { $avg: "$quiz_score" }, 
		                                 points_win: { $sum: "$extra_points_f" }
		                            },
		                        },
		                       	{ 
		                            $sort: { "points_win": -1 } 
		                        },
		                    ];
              
                    	}else{            		
		                   	busquedaestudiante = [
		                        {
		                            $match:queryone
		                        },
		                       	{
		                            $lookup:{ 
		                                from: 'Student',
		                                localField: 'student_id',
		                                foreignField: '_id',
		                                as: 'students' } 
		                        },
		                        { 
		                            $project:{ 
		                                _id: 1,
		                                student_id:1,
		                                quiz_score:1, 
			                            extra_points: 1,
			                            extra_points_video:1,
			                            extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] },
		                                subject_id:1,
		                               	'subjects._id': 1,
		                                'subjects.name': 1,
		                                'students.email':1,
		                                'students.name':1,
		                                'students.school_id':1,
		                                'students.foto':1
		                                }
		                        },
		                        { 
		                            $group: {
		                                _id: {student_id:"$student_id" ,student:"$students.email",name:"$students.name",school_id:"$students.school_id" ,foto:"$students.foto"},
		                                 average: { $avg: "$quiz_score" }, 
		                                 points_win: { $sum: "$extra_points_f" }
		                            },
		                        },
		                       	{ 
		                            $sort: { "points_win": -1 } 
		                        },
		                    ];
                    	}
                    collection.aggregate(busquedaestudiante, function(err, data2) {
		                    if (err) {
		                        callback(err);
		                    }else{
		                    	var results = {}
		                        results['top_student'] = {"gral_average":0,"top_level":0,"points_win":0}
				                results['subjects'] = data
				                results['general_top100'] = []
				                if(data2.length>0){
			                    	for (var i = 0; i < data2.length; i++){
			                    		var forfin = i+1
			                    		var findid = String(data2[i]._id.student_id)
			                    		var ssstunden = String(sstudent_id)
			                    		if (i<101){
			                    			results['general_top100'].push({"school_name":arreschoolsids[data2[i]["_id"].school_id[0]],"foto":data2[i]["_id"].foto[0],"username":data2[i]["_id"].student[0],"name":data2[i]["_id"].name[0],"average":data2[i].average,"points_win":data2[i].points_win})
			                    		}
			                    		
			                    		if(findid==ssstunden){
			                    			results['top_student']["gral_average"] = data2[i].average
			                    			results['top_student']["points_win"] = data2[i].points_win
			                    			results['top_student']["top_level"] = forfin
			                    			results['top_student']['school'] = arreschoolsids[data2[i]["_id"].school_id[0]]
			                    		}
			                    		if(forfin==data2.length){ 
						                   	var busquedaestudiantesubjects = [
						                        {
						                            $match:queryone
						                        },
						                       	{
						                            $lookup:{ 
						                                from: 'Student',
						                                localField: 'student_id',
						                                foreignField: '_id',
						                                as: 'students' } 
						                        },
						                        { 
						                            $project:{ 
						                                _id: 1,
						                                student_id:1,
							                            extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] },
						                                subject_id:1,
						                                'students.email':1,
						                                }
						                        },
						                        { 
						                            $group: {
						                                _id: {student_id:"$students.email" , subject:"$subject_id"},
						                                 points_win: { $sum: "$extra_points_f" }
						                            },
						                        },
						                       	{ 
						                            $sort: { "points_win": -1 } 
						                        },
						                    ];

			                    			collection.aggregate(busquedaestudiantesubjects, function(err, data3) {
			                    				var resultsfin = {}
			                    				for (var i = 0; i < data3.length; i++){
													if (resultsfin.hasOwnProperty(data3[i]["_id"]["subject"])){
														resultsfin[data3[i]["_id"]["subject"]].push(data3[i]["_id"]["student_id"][0])
													}else{
														resultsfin[data3[i]["_id"]["subject"]] = []
														resultsfin[data3[i]["_id"]["subject"]].push(data3[i]["_id"]["student_id"][0])
													}
			                    				}

			                    				for (var ii= 0; ii < data.length; ii++ ){
			                    					var position = resultsfin[data[ii]["_id"]["subject_id"][0]].lastIndexOf(data[ii]["_id"]["student"][0])
			                    					data[ii]["top_level"] = position+1
			                    				}
						                        callback(results);
			                    			});                   			
			                    		}
			                    	}
				                }else{
				                	callback(results);
				                }
		                    }
		                  });
                    }
                  });
              }
            });
    }
	
	/*
		Authors: asotopaez@gmail.com
		Name: generaleaderboard
		Description: Remote Method that find and group the leader board in all video_platform. 
	*/

	Student.generaleaderboard = function(data, cb) {
		const School = app.models.School
		const student_id = data.student_id
		const schoolbool = data.schoolbool
		var grade_student_select = data.grade_choose;
		var ObjectID = require('mongodb').ObjectID;
		if(student_id){
			var subjects = []
			const Subject = app.models.Subject;
			Student.find({where: {id: student_id}}, function(err, userdata) {
				if(err){
					cb(err);
				}else{
				 	var schoolstudent = "" 
				 	if(schoolbool){
				 		schoolstudent = userdata[0].school_id
				 	}
				 	var grade_id = userdata[0].grade_id
				 	if (grade_student_select){
				 		grade_id = ObjectID(grade_student_select)
				 	}

					Subject.find({where: {grade_id: grade_id}},function(err, subjectsdata){

		 				for (var i = 0; i < subjectsdata.length; i++) {
							subjects.push(subjectsdata[i].id)
		 				}//endfor

						var arreschoolsids = {}
	                    School.find({where: {level_id: userdata[0].level_id}},function(err, schools){
	                    	for (var i = 0; i < schools.length; i++) {
				 					arreschoolsids[schools[i].id] = schools[i]
				 			}//endfor

							generaleaderboard_call(subjects, student_id, schoolstudent, arreschoolsids,function(results){
								if(results['error']!=undefined){
									cb(results)
								}else{
									cb(null,results)
								}
							})

	                    });	
				 	});
				}
			});



		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}

	Student.remoteMethod('generaleaderboard', {
		  description: 'Information about starts, rupees_win, maps and points wins',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string" ,"schoolbool":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'winsboard', type: 'object'}
	});


	//--------------------------------------------//
	//------upload_foto(Functions block)---//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: upload_foto
		Description: Multer instace that save the foto into server/www/img/. 
	*/


  var uploadedFileName = '';
  var storage = multer.diskStorage({
      destination: function (req, file, cbs) {
          var dirPath = 'server/www/img/'
          if (!fs.existsSync(dirPath)) {
              var dir = fs.mkdirSync(dirPath);
          }
          cbs(null, dirPath + '/');
      },
      filename: function (req, file, cbs) {
          var ext = file.originalname.substring(file.originalname.lastIndexOf("."));
          var fileName = Date.now() + ext;
          uploadedFileName = fileName;
          cbs(null, uploadedFileName);
      }
  });



  Student.upload_foto = function (req, res, cb) {

    var upload = multer({
      storage: storage
    }).array('file', 12);

    upload(req, res, function (err) {
      if (err) {
        cb(err);
      }else {
	    var student_id = req.body.student_id;
        if(req.files.length > 0){
          	var path = 'img/'+req.files[0].filename;
	        Student.updateAll({_id: student_id},{
	          foto : path
	      	}, function (err, doc){
	            if (err) {
	              cb({"Error":err});
	            }else{
	              if (doc != null){
	                cb(null,path);
	              }else{
	                cb({"Error":"Id inexistente"});
	              }
	            }
	          });
        }

        }
      });
    };


  Student.remoteMethod('upload_foto',{
    accepts: [
      {
          arg: 'req',
          type: 'object',
          http: {
            source: 'req',
          }
      }, {
          arg: 'res',
          type: 'object',
          http: {
            source: 'res'
          }
      }],
      returns: {
           arg: 'result',
           type: 'string',
           type: 'object'
      }
  });


	//--------------------------------------------//
	//------estadisticsboard(Functions block)---//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: advancestadisticts
		Description: Function that calculate the advance into the subjects. 
	*/

    function advancestadisticts(subjects,student_id,userback,count,callback){
		var Chapter = app.models.Chapter;
		var Topic = app.models.Topic;
		var Video = app.models.Video;
		var Quiz = app.models.Quiz;
		var QuizStudentAdvance = app.models.QuizStudentAdvance;
		var Studentadvancetoday = app.models.StudentAdvanceToday;
		var counth = count
		var advancesubjects = 0
		
		Chapter.find({where: {"subject_id":subjects }}, function(err, chapters){
			if(chapters.length > 0){
	 			var arrechapters = []
	 			for (var ii = 0; ii < chapters.length; ii++) {
	 				arrechapters.push({"chapter_id":chapters[ii].id})
	 			}
	 			Topic.find({where: {"or":arrechapters }}, function(err, topics){
	 				var topisarre = []
	 				var quizlen = 0
	 				var videoslen = 0
	 				var quizstudent = 0
	 				var videosstudent = 0
					 async.series([
					 	function(done){
					 		if (topics.length > 0){
				 				for (var iii = 0; iii < topics.length; iii++) {
				 					var forend = iii+1
				 					topisarre.push({"topic_id":topics[iii].id})
				 					if(forend==topics.length){
				 						done(null,1)
				 					}
				 				}
					 		}else{
					 			done(null,1)
					 		}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							Quiz.find({where: {"or":topisarre }}, function(err, quizes){
								quizlen = quizes.length
						     	done(null,quizlen)
							})
					   	}else{
					   		done(null,quizlen)
					   	}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							QuizStudentAdvance.find({where: {"or":topisarre ,"and": [{ "student_id":student_id , "quiz_finish":true }]}}, function(err, quizesadvance){
								quizstudent  = quizesadvance.length
								done(null,quizstudent)
							})
					   	}else{
					   		done(null,quizstudent)
					   	}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							Video.find({where: {"or":topisarre }}, function(err, videos){
								videoslen = videos.length
								done(null,videoslen)
							});
					   	}else{
					   		done(null,videoslen)
					   	}
					   },
					   function(done){
					   	if (topisarre.length > 0){
							Studentadvancetoday.find({where: {"or":topisarre ,"and": [{ "student_id":student_id , "progress":100}]}}, function(err, videosadvance){
								var videosstudent  = videosadvance.length
								done(null,videosstudent)
							})
					   	}else{
					   		done(null,videosstudent)
					   	}
					   },
					 ],
					 function(err,results){
					     if (err) {
					        callback({"error":err});
					     }else{
					     	var sumaquizvideos = results[1] + results[3]
					     	var sumaadvances = results[2] + results[4]
					     	if(sumaquizvideos > 0 && sumaadvances >0 ){
					     		advancesubjects = (sumaadvances / sumaquizvideos) * 100
					     	}
					     	userback[counth]["subjects_student_advance"] = advancesubjects
					     	userback[0]["semester_student_advance"] += advancesubjects
					     	callback({"resolve":userback , "count":counth})
					     };
					 });
	 			})
			}else{
				userback[counth]["subjects_student_advance"] = advancesubjects
				callback({"resolve":userback , "count":counth})
			}
 		});
    }

	/*
		Authors: asotopaez@gmail.com
		Name: generaladvancestadisticts
		Description: Function that calculate the student advance in all the grade. 
	*/

    function generaladvancestadisticts(student_id,callback){
    	var Student = app.models.Student;
    	var Grade = app.models.Grade;
    	var Subject = app.models.Subject;
		var Chapter = app.models.Chapter;
		var Topic = app.models.Topic;
		var Video = app.models.Video;
		var Quiz = app.models.Quiz;
		var QuizStudentAdvance = app.models.QuizStudentAdvance;
		var Studentadvancetoday = app.models.StudentAdvanceToday;
		var advancesubjects = 0
		Student.find({where: {id:student_id }},function(err, studentdata) {
			Grade.find({where: {level_id: studentdata[0].level_id}},function(err, gradedata) {
	 			var arregrades = []
	 			for (var i = 0; i < gradedata.length; i++) {
	 				arregrades.push({"grade_id":gradedata[i].id})
	 			}

				Subject.find({where: {"or":arregrades }}, function(err, subjects){

		 			var arresubjects = []
		 			for (var i = 0; i < subjects.length; i++) {
		 				arresubjects.push({"subject_id":subjects[i].id})
		 			}

					Chapter.find({where: {"or":arresubjects }}, function(err, chapters){
						if(chapters.length > 0){
				 			var arrechapters = []
				 			for (var ii = 0; ii < chapters.length; ii++) {
				 				arrechapters.push({"chapter_id":chapters[ii].id})
				 			}
				 			Topic.find({where: {"or":arrechapters }}, function(err, topics){
				 				var topisarre = []
				 				var quizlen = 0
				 				var videoslen = 0
				 				var quizstudent = 0
				 				var videosstudent = 0
								 async.series([
								 	function(done){
								 		if (topics.length > 0){
							 				for (var iii = 0; iii < topics.length; iii++) {
							 					var forend = iii+1
							 					topisarre.push({"topic_id":topics[iii].id})
							 					if(forend==topics.length){
							 						done(null,1)
							 					}
							 				}
								 		}else{
								 			done(null,1)
								 		}
								   },
								   function(done){
								   	if (topisarre.length > 0){
										Quiz.find({where: {"or":topisarre }}, function(err, quizes){
											quizlen = quizes.length
									     	done(null,quizlen)
										})
								   	}else{
								   		done(null,quizlen)
								   	}
								   },
								   function(done){
								   	if (topisarre.length > 0){
										QuizStudentAdvance.find({where: {"or":topisarre ,"and": [{ "student_id":student_id,"quiz_finish": true }]}}, function(err, quizesadvance){
											quizstudent  = quizesadvance.length
											done(null,quizstudent)
										})
								   	}else{
								   		done(null,quizstudent)
								   	}
								   },
								   function(done){
								   	if (topisarre.length > 0){
										Video.find({where: {"or":topisarre }}, function(err, videos){
											videoslen = videos.length
											done(null,videoslen)
										});
								   	}else{
								   		done(null,videoslen)
								   	}
								   },
								   function(done){
								   	if (topisarre.length > 0){
										Studentadvancetoday.find({where: {"or":topisarre ,"and": [{ "student_id":student_id , "progress":100 }]}}, function(err, videosadvance){
											var videosstudent  = videosadvance.length
											done(null,videosstudent)
										})
								   	}else{
								   		done(null,videosstudent)
								   	}
								   },
								 ],
								 function(err,results){
								     if (err) {
								        callback({"error":err});
								     }else{
								     	var sumaquizvideos = results[1] + results[3]
								     	var sumaadvances = results[2] + results[4]
								     	if(sumaquizvideos > 0 && sumaadvances >0 ){
								     		advancesubjects = (sumaadvances / sumaquizvideos) * 100
								     	}
								     	callback({"resolve":advancesubjects})
								     };
								 });
				 			})
						}else{
							callback({"resolve":advancesubjects })
						}
			 		});//Chapters
		 		});//Subjects
		 	});//Grades
		 });//Students
    }

	/*
		Authors: asotopaez@gmail.com
		Name: estadisticsboard_call
		Description: Function that find and group the data and build the estadistcs.  
	*/

    var estadisticsboard_call = function(subjects,student_id,callback){
            Student.getDataSource().connector.connect(function(err, db) {
              var collection = db.collection('QuizStudentAdvance');
              var ObjectID = require('mongodb').ObjectID;
              var queryone = {}
              var busquedafinal = []
              var queryone = { "subject_id":{'$in':subjects} ,"student_id": ObjectID(student_id), "quiz_finish":true }
	          busquedafinal = [
	                    {
	                        $match:queryone
	                    },
	                   	{
                            $lookup:{ 
                                from: 'Subject',
                                localField: 'subject_id',
                                foreignField: '_id',
                                as: 'subjects' } 
                        },
	                    { 
	                        $project:{ 
	                            quiz_score: 1,
	                            subject_id:1,
	                            maps_win:1,
	                            "subjects._id":1,
	                            'subjects.name':1,
	                            }
	                    },
	                    { 
	                        $group: {
	                            _id: {"subjects_name":"$subjects.name","subjects_id":"$subjects._id" },
	                            maps_win: { $sum: "$maps_win" },
	                            average: { $avg: "$quiz_score" }
	                        },
	                    }
	                ];

              if(busquedafinal.length>0){       
                  collection.aggregate(busquedafinal, function(err, userback) {
                    if (err) {
                        callback({"error":err});
                    }else{
						var busquedafinal2 = [
							                    {
							                        $match:queryone
							                    },
							                    { 
							                        $project:{ 
							                            _id: 1,
							                            student_id:1,
							                            quiz_score: 1,
							                            extra_points: 1,
							                            extra_points_video:1,
							                            rupees_win:1,
							                            starts_win:1,
							                            extra_points_f: { $sum: ["$extra_points" ,"$extra_points_video"] }
							                            }
							                    },
							                    { 
							                        $group: {
							                            _id: {"student_id":"$student_id" },
							                            rupees_win: { $sum: "$rupees_win" }, 
							                            starts_win: { $sum: "$starts_win" }, 
							                            average: { $avg: "$quiz_score" },
							                            points_win: { $sum: "$extra_points_f" }
							                        },
							                    }
							                ];

                    	collection.aggregate(busquedafinal2,function(err,data2){
					 		var lentfinish = []
					 		if (userback.length > 0){
						 		userback[0]["semester_student_advance"] = 0
						 		for (var i = 0; i < userback.length; i++) {
						 			userback[i]["subjects_student_advance"] = 0
						 			advancestadisticts(userback[i]["_id"].subjects_id[0],student_id,userback,i,function(results){
						 				lentfinish.push(results.count)
						 				if(lentfinish.length==userback.length){
						 					data2[0]['semester_student_advance'] = (userback[0]["semester_student_advance"] / subjects.length) 
						 					delete userback[0]["semester_student_advance"]
		                        			callback({"subjects_advance":results.resolve,"semester_advance":data2});
						 				}
						 			});
						 		}
					 		}else{
					 			callback({"subjects_advance":[],"semester_advance":[]});
					 		}
                    	})
                    }
                  });
              }
            });
    }

	/*
		Authors: asotopaez@gmail.com
		Name: estadisticsboard_call
		Description: Remote Method that call the functions.  
	*/

	Student.estadisticsboard = function(data, cb) {
		var student_id = data.student_id
		var grade_id = data.grade_id
		var ObjectID = require('mongodb').ObjectID;
		if(student_id){
			var Subject = app.models.Subject;
		 	Subject.find({where: {grade_id: ObjectID(grade_id)}},function(err, subjectsdata){
		 		var arresubjects = []
		 		for (var i = 0; i < subjectsdata.length; i++) {
		 			arresubjects.push(subjectsdata[i].id)
		 		}
				estadisticsboard_call(arresubjects,student_id,function(results){
					if(results['error']!=undefined){
						cb(results)
					}else{
						generaladvancestadisticts(student_id,function(results2){
							results['general_advance'] = results2.resolve
							cb(null,results)
						});
					}
				})
		 	})

		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}



	Student.remoteMethod('estadisticsboard', {
		  description: 'Information about starts, rupees_win, maps and points wins',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string","grade_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'board', type: 'object'}
	});


	/*
		Authors: asotopaez@gmail.com
		Name: grade_finish
		Description: Update student to the next grade. 
	*/


	var studentupdategrade = function(student_id,StudentAdvanceupdate,callback){
		var ObjectID = require('mongodb').ObjectID;
    	var studentwhere = {"_id":ObjectID(student_id)}
        Student.getDataSource().connector.connect(function(err, db) {
      	  var collection = db.collection('Student');
          collection.update(studentwhere,StudentAdvanceupdate, function(err, data) {
            if (err) {
                callback({error:err});
            }else{
                callback(data);
            }
          });
        });
    }

	Student.grade_finish = function(data, cb) {
		var student_id = data.student_id
		var grade_id = data.grade_id
		var level_id = data.level_id
		if(student_id&&grade_id&&level_id){
			var Grade = app.models.Grade;
			var Level = app.models.Level
		 	Grade.find({where: {"level_id":level_id ,"id": {"gt": grade_id }}, limit: 1, order:"id ASC"},function(err, nextgrades){
		 		if (nextgrades.length > 0){
		 			var nextgrade = { "$set":{ "grade_id":nextgrades[0]["id"] }}
					studentupdategrade(student_id,nextgrade,function(gradeupdate){
						cb(null,{ "grade_id": nextgrades[0]["id"],"level_id": level_id })
					});
		 		}else{
		 			Level.find({where: {"id": {"gt": level_id }}, limit: 1, order:"id ASC"},function(err, nextlevels){
		 				if (nextlevels.length > 0){
		 					Grade.find({where: {"level_id":nextlevels[0]["id"] }, limit: 1, order:"id ASC"},function(err, nextgradest){
		 						if (nextgradest.length > 0){
						 			var nextlevel = { "$set":{ "level_id":nextlevels[0]["id"] ,"grade_id":nextgradest[0]["id"]}}
									studentupdategrade(student_id,nextlevel,function(gradeupdate){
										cb(null,{ "grade_id": nextgradest[0]["id"],"level_id": nextlevels[0]["id"] })
									});
		 						}else{
		 							cb(null,{ "grade_id": grade_id,"level_id": level_id })
		 						}	 						
		 					});
		 				}else{
		 					cb(null,{ "grade_id": grade_id,"level_id": level_id })
		 				}
		 			});

		 		}
		 	})
		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}

	Student.remoteMethod('grade_finish', {
		  description: 'Update student to the next grade and level.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string","grade_id":"string","level_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'result', type: 'object'}
	});

};
