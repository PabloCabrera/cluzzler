class CellAnalyzer:
	def __init__ (analyzer):
		analyzer.metricFunctions = {}
		analyzer.metricWeights = {}
		analyzer.multiMetricFunctions = []

	def analyze (analyzer, cell):
		results = {}

		functions = analyzer.metricFunctions.keys()

		for function_name in functions:
			if (function_name in analyzer.metricFunctions):
				function = analyzer.metricFunctions[function_name]
				metric = function (cell)
				weight = analyzer.metricWeights[function_name] 
				results[function_name] = weight * metric
			else:
				print "Warning: Function '%s' not found" % function_name

		for function in analyzer.multiMetricFunctions:
			metrics = function (cell)
			results.update (metrics)

		return results

	def setMetric (analyzer, metric_name, metric_function, metric_weight=1):
		analyzer.metricFunctions[metric_name] = metric_function
		analyzer.metricWeights[metric_name] = metric_weight

	def addMultiMetric (analyzer, multimetric_function):
		analyzer.multiMetricFunctions.append (multimetric_function)

	def setMetricWeight (analyzer, metric_name, metric_weight):
		analyzer.metricWeights[metric_name] = metric_weight
