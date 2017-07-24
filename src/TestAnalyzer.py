from CellAnalyzer import CellAnalyzer
from metrics import *

class TestAnalyzer (CellAnalyzer):
	def __init__ (analyzer):
		CellAnalyzer.__init__ (analyzer)
		#analyzer.setMetric ("mean_r", mean_r)
		#analyzer.setMetric ("mean_g", mean_g)
		#analyzer.setMetric ("mean_b", mean_b)
		#analyzer.setMetric ("med_r", med_r)
		#analyzer.setMetric ("med_g", med_g)
		#analyzer.setMetric ("med_b", med_b)
		analyzer.setMetric ("seq_diff", seq_diff)
		#analyzer.setMetric ("min_r", min_r)
		#analyzer.setMetric ("min_g", min_g)
		#analyzer.setMetric ("min_b", min_b)
		#analyzer.setMetric ("max_r", max_r)
		#analyzer.setMetric ("max_g", max_g)
		#analyzer.setMetric ("max_b", max_b)
		analyzer.setMetric ("pos_x", pos_x)
		analyzer.setMetric ("pos_y", pos_y)
		analyzer.setMetric ("min_hue", min_hue)
		analyzer.setMetric ("max_hue", max_hue)
		#analyzer.addMultiMetric (mean_rgb) # Este tarda mas

