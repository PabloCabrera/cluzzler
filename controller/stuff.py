import os
import json
import metrics
from os.path import dirname
from inspect import getmembers, isfunction
from collections import OrderedDict

def all (env, start_request):
	imgdir = dirname(dirname(os.path.abspath(__file__))) + "/images"
	stuff = {}
	stuff["images"] =  get_images (imgdir)
	stuff["presets"] =  get_presets (imgdir)
	stuff["metrics"] =  get_metrics ()
	start_request ("200 OK", [("Content-Type", "application/json")])

	return json.dumps (stuff)

def get_images (imgdir):
	images = {}
	dirs = os.listdir (imgdir) 

	for dir in dirs:
		files = os.listdir ("%s/%s" % (imgdir, dir))
		group = []
		images[dir] = group
		for file in files:
			group.append ("%s/%s" % (dir, file))
	
	return images

def get_metrics ():
	metric_list = OrderedDict ()
	for member in getmembers (metrics):
		metric_name = member[0]
		metric_function = member[1]
		if isfunction (metric_function) and metric_function.func_doc is not None:
			metric_list [metric_name] = metric_function.func_doc

	return metric_list

def get_presets (imgdir):
	presets = {}
	dirs = os.listdir (imgdir) 
	for dir in dirs:
		files = os.listdir ("%s/%s" % (imgdir, dir))
		for file in files:
			presets[file] = get_preset (file);

	return presets
			
def get_preset (img_name):
	preset_dir = dirname(dirname(os.path.abspath(__file__))) + "/preset"
	filename = "%s/%s.json" % (preset_dir, img_name)
	if os.path.isfile (filename):
		file = open (filename, "r")
		preset = json.loads(file.read())
		preset.pop ("filename")
		file.close ()
		return  (preset)
	else:
		return {}



