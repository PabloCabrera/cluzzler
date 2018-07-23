import json
import metrics
from inspect import getmembers, isfunction
from collections import OrderedDict

def list (env, response):
	metric_list = OrderedDict ()
	for member in getmembers (metrics):
		metric_name = member[0]
		metric_function = member[1]
		if isfunction (metric_function) and metric_function.func_doc is not None:
			metric_list [metric_name] = metric_function.func_doc

	response ("200 OK", [("Content-Type", "text/json; encoding: utf-8")])
	return json.dumps (metric_list)
