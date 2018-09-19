'use strict'
module.exports = function(app){
	var models = ['User','AccessToken','ACL','RoleMapping','Role','CustomerUser','Student','TypeCustomer','StatusCustomer','CreditCardCustomer','Bank','ZipCode','School','Level','Chapter','ChapterStudentAdvance','Video','Exam','Quiz','Grade','Subject','Topic','TypeOfExam','SubjectExamStudentAdvance','QuizStudentAdvance','AccountPlan','TypeOfCard','StudentAdvanceToday']
	app.dataSources.mongodb.autoupdate(models, err=> {
		if (err) throw err;
		console.log("Models Synced!");
	})
}
