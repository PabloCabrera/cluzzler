import os
import cgi
import json
import metrics

from Cell import Cell
from CellAnalyzer import CellAnalyzer
from CellDescriptor import CellDescriptor

from os import listdir
from os.path import dirname
from inspect import getmembers, isfunction
from collections import OrderedDict

from PIL import Image
from numpy import empty
from sklearn.cluster import DBSCAN
from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.vq import kmeans2

def process (env, response):

	request = cgi.parse_qs (env["QUERY_STRING"])
	metrics_cluster = get_requested_metrics (request)
	store_preset (request)

	cell_size = int (request ["cell_size"][0])
	filename = request ["filename"][0]
	algorithm = request ["algorithm"][0]
	algorithm_params = {}
	if (algorithm == "kmeans"):
		algorithm_params["k"] = int (request ["kmeans_k"][0])
		algorithm_params["init"] = request ["kmeans_init"][0]
	elif (algorithm == "dbscan"):
		algorithm_params["eps"] = float (request ["dbscan_eps"][0])
		algorithm_params["min_samples"] = int (request ["dbscan_min_samples"][0])
	elif (algorithm == "agglomerative"):
		algorithm_params["n_clusters"] = int (request ["agglomerative_n_clusters"][0])
		algorithm_params["linkage"] = request ["agglomerative_linkage"][0]
		

	analyzer = CellAnalyzer ()
	image = load_image (filename)
	cells = get_cells (image, cell_size)
	cluster_data = empty (shape=(len(cells), len(metrics_cluster)))
	cell_row = 0

	for metric_name in metrics_cluster:
		metric_weight = metrics_cluster[metric_name]
		analyzer.setMetric (metric_name, getattr (metrics, metric_name), metric_weight)

	for cell in cells:
		calculated = analyzer.analyze (cell)
		col = 0

		for metric_name in metrics_cluster:
			cluster_data [cell_row, col] = calculated[metric_name]
			col += 1
		cell_row += 1

	if (algorithm == "kmeans"):
		groups = cluster_kmeans (cluster_data, algorithm_params["k"], algorithm_params["init"])
	elif (algorithm == "dbscan"):
		groups = cluster_dbscan (cluster_data, algorithm_params["eps"], algorithm_params["min_samples"])
	elif (algorithm == "agglomerative"):
		groups = cluster_agglomerative (cluster_data, algorithm_params["n_clusters"], algorithm_params["linkage"])

	num_clusters = max (groups)
	info = get_clustering_info (groups, cells, filename, image)

	response ("200 OK", [("Content-Type", "text/json")]);
	return json.dumps (info)

def cluster_dbscan (data, param_eps, param_min_samples):
	db = DBSCAN (eps=param_eps, min_samples=param_min_samples).fit(data)
	groups = []
	for label in db.labels_:
		groups.append (label)
	return groups

def cluster_kmeans (data, k, init):
	centroids, labels = kmeans2 (data, k=k, minit=init)
	groups = []
	for label in labels:
		groups.append (label+1)
	return groups

def cluster_agglomerative (data, param_n_clusters, param_linkage):
	agg = AgglomerativeClustering (n_clusters=param_n_clusters, linkage=param_linkage).fit(data)
	groups = []
	for label in agg.labels_:
		groups.append (label)
	return groups


def get_requested_metrics (request):
	requested = OrderedDict () # Debe ser ordenado

	for member in getmembers (metrics):
		metric_name = member[0]
		metric_function = member[1]
		if isfunction (metric_function) and (metric_name in request) and (metric_function.func_doc is not None):
			requested[metric_name] = float (request[metric_name][0])

	return requested



def load_image (filename):
	prefix = dirname(dirname(os.path.abspath(__file__))) + "/images"

	image = Image.open ("%s/%s" % (prefix, filename))
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

def store_preset (request):
	preset_dir = dirname(dirname(os.path.abspath(__file__))) + "/preset"
	basename = os.path.basename (request["filename"][0])
	filename = "%s/%s.json" % (preset_dir, basename)
	store_vars = {}
	file = open (filename, "w")
	for key in request:
		store_vars[key] = request[key][0];
	file.write (json.dumps (store_vars))
	file.close ()

