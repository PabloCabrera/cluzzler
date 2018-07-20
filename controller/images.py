import os
import json
from os.path import dirname

def list (env, start_request):
	images = {}
	imgdir = dirname(dirname(os.path.abspath(__file__))) + "/images"
	dirs = os.listdir (imgdir) 
	for dir in dirs:
		files = os.listdir ("%s/%s" % (imgdir, dir))
		group = []
		images[dir] = group
		for file in files:
			group.append ("%s/%s" % (dir, file))
	
	start_request ("200 OK", [("Content-Type", "application/json")])
	return json.dumps (images)
