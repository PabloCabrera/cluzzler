# -*- coding: utf-8 -*-
import sys, os, json
_wsgi_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
for subdir in ["base", "controller"]:
	_include_path = os.path.join (_wsgi_path, subdir)
	if _include_path not in sys.path:
		sys.path.append (_include_path)

from WebRedirector import WebRedirector

def example_controller (environ, start_response):
	output = "<h1>Hola mundo redirector</h1><p>Desde Python</p>"
	for variable in environ:
		output += "<dl><dt>%s</dt><dd>%s</dd></dl>" % (variable, environ[variable])
	output += "<h3>sys.path</h3><ul>"
	for path in sys.path:
		output += "<li>%s</li>" % path
	output += "</ul>"
	start_response ("200 ok", [("Content-Type", "text/html; charset=utf-8")])
	return output

def application (environ, start_response):
	redirector = WebRedirector.get_instance ()
	print ("redirector: %s" % redirector);
	return redirector.redirect (environ, start_response)
