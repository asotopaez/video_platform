'use strict';

module.exports = function(Chapter) {
	var app = require('../../server/server');
	Chapter.validatesPresenceOf('subject_id', {message: 'Relations cannot be blank'});

	//--------------------------------//
	//--all_related(Functions block)--//
	//--------------------------------//

    /*
		Authors: asotopaez@gmail.com
		Name: chapters_topics_videos_relations
		Description: Function that relates the chapters with their topics and videos

    */

    function chapters_topics_videos_relations(chapter_id,callback){
		var Topic = app.models.Topic;
		var Videoss = app.models.Video;
		if(chapter_id){
			Topic.find({where: {chapter_id: chapter_id}},function(err, topicdata){
				var arretopics = []
				var arrevideos = []
				if(topicdata.length){
			 		for (var i = 0; i < topicdata.length; i++) {
			 			arretopics.push({"topic_id":topicdata[i].id})
			 			topicdata[i].videos = []
			 			topicdata[i].quiz = []
			 			topicdata[i].quiz_student_score = {quiz_finish:false,quiz_advance_percentaje:0,student_score:0, average_score:0,rupees_win:0,starts_win:0,maps_win:0,milisecons_quiz:0,extra_points:0,coordinates:0}
			 		}

			 		Videoss.find({where: {"or":arretopics}}, function(err, videosdata){

			 			for (var ii = 0; ii < topicdata.length; ii++) {
			 				for (var iii = 0; iii < videosdata.length; iii++){
			 					var videoid = String(videosdata[iii].id)
				 				var videotopic = String(videosdata[iii].topic_id)
				 				var topicid = String(topicdata[ii].id)
				 				if (videotopic==topicid){
				 					arrevideos.push({"video_id":videoid})
				 					topicdata[ii].videos.push(videosdata[iii])
				 				}
			 				}
				 		}
		  				callback({"topicdata":topicdata,"arretopics":arretopics,"arrevideos":arrevideos});
			 		})
				}else{
					callback({"error":"No hay temas relacionados."});
				}
			});
		}else{
			callback({"error":"Enviar parametros correctos."})
		}
    }

    /*
		Authors: asotopaez@gmail.com
		Name: shuffle
		Description: Function to shuffle  questions 
    */

	function shuffle(array,numberquestion) {
	  var currentIndex = array.length, temporaryValue, randomIndex;

	  while (0 !== currentIndex) {
	    randomIndex = Math.floor(Math.random() * currentIndex);
	    currentIndex -= 1;
	    temporaryValue = array[currentIndex];
	    array[currentIndex] = array[randomIndex];
	    array[randomIndex] = temporaryValue;
	  }
	  array = array.slice(0,parseInt(numberquestion))
	  return array
	}


    /*
		Authors: asotopaez@gmail.com
		Name: chapter_quiz_relations
		Description: Function that relates the chapters with their quizes
    */

    function chapter_quiz_relations(chapter_id,numberquestion,callbk){
        var Quiz = app.models.Quiz;
        var numberquestionmin = 0
        if (numberquestion){
        	numberquestionmin = numberquestion
        }
        chapters_topics_videos_relations(chapter_id,function(topicsres){
            if(topicsres['error']!=undefined){
                callbk(topicsres)
            }else{
                Quiz.find({where: {"or":topicsres.arretopics}}, function(err, quizdata){
                	if(err){
                		callback({"error":err})
                	}else{
	                    for (var ii = 0; ii < topicsres.topicdata.length; ii++){
	                        for (var iii = 0; iii < quizdata.length; iii++){
	                            var topicid = String(topicsres.topicdata[ii].id)
	                            var quiztopic = String(quizdata[iii].topic_id)                  
	                            if (quiztopic==topicid){
	                            	if(numberquestionmin>0){
	                            		var sorting = shuffle(quizdata[iii].questions,numberquestion)
	                            		quizdata[iii].questions = sorting
	                            		topicsres.topicdata[ii].quiz.push(quizdata[iii])
	                            	}else{
	                                	topicsres.topicdata[ii].quiz.push(quizdata[iii])
	                            	}
	                            }
	                        }
	                    }
	                    delete topicsres.arretopics
	                    callbk(topicsres);
                	}
                })
            }
        })
    }

    /*
		Authors: asotopaez@gmail.com
		Name: topic_quiz_average
		Description: Function that find quizes advance for the topics
    */
	function topic_quiz_average(chapteres,quiz_id,student_id,quizlen,counth,counthquiz,callb){
		var QuizStudentAdvance = app.models.QuizStudentAdvance;
		var count = counth.length
		var countquiz = counthquiz.length			
		chapteres["coordinatearre"] = []
		chapteres["coordinate"] = 0
		QuizStudentAdvance.find({where: {"quiz_id":quiz_id,"student_id":student_id}, order:'id' },function(err, topicstudentdata){
			if(topicstudentdata.length > 0){
				for(var qzi = 0; qzi < topicstudentdata.length; qzi++){
					var forfin = qzi+1
					chapteres.topicdata[count-1].quiz_student_score['student_score'] += topicstudentdata[qzi].quiz_score
					chapteres.topicdata[count-1].quiz_student_score['milisecons_quiz'] += topicstudentdata[qzi].milisecons_quiz
					chapteres.topicdata[count-1].quiz_student_score['average_score'] = chapteres.topicdata[count-1].quiz_student_score['student_score']/quizlen
					chapteres.topicdata[count-1].quiz_student_score['rupees_win'] += topicstudentdata[qzi].rupees_win
					chapteres.topicdata[count-1].quiz_student_score['starts_win'] += topicstudentdata[qzi].starts_win
					chapteres.topicdata[count-1].quiz_student_score['maps_win'] += topicstudentdata[qzi].maps_win
					chapteres.topicdata[count-1].quiz_student_score['quiz_finish'] = topicstudentdata[qzi].quiz_finish
					chapteres.topicdata[count-1].quiz_student_score['extra_points'] = topicstudentdata[qzi].extra_points
					chapteres.topicdata[count-1].quiz_student_score['coordinates'] = topicstudentdata[qzi].coordinates
					chapteres.topicdata[count-1].quiz_student_score['quiz_advance_percentaje'] = topicstudentdata[qzi].quiz_advance_percentaje
					if((topicstudentdata[qzi].quiz_score >= 6 && topicstudentdata[qzi].quiz_finish==true)){
						chapteres["coordinatearre"].push(topicstudentdata[qzi].coordinates)
					}else if (topicstudentdata[qzi].attempts_succes==0 && topicstudentdata[qzi].attempts_fail >= 0 && topicstudentdata[qzi].quiz_finish==false){
						chapteres["coordinatearre"].push(topicstudentdata[qzi].coordinates)
					}
					if(topicstudentdata.length==forfin){
						var coorfin = chapteres["coordinatearre"].sort(function(a, b){return b-a})
						chapteres["coordinate"] = coorfin[0]
						callb({"resave":chapteres,"count":count})
					}
				}
			}else{
				callb({"resave":chapteres,"count":count})
			}
		})
	}


    /*
		Authors: asotopaez@gmail.com
		Name: activate_quiz
		Description: Function that activate quizes.
    */

    function activate_quiz(arrefinis,grade_current,callfinish){
    	var arrelen = arrefinis.topicdata.length
    	for (var x=0; x < arrelen; x++){
    		var forf = x+1
			var videoslenante = 0
			if(grade_current){
			 	if (x==0){
			 		videoslenante = arrefinis.topicdata[x].videos.length
			 		if(arrefinis.topicdata[x].videos[videoslenante-1].locked==false&&arrefinis.topicdata[x].videos[videoslenante-1].progress==100){
		    			arrefinis.topicdata[x].quiz[0].locked = false
			 		}
				}else{
					videoslenante = arrefinis.topicdata[x].videos.length
		    		if (arrefinis.topicdata[x-1].quiz_student_score.quiz_finish&&arrefinis.topicdata[x].videos[videoslenante-1].locked==false&&arrefinis.topicdata[x].videos[videoslenante-1].progress==100){
		        		arrefinis.topicdata[x].quiz[0].locked = false
		    		}
				}
			}else{
				arrefinis.topicdata[x].quiz[0].locked = false
			}
    		if(arrelen==forf){
    			callfinish({"resave":arrefinis})
    		}
    	}
    }

    /*
		Authors: asotopaez@gmail.com
		Name: activate_quiz
		Description: Function that activate videos.
    */

    function activate_video(arrefinis,student_id,grade_current,callfinish){
    	var StudentAdvanceToday = app.models.StudentAdvanceToday
		StudentAdvanceToday.find({where: {"or":arrefinis.arrevideos,"and": [{ "student_id":student_id }]}, order: "video_id"},function(err, videostudentdata){
    		var arrelen = arrefinis.topicdata.length
    		var coordinate = 0
 			for (var i = 0; i < arrelen; i++) {
 				var forf = i+1
 				var videoslen = arrefinis.topicdata[i].videos.length
 				
 				if(grade_current){
					if (i==0){
						if(arrefinis.topicdata[i].videos.length>0){
							arrefinis.topicdata[i].videos[0].locked = false
						}
					}
	 				for (var ii = 0; ii < videoslen; ii++){
	 					var foriifin = ii+1
	 					for (var iii = 0; iii < videostudentdata.length; iii++){
			 				var videostudent = String(videostudentdata[iii].video_id)
			 				var videotopic = String(arrefinis.topicdata[i].videos[ii].id)
			 				coordinate = videostudentdata[iii].coordinates
			 				if (videostudent==videotopic){
			 					var quizrequest = false
					    		arrefinis.topicdata[i].videos[ii].progress = videostudentdata[iii].progress
					    		
								if (i!=0){
									if(arrefinis.topicdata[i-1].quiz_student_score!=undefined){
										quizrequest = arrefinis.topicdata[i-1].quiz_student_score.quiz_finish
									}
								}else{
									if(foriifin==videoslen){
										if(arrefinis.topicdata[i].quiz_student_score!=undefined){
											quizrequest = arrefinis.topicdata[i].quiz_student_score.quiz_finish
										}
									}else{
										quizrequest = true
									}
								}

					    		if(arrefinis.topicdata[i].videos[ii+1] != undefined && quizrequest){
					    			arrefinis.topicdata[i].videos[ii+1].locked = false
					    		}else if(arrefinis.topicdata[i+1]!=undefined && quizrequest){
					    			if (arrefinis.topicdata[i+1].videos[0] != undefined ){
					    				arrefinis.topicdata[i+1].videos[0].locked = false
					    			}
					    		}
							}
	 					}
	 				}
 				}else{
 					for (var ii = 0; ii < videoslen; ii++){
           				arrefinis.topicdata[i].videos[ii].locked = false
          			}	
 				}
 				if(arrelen==forf){
 					delete arrefinis.arrevideos
    				callfinish({"resave":arrefinis,"coordinate":coordinate})
    			}
	 		}

		});
    }

    /*
		Authors: asotopaez@gmail.com
		Name: activate_quiz
		Description: Remote Method that list all contect related into the chapter.
    */

	Chapter.all_related = function(data, cb) {
		var chapter_id = data.chapter_id
		var student_id = data.student_id
		var numberquestion = data.numberquestion
		var grade_current = data.grade_current
		if (data.grade_current == undefined){
			grade_current = true
		}
		chapter_quiz_relations(chapter_id,numberquestion,function(chapteres){
			if(chapteres['error']!=undefined){
				cb(chapteres)
			}else{
			    var counth = []
			    var counthquiz = []
                var counthfin = []
				for (var ii=0;ii<chapteres.topicdata.length;ii++){
					counth.push(ii)
					var quizdata = chapteres.topicdata[ii].quiz
					var quizlen = quizdata.length
					for (var iii = 0; iii < quizlen ;iii ++){
						counthquiz.push(iii)
	 					var quiz_id = String(quizdata[iii].id)
						topic_quiz_average(chapteres,quiz_id,student_id,quizlen,counth,counthquiz,function(results){
							counthfin.push(results.count)
							if(chapteres.topicdata.length == counthfin.length){
								activate_video(results.resave,student_id,grade_current,function(videos_topics){
									if (videos_topics.coordinate > videos_topics.resave["coordinate"]){
										videos_topics.resave["coordinate"] = videos_topics.coordinate
									}
									delete videos_topics.resave["coordinatearre"]
									activate_quiz(videos_topics.resave,grade_current,function(quiz_topics){
										cb(null,quiz_topics.resave)
									});
								});
							}
						});	 					

					}
				}
			}
		})
    }

    Chapter.remoteMethod('all_related', {
    	  description: 'Get related information about Chapters ,Topics, Quizes, Students',
          accepts: {arg: 'data', type: 'object' , default: '{ "chapter_id": "string" , "student_id":"string" ."numberquestion":"number" }' , http: {source: 'body'}},
          returns: {arg: 'topics', type: 'objects'},
          http: {verb: 'post', path: '/all_related'}
    });




	//-----------------------------------------//
	//--ChaptersListAdvance(Functions block)--//
	//---------------------------------------//
    
    /*
		Authors: asotopaez@gmail.com
		Name: chapter_average
		Description: Funsion to unlock the chapters depending on the progress

    */
    function chapter_average(chapterdata,student_id,counth,callb){
        var ChapterStudentAdvance = app.models.ChapterStudentAdvance;
		var QuizStudentAdvance = app.models.QuizStudentAdvance;
    	var count = counth.length
        var chapter_score = 0
        chapterdata[count-1].average_score = 0
        chapterdata[count-1].progress = 0
        chapterdata[count-1].locked = true
        ChapterStudentAdvance.find({where: {"chapter_id": chapterdata[count-1].id,"student_id":student_id}},function(err, chapterstudentdata){
            var chapterslen = chapterstudentdata.length
           	QuizStudentAdvance.find({where: {"chapter_id": chapterdata[count-1].id,"student_id":student_id,"quiz_finish": true, "quiz_score": {"gte": 6 } } },function(err, topicislen){
                var topicislent = topicislen.length
                if (chapterslen>0&&topicislent>0){
                    chapterdata[count-1].progress = 100
                }
	            for(var iii = 0; iii < topicislent; iii++){
	                chapter_score += topicislen[iii].quiz_score
	                chapterdata[count-1].average_score = chapter_score/topicislent
	                chapterdata[count-1].locked = false    
	            }
            	callb({"resave":chapterdata,"count":count})
			});
        });
    }

    /*
		Authors: asotopaez@gmail.com
		Name: activate_chapter
		Description: This function activate the chapters depending on the progress

    */
    function activate_chapter(arrefinis,grade_current,callfinish){
    	var current = 0
    	for (var x=0; x < arrefinis.length; x++){
    		var forf = x+1
    		if(grade_current){			
			 	if (x==0){
		    		arrefinis[x].locked = false
		    		current = arrefinis[x].id
				}else{
		    		if (arrefinis[x-1].progress==100){
		        		arrefinis[x].locked = false
		        		current = arrefinis[x].id
		    		}
				}
    		}else{
				arrefinis[x].locked = false
    		}
    		if(arrefinis.length==forf){
    			callfinish({"resave":arrefinis,"current":current})
    		}
    	}
    }

    /*
		Authors: asotopaez@gmail.com
		Name: chapters_list_advance
		Description: Function that relates the chapters with the advances

    */
    function chapters_list_advance(subject_id,student_id,grade_current,callback){

        if(subject_id&&student_id){
            Chapter.find({where: {"subject_id": subject_id}},function(err, chapterdata){
                var counth = []
                var counthfin = []
                for (var ii = 0; ii < chapterdata.length; ii++) {
                    counth.push(ii)
                    chapter_average(chapterdata,student_id,counth,function(results){
                    	counthfin.push(results.count)
                        if (chapterdata.length == counthfin.length){
                        	activate_chapter(results.resave,grade_current,function(activates){
                            	callback({"chapters":activates.resave,"chapter_current":activates.current});
                        	})
                        }
                    })
                }
            })
        }else{
            callback({"error":"Enviar parametros correctos."})
        }
    }


    /*
		Authors: asotopaez@gmail.com
		Name: ChaptersListAdvance
		Description: Remote Method that list chapters and show advances
    */

	Chapter.ChaptersListAdvance = function(data, cb) {
		var subject_id = data.subject_id
		var student_id = data.student_id
		var grade_current = data.grade_current
		if (data.grade_current==undefined){
			grade_current = true
		}
		chapters_list_advance(subject_id,student_id,grade_current,function(chapterres){
			if(chapterres['error']!=undefined){
				cb(chapterres)
			}else{
				cb(null,chapterres)
			}
		});

    }

    Chapter.remoteMethod('ChaptersListAdvance',{
    	  description: 'Get information about chapters and advance related with student.',
          accepts: {arg: 'data', type: 'object' , default: '{ "subject_id": "string" , "student_id":"string" }' , http: {source: 'body'}},
          returns: [{arg: 'chapters_list', type: 'objects'},{arg: 'current', type: 'objects'}],
          http: {verb: 'post', path: '/ChaptersListAdvance'}
    });

    
};
