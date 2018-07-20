import os
import cgi
import json

from Cell import Cell
from TestAnalyzer import TestAnalyzer
from CellDescriptor import CellDescriptor

from os import listdir
from os.path import dirname

from PIL import Image
from numpy import empty
from sklearn.cluster import DBSCAN

def process (env, response):

	metrics_cluster = [
		"mean_r", "mean_g", "mean_b",
		#"min_r", "min_g", "min_b",
		#"max_r", "max_g", "max_b",
		"min_hue", "max_hue",
		# "pos_x", "pos_y",
		#"seq_diff"
		"ascending_right", "ascending_left",
		"ascending_down", "ascending_up"
	]


	request = cgi.parse_qs (env["QUERY_STRING"])
	cell_size = int (request ["cell_size"][0])
	filename = request ["filename"][0]

	analyzer = TestAnalyzer ()
	image = load_image (filename)
	cells = get_cells (image, cell_size)
	cluster_data = empty (shape=(len(cells), len(metrics_cluster)))
	cell_row = 0
	for cell in cells:
		metrics = analyzer.analyze (cell)
		for col in xrange (0, len (metrics_cluster)):
			cluster_data [cell_row, col] = metrics[metrics_cluster[col]]
		cell_row += 1

	print ("Clustering %i cells  (%s)" % (len (cells), filename))
	#centroids, groups = kmeans2 (cluster_data, 8)
	db = DBSCAN(eps=0.1, min_samples=3).fit(cluster_data)
	groups = []
	for label in db.labels_:
		groups.append (label+1)
	num_clusters = max (groups)
	print ("Found %i clusters" % num_clusters)
	info = get_clustering_info (groups, cells, filename, image)

	response ("200 OK", [("Content-Type", "text/json")]);
	return json.dumps (info)

def load_image (filename):
	prefix = dirname(dirname(os.path.abspath(__file__))) + "/images"

	image = Image.open ("%s/%s" % (prefix, filename))
	print ("%s [%i x %i]" % (filename, image.size[0], image.size[1]))
	return image

def get_clustering_info (groups, cells, input_filename, image):
	gen = {}
	num_clusters = max (groups)
	cell_width = cells[0].w
	cell_height = cells[0].h
	image_width = image.size[0]
	image_height = image.size[1]

	gen["num_clusters"] = num_clusters;
	gen["cell_width"] = cell_width;
	gen["cell_height"] = cell_height;
	gen["image_width"] = image_width;
	gen["image_height"] = image_height;
	gen["groups"] = groups

	return gen

def get_cells (image, cell_size):
	cells = []
	width, height = image.size
	offset_x, offset_y = (0, 0)
	while (offset_y < height):
		offset_x = 0
		while (offset_x < width):
			cell = Cell (image, offset_x, offset_y, cell_size)
			cells.append (cell)
			offset_x += cell_size
		offset_y += cell_size
	return cells


