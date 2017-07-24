class CellDescriptor:
	def __init__ (descriptor, cell):
		descriptor.cell = cell
		descriptor.metrics = {}

	def setMetrics (descriptor, metrics):
		descriptor.metrics = metrics

	def setMetric (descriptor, metric_name, metric_value):
		descriptor.metrics[metric_name] = metric_value

	def getMetrics (descriptor):
		return descriptor.metrics

	def getCell (descriptor):
		return descriptor.cell
