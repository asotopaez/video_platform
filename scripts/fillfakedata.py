#!/usr/bin/python
import time
import json
import os
import csv
from pymongo import MongoClient
from bson.objectid import ObjectId

#uri = "mongodb://AdminTabbeProyect:AdminTabbe777@localhost:3333/video_platform_db"
uri = "mongodb://localhost:27017/video_platform_db"
conexion = MongoClient(uri)
dbs = conexion.video_platform_db
def preparedata():
	gradosjson = {}
	grados = dbs.Grade.find({"level_id":ObjectId("599631b67665d332476b654f")})
	#grados = dbs.Grade.find({"level_id":ObjectId("5993ca67faed2e314145f2d2")})
	
	for grado in grados:
		gradosjson[grado['name']] = grado['_id']
	with open('scripts/fillfake.csv', 'rb') as csvfile:
		spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
		lines = 0
		for row in spamreader:
			if lines!=0:
				grade = gradosjson[row[0]]
				subject = dbs.Subject.find_one({"grade_id":grade,"name":row[1]},{"_id":1})['_id']
				chapter = dbs.Chapter.find_one({"subject_id":subject,"title":row[2]},{"_id":1})
				if chapter is None:
					chapternew = dbs.Chapter.save({"subject_id":subject,"title":row[2],"activate":True})
					topic = dbs.Topic.find_one({"chapter_id":chapternew,"title":row[3]},{"_id":1})
					if topic is None:
						topicnew = dbs.Topic.save({ "chapter_id":chapternew, "title":row[3], "description":row[4], "objetive":row[5], "teacher_name":row[6], "url_demo":row[7] , "demo": False, "activate":True })
						video = dbs.Video.save({"topic_id":topicnew,"title":row[8],"url_video":row[9],"wistia_hash":row[10],"progress": 0,"locked": True, "activate": True})
						quiz = dbs.Quiz.save({"topic_id":topicnew,"title":row[11],"star_required":int(row[12]),"questions":row[13],"description":row[14],"subtitle":row[15],"estimatedMaxTime":int(row[16]),"locked": True, "activate": True})
					else:
						video = dbs.Video.save({"topic_id":topic['_id'],"title":row[8],"url_video":row[9],"wistia_hash":row[10],"progress": 0,"locked": True, "activate": True})
						quiz = dbs.Quiz.save({"topic_id":topic['_id'],"title":row[11],"star_required":int(row[12]),"questions":row[13],"description":row[14],"subtitle":row[15],"estimatedMaxTime":int(row[16]),"locked": True, "activate": True})
				else:
					topic = dbs.Topic.find_one({"chapter_id":chapter['_id'],"title":row[3]},{"_id":1})
					if topic is None:
						topicnew = dbs.Topic.save({ "chapter_id":chapter['_id'], "title":row[3], "description":row[4], "objetive":row[5], "teacher_name":row[6], "url_demo":row[7] , "demo": False, "activate":True })
						video = dbs.Video.save({"topic_id":topicnew,"title":row[8],"url_video":row[9],"wistia_hash":row[10],"progress": 0,"locked": True, "activate": True})
						quiz = dbs.Quiz.save({"topic_id":topicnew,"title":row[11],"star_required":int(row[12]),"questions":row[13],"description":row[14],"subtitle":row[15],"estimatedMaxTime":int(row[16]),"locked": True, "activate": True})
					else:
						video = dbs.Video.save({"topic_id":topic['_id'],"title":row[8],"url_video":row[9],"wistia_hash":row[10],"progress": 0,"locked": True, "activate": True})
						quiz = dbs.Quiz.save({"topic_id":topic['_id'],"title":row[11],"star_required":int(row[12]),"questions":row[13],"description":row[14],"subtitle":row[15],"estimatedMaxTime":int(row[16]),"locked": True, "activate": True})
			lines+=1

	return "ok"

print preparedata()