import sys

def info (environ, start_response):
	output = "<h1>WSGI INFO</h1>"
	for variable in environ:
		output += "<dl><dt>%s</dt><dd>%s</dd></dl>" % (variable, environ[variable])
	output += "<h3>sys.path</h3><ul>"
	for path in sys.path:
		output += "<li>%s</li>" % path
	output += "</ul>"
	start_response ("200 ok", [("Content-Type", "text/html; charset=utf-8")])
	return output

