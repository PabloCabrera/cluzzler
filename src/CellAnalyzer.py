class CellAnalyzer:
	def __init__ (analyzer):
		analyzer.metricFunctions = {}
		analyzer.multiMetricFunctions = []

	def analyze (analyzer, cell):
		results = {}

		functions = analyzer.metricFunctions.keys()

		for function_name in functions:
			if (function_name in analyzer.metricFunctions):
				function = analyzer.metricFunctions[function_name]
				metric = function (cell)
				results[function_name] = metric
			else:
				print "Warning: Function '%s' not found" % function_name

		for function in analyzer.multiMetricFunctions:
			metrics = function (cell)
			results.update (metrics)

		return results

	def setMetric (analyzer, metric_name, metric_function):
		analyzer.metricFunctions[metric_name] = metric_function

	def addMultiMetric (analyzer, multimetric_function):
		analyzer.multiMetricFunctions.append (multimetric_function)
