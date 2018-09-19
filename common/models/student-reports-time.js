'use strict';

module.exports = function(StudentReportsTime) {
	var moment = require('moment');
	var async = require("async");
	var app = require('../../server/server');



	//--------------------------------------------//
	//---estadisticsboardtime(Functions block)---//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: StudentReportT
		Description: Function that find the data for report times consume in tests and videos
	*/

    var StudentReportT = function(student_id,grade_id,type,dateinit,datefin,callback){
        StudentReportsTime.getDataSource().connector.connect(function(err, db) {
          var collection = db.collection('StudentReportsTime');
          var ObjectID = require('mongodb').ObjectID;
          var idate = new Date(dateinit);
          var fdate = new moment(datefin).add(18, 'h').add(59, 'm').toDate();
          var queryone = {"student_id":ObjectID(student_id),"grade_id": ObjectID(grade_id), "initial_date" : { "$gte": idate}, "end_date":{"$lt": fdate}}
          var querytwo = {"student_id":ObjectID(student_id),"grade_id": ObjectID(grade_id)}
          var proyects_elect = { _id: 1, student_id:1, value:1, subject_id:1,"subjects.name":1,type:1, days : { "$substr": ["$initial_date", 0, 10] } }
          var group_custom = {subject:"$subjects.name", times:"$days"}
          var group_custom_semester = { subject:"$subjects.name",times:"$days"}
          var group_custom_test = { subject:"$subjects.name", types:"$type"}
          if (type=="hours"){
          	delete proyects_elect["days"]
          	proyects_elect["hours"] = { "$hour" : "$initial_date" }
          	//proyects_elect["hours"] = { "$substr": ["$initial_date", 11, 5] }
          	group_custom["times"] = "$hours"
          	group_custom_semester["times"] = "$hours"
          }else if(type=="weeks"){
          	delete proyects_elect["days"]
          	proyects_elect["weeks"] = { "$week" : "$initial_date" }
          	group_custom["times"] = "$weeks"
          	group_custom_semester["times"] = "$weeks"


          }else if(type=="mouths"){
          	delete proyects_elect["days"]
          	proyects_elect["mouths"] = { "$month": "$initial_date" }
          	group_custom["times"] = "$mouths"
          	group_custom_semester["times"] = "$mouths"

          }else if (type=="years"){
          	delete proyects_elect["days"]
          	proyects_elect["years"] = { "$year": "$initial_date" }
          	group_custom["times"] = "$years"
          	group_custom_semester["times"] = "$years"

          }

          var busquedaestudiante = [
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
                        $project: proyects_elect
                    },
                    { 
                        $group: {
                            _id: group_custom, 
                             minutes: { $sum: "$value" }
                        }
                    },
                    { 
		                $sort: { "_id": 1 } 
		            },
                ];
                collection.aggregate(busquedaestudiante, function(err, data) {
	                    if (err) {
	                        callback(err);
	                    }else{
	                    	busquedaestudiante[3]["$group"]["_id"] = group_custom_semester
	                    	collection.aggregate(busquedaestudiante, function(err, data2) {
								busquedaestudiante[0]["$match"] = querytwo
	                    		busquedaestudiante[3]["$group"]["_id"] = group_custom_test
	                    		busquedaestudiante[3]["$group"]["count"] = {"$sum":1}
	                    		collection.aggregate(busquedaestudiante, function(err, data3) {
	                       	 		callback({"subjects":data,"semester":data2,"quizes":data3});
	                    		});
	                       
	                    	});
	                    }
	                  });
        });
    }



	/*
		Authors: asotopaez@gmail.com
		Name: estadisticsboardtime
		Description: Remote Method that build the report for time consume in tests and videos
	*/

	StudentReportsTime.estadisticsboardtime = function(data, cb) {
		var student_id = data.student_id
		var grade_id = data.grade_id
		var type = data.type;
		var dateinit = data.initial_date;
		var datefin = data.end_date;
		if(student_id){
			StudentReportT(student_id,grade_id,type,dateinit,datefin,function(results){
				if(results['error']!=undefined){
					cb(results)
				}else{
					var resultsfin = {"Semestre":{"x_axis":[],"y_axis":[],"minutes":0,"test":0}}

					async.series([
						 	function(done){
						 		if (results["semester"].length > 0){
									for(var x = 0; x < results["semester"].length ; x++){
										var forend = x+1
										resultsfin["Semestre"]["x_axis"].push(results["semester"][x]["_id"]["times"])
										resultsfin["Semestre"]["y_axis"].push(results["semester"][x]["minutes"])
										if(forend==results["semester"].length){
					 						done(null,1)
					 					}
									}
						 		}else{
						 			done(null,1)
						 		}
						   },
						   function(done){

						   	if (results["subjects"].length > 0){
								for (var i = 0; i < results["subjects"].length ; i++){
									var forend = i+1
									if (resultsfin.hasOwnProperty(results["subjects"][i]["_id"]["subject"][0])){
										resultsfin[results["subjects"][i]["_id"]["subject"][0]]["x_axis"].push(results["subjects"][i]["_id"]["times"])
										resultsfin[results["subjects"][i]["_id"]["subject"][0]]["y_axis"].push(results["subjects"][i]["minutes"])
									}else{
										resultsfin[results["subjects"][i]["_id"]["subject"][0]] = {"x_axis":[],"y_axis":[]}
										resultsfin[results["subjects"][i]["_id"]["subject"][0]]["x_axis"].push(results["subjects"][i]["_id"]["times"])
										resultsfin[results["subjects"][i]["_id"]["subject"][0]]["y_axis"].push(results["subjects"][i]["minutes"])
										resultsfin[results["subjects"][i]["_id"]["subject"][0]]["minutes"] = 0
										resultsfin[results["subjects"][i]["_id"]["subject"][0]]["test"] = 0
									}
									if(forend==results["subjects"].length){
					 					done(null,resultsfin)
					 				}
								}
						   	}else{
						   		done(null,1)
						   	}

						   },
						   function(done){
						   	if (results["subjects"].length > 0 && results["quizes"].length > 0){ 
								for (var iii = 0; iii < results["quizes"].length ; iii++){
									var forend = iii+1
									if (resultsfin.hasOwnProperty(results["quizes"][iii]["_id"]["subject"][0])){
										resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['minutes'] += results["quizes"][iii]["minutes"]
										resultsfin["Semestre"]['minutes'] += results["quizes"][iii]["minutes"]
									}else{
										resultsfin[results["quizes"][iii]["_id"]["subject"][0]] = {"x_axis":[],"y_axis":[],"minutes":0,"test":0}
										resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['minutes'] = results["quizes"][iii]["minutes"]
										resultsfin["Semestre"]['minutes'] = results["quizes"][iii]["minutes"]
									}
									if(results["quizes"][iii]["_id"]["types"]=="test"){
										resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['test'] = results["quizes"][iii]["count"]
										resultsfin["Semestre"]['test'] += results["quizes"][iii]["count"]
									}
									if(forend==results["quizes"].length){
					 					done(null,resultsfin)
					 				}						
								}
						   	}else{
						   		done(null,1)
						   	}
						   },

						 ],
						 function(err,results){
						     if (err) {
						        cb({"error":err});
						     }else{
						     	cb(null,resultsfin)
						     };
						 });
				}
			})


		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}

	StudentReportsTime.remoteMethod('estadisticsboardtime', {
		  description: 'Information about times student.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string","grade_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'estadisticstime', type: 'object'}
	});

/////////////////////////////////////////////////////////////Alfa////////////////////////////////////////


	//--------------------------------------------//
	//--estadisticsboardtimetwo(Functions block)--//
	//-------------------------------------------//

	/*
		Authors: asotopaez@gmail.com
		Name: StudentReportTwo
		Description: Function that find the data for report times consume in tests and videos
	*/
    var  StudentReportTwo = function(student_id,grade_id,subjects,type,dateinit,datefin,callback){
        StudentReportsTime.getDataSource().connector.connect(function(err, db) {
          var collection = db.collection('StudentReportsTime');
          var collection2 = db.collection('QuizStudentAdvance');
          var collection3 = db.collection('StudentAdvanceToday');
          var ObjectID = require('mongodb').ObjectID;
          var idate = new Date(dateinit);
          var fdate = new moment(datefin).add(18, 'h').add(59, 'm').toDate();
          var queryone = {"student_id":ObjectID(student_id),"grade_id": ObjectID(grade_id), "initial_date" : { "$gte": idate}, "end_date":{"$lt": fdate}}
          var querytwo = {"student_id":ObjectID(student_id),"grade_id": ObjectID(grade_id)}
          var proyects_elect = { _id: 1, student_id:1, value:1, subject_id:1,"subjects.name":1,type:1, days : { "$substr": ["$initial_date", 0, 10] } }
          var group_custom = {subject:"$subjects.name", times:"$days"}
          var group_custom_semester = { subject:"$subjects.name",times:"$days"}
          var group_custom_test = { subject:"$subjects.name", types:"$type"}

          if (type=="hours"){
          	delete proyects_elect["days"]
          	proyects_elect["hours"] = { "$hour" : "$initial_date" }
          	group_custom["times"] = "$hours"
          	group_custom_semester["times"] = "$hours"
          }else if(type=="weeks"){
          	delete proyects_elect["days"]
          	proyects_elect["weeks"] = { "$week" : "$initial_date" }
          	group_custom["times"] = "$weeks"
          	group_custom_semester["times"] = "$weeks"
          }else if(type=="mouths"){
          	delete proyects_elect["days"]
          	proyects_elect["mouths"] = { "$month": "$initial_date" }
          	group_custom["times"] = "$mouths"
          	group_custom_semester["times"] = "$mouths"

          }else if (type=="years"){
          	delete proyects_elect["days"]
          	proyects_elect["years"] = { "$year": "$initial_date" }
          	group_custom["times"] = "$years"
          	group_custom_semester["times"] = "$years"

          }

          var busquedaestudiante = [
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
                        $project: proyects_elect
                    },
                    { 
                        $group: {
                            _id: group_custom, 
                             minutes: { $sum: "$value" }
                        }
                    },
                    { 
		                $sort: { "_id": 1 } 
		            },
                ];


            var busquedaquizez = [

                        {
                            $match: { "subject_id":{'$in':subjects} ,"student_id": ObjectID(student_id)}

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
	                            _id: 1,
	                            student_id:1,
	                            subject_id: 1,
	                            "subjects.name":1,
	                            attempts_fail: 1,
	                            attempts_succes: 1,
	                            attempts_s: { $sum: ["$attempts_fail","$attempts_succes"] },
	                            quiz_finish_count : { $cond : [ "$quiz_finish", 1, 0 ]}
	                            }
	                    },
                        { 
                            $group: {
                                _id: {subject:"$subjects.name" },
	                            tests_fail: { $sum: "$attempts_fail" },
	                            tests_succes: { $sum: "$attempts_succes" },
	                            tests_attempts : { $sum:"$attempts_s" },
	                            tests_completed : { $sum :"$quiz_finish_count"}
                            },
                        },
                    ];


            var busquedavideos = [

                        {
                            $match:{ "subject_id":{'$in':subjects} ,"student_id": ObjectID(student_id)}
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
	                            _id: 1,
	                            subject_id: 1,
	                            video_id:1,
	                            "subjects.name":1,
	                            }
	                    },
                        { 
                            $group: {
                                _id: {subject:"$subjects.name",video:"$video_id" },
	                            video_completed: { $sum: 1 },
                            },
                        },
                    ];





            collection.aggregate(busquedaestudiante, function(err, data) {
                    if (err) {
                        callback(err);
                    }else{
                    	busquedaestudiante[3]["$group"]["_id"] = group_custom_semester
                    	collection.aggregate(busquedaestudiante, function(err, data2) {
							busquedaestudiante[0]["$match"] = querytwo
                    		busquedaestudiante[3]["$group"]["_id"] = group_custom_test
                    		busquedaestudiante[3]["$group"]["count"] = {"$sum":1}
                    		collection.aggregate(busquedaestudiante, function(err, data3) {
                    			collection2.aggregate(busquedaquizez, function(err, data4) {
                    				collection3.aggregate(busquedavideos, function(err, data5) {
                       	 				callback({"subjects":data,"semester":data2,"quizes":data3,"quizes_attemps":data4,"videos_finish":data5});
                    				});
                    			});
                    		});
                    	});
                    }
                  });
        });
    }

	/*
		Authors: asotopaez@gmail.com
		Name: estadisticsboardtimetwo
		Description: Remote Method that build the report for time consume in tests and videos and some other attemps.
	*/

	StudentReportsTime.estadisticsboardtimetwo = function(data, cb) {
		var student_id = data.student_id
		var grade_id = data.grade_id
		var type = data.type;
		var dateinit = data.initial_date;
		var datefin = data.end_date;
		var Subject = app.models.Subject;
		if(student_id){
			Subject.find({where: {"grade_id":grade_id}}, function(err, subjects){
	 			var arresubjects = []
	 			for (var i = 0; i < subjects.length; i++) {
	 				arresubjects.push(subjects[i].id)
	 			}
				StudentReportTwo(student_id,grade_id,arresubjects,type,dateinit,datefin,function(results){
					if(results['error']!=undefined){
						cb(results)
					}else{
						var resultsfin = {"Semestre":{"x_axis":[],"y_axis":[],"minutes_total":0,"videos_completed":0,"videos_repeated":0,"tests_attempts":0,"tests_completed":0,"tests_succes":0,"tests_fail":0,"minutes_tests":0,"minutes_video":0}}
						async.series([
							 	function(done){
							 		if (results["semester"].length > 0){
										var group_time = {}
										for(var x = 0; x < results["semester"].length ; x++){
											var forend = x+1
											var time  = results["semester"][x]["_id"]["times"]
											var minutes = results["semester"][x]["minutes"]
											if(group_time.hasOwnProperty(time)){
												group_time[time] += minutes
											}else{
												group_time[time] = 0
												group_time[time] = minutes
											}
											if(forend==results["semester"].length){
												for ( var y in group_time){
													resultsfin["Semestre"]["x_axis"].push(y)
													resultsfin["Semestre"]["y_axis"].push(group_time[y])
												}
						 						done(null,1)
						 					}
										}
							 		}else{
							 			done(null,1)
							 		}
							   },
							   function(done){

							   	if (results["subjects"].length > 0){
									for (var i = 0; i < results["subjects"].length ; i++){
										var forend = i+1
										if (resultsfin.hasOwnProperty(results["subjects"][i]["_id"]["subject"][0])){
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["x_axis"].push(results["subjects"][i]["_id"]["times"])
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["y_axis"].push(results["subjects"][i]["minutes"])
										}else{
											resultsfin[results["subjects"][i]["_id"]["subject"][0]] = {"x_axis":[],"y_axis":[]}
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["x_axis"].push(results["subjects"][i]["_id"]["times"])
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["y_axis"].push(results["subjects"][i]["minutes"])
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["minutes_total"] = 0
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["minutes_tests"] = 0
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["minutes_video"] = 0
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["videos_repeated"] = 0
											resultsfin[results["subjects"][i]["_id"]["subject"][0]]["videos_completed"] = 0


										}
										if(forend==results["subjects"].length){
						 					done(null,resultsfin)
						 				}
									}
							   	}else{
							   		done(null,1)
							   	}

							   },
							   function(done){
							   	if (results["subjects"].length > 0 && results["quizes"].length > 0){ 
									for (var iii = 0; iii < results["quizes"].length ; iii++){
										var forend = iii+1
										if (resultsfin.hasOwnProperty(results["quizes"][iii]["_id"]["subject"][0])){
											resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['minutes_total'] += results["quizes"][iii]["minutes"]
											resultsfin["Semestre"]['minutes_total'] += results["quizes"][iii]["minutes"]
										}else{
											resultsfin[results["quizes"][iii]["_id"]["subject"][0]] = {"x_axis":[],"y_axis":[],"minutes_tests":0,"minutes_video":0}
											resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['minutes_total'] = results["quizes"][iii]["minutes"]
											resultsfin["Semestre"]['minutes_total'] = results["quizes"][iii]["minutes"]
										}
										if(results["quizes"][iii]["_id"]["types"]=="video"){
											resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['videos_repeated'] = results["quizes"][iii]["count"]
											resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['minutes_video'] += results["quizes"][iii]["minutes"]
											resultsfin["Semestre"]['videos_repeated'] += results["quizes"][iii]["count"]
											resultsfin["Semestre"]['minutes_video'] += results["quizes"][iii]["minutes"]

										}
										if(results["quizes"][iii]["_id"]["types"]=="test"){
											resultsfin[results["quizes"][iii]["_id"]["subject"][0]]['minutes_tests'] += results["quizes"][iii]["minutes"]
											resultsfin["Semestre"]['minutes_tests'] += results["quizes"][iii]["minutes"]
										}
										if(forend==results["quizes"].length){
						 					done(null,resultsfin)
						 				}						
									}
							   	}else{
							   		done(null,1)
							   	}
							   },
							   function(done){
							   	if (results["subjects"].length > 0 && results["quizes_attemps"].length > 0){ 
									for (var iii = 0; iii < results["quizes_attemps"].length ; iii++){
										var forend = iii+1
										
										resultsfin[results["quizes_attemps"][iii]["_id"]["subject"][0]]['tests_completed'] = results["quizes_attemps"][iii]['tests_completed']
										resultsfin[results["quizes_attemps"][iii]["_id"]["subject"][0]]['tests_attempts'] = results["quizes_attemps"][iii]['tests_attempts']
										resultsfin[results["quizes_attemps"][iii]["_id"]["subject"][0]]['tests_succes'] = results["quizes_attemps"][iii]['tests_succes']
										resultsfin[results["quizes_attemps"][iii]["_id"]["subject"][0]]['tests_fail'] = results["quizes_attemps"][iii]['tests_fail']
										resultsfin["Semestre"]['tests_completed'] += results["quizes_attemps"][iii]['tests_completed']
										resultsfin["Semestre"]['tests_attempts'] += results["quizes_attemps"][iii]['tests_attempts']
										resultsfin["Semestre"]['tests_succes'] += results["quizes_attemps"][iii]['tests_succes']
										resultsfin["Semestre"]['tests_fail'] += results["quizes_attemps"][iii]['tests_fail']
										if(forend==results["quizes_attemps"].length){
						 					done(null,resultsfin)
						 				}						
									}
							   	}else{
							   		done(null,1)
							   	}
							   },
							   function(done){
							   	if (results["subjects"].length > 0 && results["videos_finish"].length > 0){ 
									for (var iii = 0; iii < results["videos_finish"].length ; iii++){
										var forend = iii+1
										
										resultsfin[results["videos_finish"][iii]["_id"]["subject"][0]]['videos_completed'] += 1
										resultsfin["Semestre"]['videos_completed'] += 1

										if(forend==results["videos_finish"].length){
						 					done(null,resultsfin)
						 				}						
									}
							   	}else{
							   		done(null,1)
							   	}
							   },
							 ],
							 function(err,results){
							     if (err) {
							        cb({"error":err});
							     }else{
							     	cb(null,resultsfin)
							     };
							 });
					}
				})
		 	});


		}else{
			cb({"error":"Envie los parametros solicitados."})
		}
	}

	StudentReportsTime.remoteMethod('estadisticsboardtimetwo', {
		  description: 'Information about times student.',
	      accepts: {arg: 'data', type: 'object' , default: '{ "student_id":"string","grade_id":"string" }' , http: {source: 'body'}},
	      returns: {arg: 'estadisticstime', type: 'object'}
	});

};
