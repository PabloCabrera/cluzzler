# -*- coding: utf-8 -*-
import re, os, sys, json

def _controller_404 (environ, start_response):
	start_response ("404 Not Found", [("Content-Type", "text/html; charset=utf-8")])
	return ["404 Not Found"]

class WebRedirector:
	instance = None

	@staticmethod
	def get_instance ():
		if WebRedirector.instance is None:
			WebRedirector.instance = WebRedirector()
		return WebRedirector.instance

	def __init__ (redirector):
		redirector.controllers = {}
		redirector.default_controller = _controller_404
		current_dir = os.path.dirname (os.path.realpath (__file__))
		for directory in [current_dir, os.path.dirname (current_dir)]:
			json_filename = os.path.join (directory, "routes.json")
			if (os.path.isfile (json_filename)):
				redirector.add_routes_from_json (json_filename)

	def add_routes_from_json (redirector, json_file):
		with open (json_file) as data_file:
			routes = json.load (data_file)
		for route in routes:
			controller_name = routes[route].split(".")
			module_name = controller_name[0] 
			function_name = controller_name[1] 
			module = __import__ (module_name)
			controller = getattr (module, function_name)
			redirector.add_route (route, controller)

	def add_route (redirector, route, controller):
		print "Agregar ruta [%s] -> [%s]" % (route, controller)
		enclosed_regex = "^/?%s/?$" % route
		print "regex: [%s]" % enclosed_regex
		redirector.controllers[enclosed_regex] = controller

	def set_default_controller (redirector, controller):
		redirector.default_controller = controller

	def redirect (redirector, environ, start_response):
		controller = redirector.default_controller
		print "[DEBUG] Actualmente hay %d rutas " % len(redirector.controllers)
		print "[DEBUG] PATH_INFO=%s " % environ["PATH_INFO"]
		for route in redirector.controllers:
			if re.match (route, environ["PATH_INFO"]):
				print ("match: %s" % route)
				controller = redirector.controllers[route]
		output = controller (environ, start_response)
		return output


		
