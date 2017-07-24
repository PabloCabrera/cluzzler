class Cell:
	cells_count = 0
	def __init__ (cell, image_full, x, y, w, h=None, descriptor=None):
		Cell.cells_count += 1
		cell.id = Cell.cells_count
		cell.image_full = image_full
		cell.x, cell.y, cell.w, cell.h = (x, y, w, h)
		if (cell.h is None):
			cell.h = w
		cell.descriptor = descriptor
		if (descriptor is None):
			cell.descriptor = {}
		if (cell.x + cell.w >= cell.image_full.size[0]):
			cell.w = cell.image_full.size[0] - cell.x -1
		if (cell.y + cell.h >= cell.image_full.size[1]):
			cell.h = cell.image_full.size[1] - cell.y -1
		
		cell.image = image_full.crop ((cell.x, cell.y, cell.x+cell.w, cell.y+cell.h))

	def save (cell, filename):
		cell.image.save(filename)
