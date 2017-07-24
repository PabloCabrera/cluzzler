import operator
from colorsys import rgb_to_hls

def mean_r (cell):
	total = 0
	data = cell.image.getdata()
	num_elems = len (data)
	for pixel in data:
		total += pixel [0]
	total = float (total) / (256 * num_elems)
	return total

def mean_g (cell):
	total = 0
	data = cell.image.getdata()
	num_elems = len (data)
	for pixel in data:
		total += pixel [1]
	total = float (total) / (256 * num_elems)
	return total

def mean_b (cell):
	total = 0
	data = cell.image.getdata()
	num_elems = len (data)
	for pixel in data:
		total += pixel [2]
	total = float (total) / (256 * num_elems)
	return total

def min_r (cell):
	minimum = 255 
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[0] < minimum):
			minimum = pixel[0]
	return float (minimum) / 255

def min_g (cell):
	minimum = 255 
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[1] < minimum):
			minimum = pixel[1]
	return float (minimum) / 255

def min_b (cell):
	minimum = 255 
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[2] < minimum):
			minimum = pixel[2]
	return float (minimum) / 255

def max_r (cell):
	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[0] > maximum):
			maximum = pixel[0]
	return float (maximum) / 255

def max_g (cell):
	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[1] > maximum):
			maximum = pixel[1]
	return float (maximum) / 255

def max_b (cell):
	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[2] > maximum):
			maximum = pixel[2]
	return float (maximum) / 255

def med_r (cell):
	return float (max_r (cell) - min_r (cell)) / 2

def med_g (cell):
	return float (max_g (cell) - min_g (cell)) / 2

def med_b (cell):
	return float (max_b (cell) - min_b (cell)) / 2

def seq_diff (cell):
	diff = 0
	previous = (0, 0, 0)
	data = cell.image.getdata()
	num_pixels = len (data)
	for pixel in data:
		for channel in (0, 1, 2):
			diff += abs (previous[channel] - pixel[channel])
		previous = pixel
	return float (diff) / (3 * 10 * num_pixels) # 10 deberia ser 255, pero esta escalado para dar mas amplitud

def pos_x (cell):
	return float (cell.x + cell.w/2) / cell.image_full.size[0]

def pos_y (cell):
	return float (cell.y + cell.h/2) / cell.image_full.size[1]

def min_hue (cell):
	minimum = 255
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[0] * pixel[1] * pixel[2] != 0):
			hls = rgb_to_hls (*pixel)
			if (hls[1] < minimum):
				minimum = hls[1]
	return float (minimum) / 255

def max_hue (cell):
	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[0] * pixel[1] * pixel[2] != 0):
			hls = rgb_to_hls (*pixel)
			if (hls[1] >maximum):
				maximum = hls[1]
	return float (maximum) / 255

def mean_rgb (cell):
	# Multi Metric, returns dict
	total = [0, 0, 0]
	data = cell.image.getdata()
	num_elems = len (data)
	for pixel in data:
		total = map (operator.add, total, pixel)

	for n in (0, 1, 2):
		total[n] = float (total[n]) / (256 * num_elems)

	results = {
		"R": total[0],
		"G": total[1],
		"B": total[2]
	}

	return results

