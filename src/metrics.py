# coding=utf-8

import operator
from colorsys import rgb_to_hls

def mean_r (cell):
	"""Intensidad media de rojo"""

	total = 0
	data = cell.image.getdata()
	num_elems = len (data)
	for pixel in data:
		total += pixel [0]
	total = float (total) / (255 * num_elems)
	return total

def mean_g (cell):
	"""Intensidad media de verde"""

	total = 0
	data = cell.image.getdata()
	num_elems = len (data)
	for pixel in data:
		total += pixel [1]
	total = float (total) / (255 * num_elems)
	return total

def mean_b (cell):
	"""Intensidad media de azul"""

	total = 0
	data = cell.image.getdata()
	num_elems = len (data)
	for pixel in data:
		total += pixel [2]
	total = float (total) / (255 * num_elems)
	return total

def min_r (cell):
	#"""Intensidad mínima de rojo"""

	minimum = 255 
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[0] < minimum):
			minimum = pixel[0]
	return float (minimum) / 255

def min_g (cell):
	#"""Intensidad mínima de verde"""

	minimum = 255 
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[1] < minimum):
			minimum = pixel[1]
	return float (minimum) / 255

def min_b (cell):
	#"""Intensidad mínima de azul"""

	minimum = 255 
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[2] < minimum):
			minimum = pixel[2]
	return float (minimum) / 255

def max_r (cell):
	#"""Intensidad máxima de rojo"""
	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[0] > maximum):
			maximum = pixel[0]
	return float (maximum) / 255

def max_g (cell):
	#"""Intensidad máxima de verde"""
	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[1] > maximum):
			maximum = pixel[1]
	return float (maximum) / 255

def max_b (cell):
	#"""Intensidad máxima de azul"""

	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		if (pixel[2] > maximum):
			maximum = pixel[2]
	return float (maximum) / 255

def med_r (cell):
	#"""Intensidad mediana de rojo"""

	return float (max_r (cell) - min_r (cell)) / 2

def med_g (cell):
	#"""Intensidad mediana de verde"""
	return float (max_g (cell) - min_g (cell)) / 2

def med_b (cell):
	#"""Intensidad mediana de azul"""

	return float (max_b (cell) - min_b (cell)) / 2

def seq_diff (cell):
	"""Diferencia absoluta entre píxeles consecutivos"""

	diff = 0
	previous = (0, 0, 0)
	data = cell.image.getdata()
	num_pixels = len (data)
	for pixel in data:
		for channel in (0, 1, 2):
			diff += abs (previous[channel] - pixel[channel])
		previous = pixel
	return float (diff) / (3 * 255 * num_pixels)

def pos_x (cell):
	"""Posición horizontal"""

	return float (cell.x + cell.w/2) / cell.image_full.size[0]

def pos_y (cell):
	"""Posición vertical"""

	return float (cell.y + cell.h/2) / cell.image_full.size[1]

def min_hue (cell):
	#"""Hue minimo"""

	minimum = 255
	data = cell.image.getdata()
	for pixel in data:
		hls = rgb_to_hls (*pixel)
		if (hls[0] < minimum):
			minimum = hls[0]
	return float (minimum) / 255

def max_hue (cell):
	#"""Hue maximo"""

	maximum = 0
	data = cell.image.getdata()
	for pixel in data:
		hls = rgb_to_hls (*pixel)
		if (hls[0] >maximum):
			maximum = hls[0]
	return float (maximum) / 255

def mean_hue (cell):
	"""Hue promedio"""
	data = cell.image.getdata()
	hue_sum = float(0)

	for pixel in data:
		hls = rgb_to_hls (float(pixel[0])/255, float(pixel[1])/255, float(pixel[2])/255)
		hue_sum += hls[0]
	return float (hue_sum) / len(data)

def mean_lum (cell):
	"""Luminosidad promedio"""
	data = cell.image.getdata()
	lum_sum = float(0)

	for pixel in data:
		hls = rgb_to_hls (float(pixel[0])/255, float(pixel[1])/255, float(pixel[2])/255)
		lum_sum += hls[1]
	return float (lum_sum) / len(data)

def mean_saturation (cell):
	"""Saturación promedio"""
	data = cell.image.getdata()
	sat_sum = float(0)

	for pixel in data:
		hls = rgb_to_hls (float(pixel[0])/255, float(pixel[1])/255, float(pixel[2])/255)
		sat_adjusted = hls[2] * (1- 2 * abs (0.5 - hls[1]))
		sat_sum += sat_adjusted
	return float (sat_sum) / len(data)


def mean_rgb (cell):
	#"""Media RGB (multimetric)"""

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

def ascending_left (cell):
	#"""Aumento de luminosidad hacia izquierda"""

	total = 0
	pixels = cell.image.getdata()
	num_pixels = len(pixels)

	for n in xrange(0, len(pixels)):
		lum_actual = (max(*pixels[n]) -  min(*pixels[n]))/2
		lum_prev = (max(*pixels[n-1]) - min(*pixels[n-1]))/2
		if ((n % cell.w) != 0) and (lum_prev > lum_actual):
			total += (lum_prev - lum_actual)

	return total / num_pixels

def ascending_right (cell):
	#"""Aumento de luminosidad hacia derecha"""

	total = 0
	pixels = cell.image.getdata()
	num_pixels = len(pixels)

	for n in xrange(0, len(pixels)):
		lum_actual = (max(*pixels[n]) -  min(*pixels[n]))/2
		lum_prev = (max(*pixels[n-1]) - min(*pixels[n-1]))/2
		if ((n % cell.w) != 0) and (lum_actual > lum_prev):
			total += (lum_actual - lum_prev)

	return total / num_pixels

def ascending_down (cell):
	#"""Aumento de luminosidad hacia abajo"""

	total = 0
	pixels = cell.image.getdata()
	num_pixels = len(pixels)

	for n in xrange(cell.w, len(pixels)):
		lum_actual = (max(*pixels[n]) -  min(*pixels[n]))/2
		lum_prev = (max(*pixels[n-cell.w]) - min(*pixels[n-cell.w]))/2
		if (lum_actual > lum_prev):
			total += (lum_actual - lum_prev)

	return total / num_pixels

def ascending_up (cell):
	#"""Aumento de luminosidad hacia arriba"""

	total = 0
	pixels = cell.image.getdata()
	num_pixels = len(pixels)

	for n in xrange(cell.w, len(pixels)):
		lum_actual = (max(*pixels[n]) -  min(*pixels[n]))/2
		lum_prev = (max(*pixels[n-cell.w]) - min(*pixels[n-cell.w]))/2
		if (lum_prev > lum_actual):
			total += (lum_prev - lum_actual)

	return total / num_pixels






