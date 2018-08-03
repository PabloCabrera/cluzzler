DOT_COLORS = [
	'#ef2929', '#fce94f', '#8ae234', '#729fcf', '#ad7fa8', '#fcaf3e', '#eeeeec', '#888a85', '#e9b96e',
	'#cc0000', '#edd400', '#73d216', '#3465a4', '#75507b', '#f57900', '#d3d7cf', '#555753', '#c17d11',
	'#a40000', '#c4a000', '#4e9a06', '#204a87', '#5c3566', '#ce5c00', '#babdb6', '#2e3436', '#8f5902'
];
DOT_COLORS[-1]='#444444'; // -1 for dbscan noisy points


function init () {
	M.AutoInit();
	var modal = document.querySelector(".modal_loading");
	M.Modal.init(modal);
	load_stuff ();
	adjust_canvas_size ();
	set_canvas_mouse_listener ();
	update_algorithm_controls ();
	window.addEventListener ("resize", redraw_image); 
}

function load_stuff () {
	var xhr = new XMLHttpRequest();
	xhr.open ("GET", "stuff");
	xhr.onload = on_load_stuff_success;
	xhr.send();
}

function on_load_stuff_success (evt) {
	var stuff = JSON.parse (evt.target.responseText);
	PRESETS = stuff ["presets"];
	create_image_options (stuff ["images"]);
	create_metric_controls (stuff ["metrics"]);
	update_algorithm_controls ();
	update_image ();
}

function create_image_options (groups) {
	var group_names = Object.keys (groups)
	var select = document.querySelector ("select[name=imagefile]");
	select.textContent = ""
	group_names.forEach (function (name) {
		var optgroup = document.createElement ("OPTGROUP");
		select.appendChild (optgroup);
		optgroup.label =  name.charAt(0).toUpperCase() + name.slice(1);
		for (var i = 0; i < groups[name].length; i++) {
			var elem = groups[name][i];
			var option = document.createElement ("OPTION");
			var display_name = elem.replace(/.*\//, "").replace(/\.(jpe?g|png|gif)$/i, "").replace ("_", " ")
			optgroup.appendChild (option);
			option.value = elem;
			option.textContent = display_name;
		}
	});
	M.FormSelect.init(select)
}

function load_preset () {
	var select = document.querySelector ("select[name=imagefile]");
	var basename = select.value.replace (/.*\//, "");

	if (typeof (PRESETS[basename]) == "undefined") {
		basename = "default";
	}

	var items = document.querySelectorAll (".preseteable");
	items.forEach (function (item) {
		if (typeof (PRESETS[basename][item.name]) != "undefined") {
			item.value = PRESETS[basename][item.name];
			if (item.tagName == "SELECT") {
				M.FormSelect.init(item);
			}
		} else if (item.classList.contains ("metric_range"))  {
			item.value = 0;
		}
	});
}

function save_preset () {
	var select = document.querySelector ("select[name=imagefile]");
	var basename = select.value.replace (/.*\//, "");
	var preset = {};
	var items = document.querySelectorAll (".preseteable");
	items.forEach (function (item) {
		if (item.name != "") {
			preset[item.name] = item.value;
		}
	});
	PRESETS[basename] = preset;
}

function create_metric_controls (metrics) {
	var metric_names = Object.keys (metrics)
	metric_names.forEach (function (metric_name) {
		var metric_description = metrics[metric_name];
		var control = create_metric_control (metric_name, metric_description)
		append_control_to_ui (control);
	});
}

function create_metric_control (name, description) {
	var template = document.querySelector (".control_template");
	var control = template.cloneNode (true);
	control.classList.remove ("hide");
	control.classList.remove ("control_template");
	var input = control.querySelector ("input.metric_range");
	input.name = name;
	var name_text = control.querySelector ("label .name");
	var description_text = control.querySelector ("label .description");
	name_text.textContent = "[" + name + "]";
	description_text.textContent = description;
	return control;
}

function append_control_to_ui (control) {
	var container = document.querySelector (".controls_container");
	container.appendChild (control);
}

function adjust_canvas_size () {
	var canvas = document.querySelector ("canvas.demo_canvas");
	canvas.width = canvas.parentNode.clientWidth;
	canvas.height = canvas.parentNode.clientHeight - 10;
}

function set_canvas_mouse_listener () {
	var canvas = document.querySelector ("canvas.demo_canvas");
	var context = canvas.getContext ("2d");
	canvas.addEventListener ("mousemove", function (evt) {
		var rect = canvas.getBoundingClientRect ();
		var x = (evt.clientX - rect.left) / canvas.dataset.scaled_x - canvas.dataset.translated_x;
		var y = (evt.clientY - rect.top) / canvas.dataset.scaled_y - canvas.dataset.translated_y;
		canvas_mouse (x, y, context);
	});
	canvas.addEventListener ("mouseout", function (evt) {
		if ((typeof (CLUSTER_DATA) == "object") && (CLUSTER_DATA != null)) {
			draw_clusters (CLUSTER_DATA, context);
		}
	});
}

function canvas_mouse (x, y, context) {
	if (
		(typeof (CLUSTER_DATA) == "object")
		&& (CLUSTER_DATA != null)
	) {
		if (
			(x >= 0) && (x <= CLUSTER_DATA.image_width)
			&& (y >= 0) && (y <= CLUSTER_DATA.image_height)
		) {
			var row = Math.floor (y / CLUSTER_DATA.cell_height);
			var col = Math.floor (x / CLUSTER_DATA.cell_width);
			var cols_per_row = Math.ceil (CLUSTER_DATA.image_width / CLUSTER_DATA.cell_width);
			var cell_pos = row * cols_per_row + col;
			var cluster_number = CLUSTER_DATA.groups [cell_pos];
			draw_single_cluster (cluster_number);
		} else {
			draw_clusters (CLUSTER_DATA, context);
		}
	}
}

function on_imagefile_change () {
	document.querySelector (".clustering_info").classList.add("hide");
	document.querySelector (".clustering_options").classList.remove("hide");

	update_image ();
}

function on_algorithm_selected () {
	update_algorithm_controls ();
}

function update_algorithm_controls () {
	var params_divs = document.querySelectorAll (".algorithm_params");
	params_divs.forEach (function (div) {div.classList.add ("hide");});
	window.setTimeout(function() {
		var selected_algorithm = document.querySelector("select[name=algorithm]").value;
		var current = document.querySelector ("."+(selected_algorithm)+"_params");
		current.classList.remove ("hide");
	}, 300);
}

function update_image () {
	clear_image_events ()
	var url = document.querySelector ("select[name=imagefile]").value;
	var img = document.createElement ("IMG");
	img.addEventListener ("load", draw_image_to_canvas);
	img.src = "images/" + url;
	CURRENT_IMG = img;
	CLUSTER_DATA = null;
	load_preset ();
}

function clear_image_events () {
	if (typeof (CURRENT_IMG) == "object") {
		CURRENT_IMG.removeEventListener ("load", draw_image_to_canvas);
		CURRENT_IMG = null;
	}
}

function draw_image_to_canvas (evt) {
	var img = evt.target;
	var canvas = document.querySelector ("canvas.demo_canvas");
	var context = canvas.getContext("2d");
	var grid_size = document.querySelector("input#cell_size").value;
	
	adjust_canvas_size ();
	scale_canvas_to_fit_image (canvas, img);
	context.drawImage (img, 0, 0);
	draw_grid (context, img, grid_size)
}



function scale_canvas_to_fit_image (canvas, img) {
	var context = canvas.getContext ("2d");
	context.setTransform (1, 0, 0, 1, 0, 0); // Reset transformations
	var ratio_x = canvas.width / img.width;
	var ratio_y = canvas.height / img.height;
	var ratio = Math.min (ratio_x, ratio_y);
	context.scale (ratio, ratio);
	canvas.dataset.scaled_x = ratio;
	canvas.dataset.scaled_y = ratio;

	var translate_x = (-img.width + (canvas.width /ratio)) /2;
	var translate_y = (-img.height + (canvas.height /ratio)) /2;
	context.translate (translate_x, translate_y);
	canvas.dataset.translated_x = translate_x;
	canvas.dataset.translated_y = translate_y;
}

function draw_grid (context, img, grid_size) {
	context.setLineDash ([4, 4]);
	var y = 0;
	while (y <= img.height) {
		context.beginPath();
		context.moveTo(0, y);
		context.lineTo(img.width, y);
		context.lineWidth = 3 
		context.strokeStyle = "rgb(0,0,0,0.5)"
		context.stroke()
		context.lineWidth = 1
		context.strokeStyle = "rgb(255,255,255)"
		context.stroke()
		y += Number (grid_size);
	}
	var x = 0;
	while (x <= img.width) {
		context.beginPath();
		context.moveTo(x, 0);
		context.lineTo(x, img.height);
		context.lineWidth = 3
		context.strokeStyle = "rgba(0,0,0,0.5)"
		context.stroke()
		context.lineWidth = 1
		context.strokeStyle = "rgb(255,255,255)"
		context.stroke()
		x += Number (grid_size);
	}
}

function redraw_image () {
	if (typeof (CURRENT_IMG) == "object") {
		var img = CURRENT_IMG
		var canvas = document.querySelector ("canvas.demo_canvas");
		var context = canvas.getContext("2d");
		var grid_size = document.querySelector("input#cell_size").value;
	
		adjust_canvas_size ();
		scale_canvas_to_fit_image (canvas, img);
		context.drawImage (img, 0, 0);
		draw_grid (context, img, grid_size)
	}
}

function process () {
	var button = document.querySelector(".btn_process");
	button.disabled = true;

	var cell_size = document.querySelector ("input#cell_size").value;
	CELL_SIZE = cell_size;
	var filename = document.querySelector ("select[name=imagefile]").value;
	var preseteables_string = get_preseteables_string ();
	var xhr = new XMLHttpRequest ();
	xhr.open ("GET", "process?cell_size="+Number(cell_size)+"&filename="+encodeURI(filename)+preseteables_string);
	xhr.onload = on_process_success;
	xhr.send ();
	save_preset ();
	show_loading_screen ();
}

function on_process_success (evt) {
	var button = document.querySelector(".btn_process");
	button.disabled = false;
	var response = JSON.parse (evt.target.responseText);
	var context = document.querySelector ("canvas.demo_canvas").getContext("2d");
	CLUSTER_DATA = response;
	draw_clusters (response, context);
	show_clustring_info (response);
	document.getElementById ("image_frame").scrollIntoView();
	
	hide_loading_screen ();
}


function on_clusterize_again_click () {
	CLUSTER_DATA = null;
	document.querySelector (".clustering_info").classList.add("hide");
	document.querySelector (".clustering_options").classList.remove("hide");
	update_algorithm_controls ();
	load_preset ();
	update_image ();
}

function show_loading_screen () {
	var elem = document.querySelector(".modal_loading");
	M.Modal.getInstance(elem).open();
}

function hide_loading_screen () {
	var elem = document.querySelector(".modal_loading");
	M.Modal.getInstance(elem).close();
}


function get_preseteables_string () {
	var str = "";
	var items = document.querySelectorAll (".preseteable");
	items.forEach (function (item) {
		if (item.name != "" && (item.value != "0") ) {
			str += "&" + item.name + "=" + item.value;
		}
	});
	return str;
}

function show_clustring_info (data) {
	var num_clusters = 0;
	data.groups.forEach (function(elem) {if (elem > num_clusters) {num_clusters = elem}});

	document.querySelector (".num_clusters_found").textContent = num_clusters;
	document.querySelector (".clustering_info").classList.remove("hide");
	document.querySelector (".clustering_options").classList.add("hide");
}

function draw_clusters (data, context) {
	if ((typeof (CURRENT_IMG) == "object") && (typeof (CLUSTER_DATA) == "object")) {
		var canvas = document.querySelector ("canvas.demo_canvas");
		var context = canvas.getContext("2d");
	
		adjust_canvas_size ();
		scale_canvas_to_fit_image (canvas, CURRENT_IMG);
		context.drawImage (CURRENT_IMG, 0, 0);
	}

	var container = document.querySelector (".img_container");
	var columns = Math.ceil (data.image_width / data.cell_width);
	for (var i = 0; i< data.groups.length; i++) {
		if (typeof (DOT_COLORS[data.groups[i]]) == "undefined") {
			DOT_COLORS[data.groups[i]] = "rgba("+Math.round (Math.random()*255)+","+Math.round (Math.random()*255)+","+Math.round (Math.random()*255)+", 0.6)";
		}
		var center_x = data.cell_width * ((i % columns) + 0.5);
		var center_y = Math.ceil (data.cell_height * Math.floor (i/columns)) + data.cell_height/2
		var radius = (Math.min (data.cell_width, data.cell_height)/2)-2;

		context.beginPath ();
		context.fillStyle = DOT_COLORS[data.groups[i]];
		context.arc (center_x, center_y, radius, 0, 2*Math.PI);
		context.fill ();
	}
}

function draw_single_cluster (cluster_number) {
	if ((typeof (CURRENT_IMG) == "object") && (typeof (CLUSTER_DATA) == "object")) {
		var data = CLUSTER_DATA;
		var img = CURRENT_IMG;
		var canvas = document.querySelector ("canvas.demo_canvas");
		var context = canvas.getContext("2d");
	
		adjust_canvas_size ();
		scale_canvas_to_fit_image (canvas, img);
		context.drawImage (img, 0, 0);
		cover_waste_cells (context, cluster_number, CLUSTER_DATA);
		cover_waste_corners (context, cluster_number, CLUSTER_DATA);
	}
}

function cover_waste_cells (context, cluster_number, data) {
	var columns = Math.ceil (data.image_width / data.cell_width);

	for (var i = 0; i< data.groups.length; i++) {
		if (data.groups[i] != cluster_number) {
			var free_corner = get_uncoverable_corners (i, data, cluster_number);
			var cw = data.cell_width;
			var ch = data.cell_height;
			var pos_x = cw * (i % columns);
			var pos_y = Math.ceil (ch * Math.floor (i/columns));
			var steps = [
				((free_corner["topRight"])? [cw/3, ch/3]: [cw/2, 0]),
				[cw/2, ch/2],
				((free_corner["bottomRight"])? [cw/3, ch*5/6]: [cw/2, ch]),
				[0, ch],
				((free_corner["bottomLeft"])? [-cw/3, ch*5/6]: [-cw/2, ch]),
				[-cw/2, ch/2],
				((free_corner["topLeft"])? [-cw/3, ch/3]: [-cw/2, 0]),
			];

			context.fillStyle = "rgba(0,0,0,0.95)";
			draw_polygon (context, [pos_x+cw/2, pos_y], steps);
		}
	}
}

function cover_waste_corners (context, cluster_number, data) {
	var columns = Math.ceil (data.image_width / data.cell_width);

	for (var i = 0; i< data.groups.length; i++) {
		if (data.groups[i] == cluster_number) {
			var col = (i % columns);
			var row = Math.floor (i / columns);
			var neighborhood = get_neighborhood (i, cluster_number, data);
			var coverables = get_coverable_corners (neighborhood);
			var pos_x = data.cell_width * (col);
			var pos_y = Math.ceil (data.cell_height * row);
			context.fillStyle = "rgba(0,0,0,0.95)";
			var cw = data.cell_width;
			var ch = data.cell_height;
			if (coverables["topRight"]) {
				draw_polygon (context, [pos_x+cw, pos_y], [[-cw/3, 0], [0, ch/3]]);
			}
			if (coverables["bottomRight"]) {
				draw_polygon (context, [pos_x+cw, pos_y+ch], [[-cw/3, 0], [0, -ch/3]]);
			}
			if (coverables["bottomLeft"]) {
				draw_polygon (context, [pos_x, pos_y+ch], [[cw/3, 0], [0, -ch/3]]);
			}
			if (coverables["topLeft"]) {
				draw_polygon (context, [pos_x, pos_y], [[cw/3, 0], [0, ch/3]]);
			}
		}
	}
}

function draw_polygon (context, start, points) {
	context.beginPath ();
	context.moveTo(start[0], start[1]);
	for (var i=0; i<points.length; i++) {
		context.lineTo(start[0]+points[i][0], start[1]+points[i][1])
	}
	context.closePath();
	context.fill();
}

function get_neighborhood (i, cluster_number, data) {
	var columns = Math.ceil (data.image_width / data.cell_width);
	var rows = Math.ceil (data.image_height / data.cell_height);
	var col = (i % columns);
	var row = Math.floor (i / columns);
	return {
		"top": (row>0)? (data.groups[i-columns] == cluster_number): false,
		"topRight": (row>0 && col<(columns-1))? (data.groups[i-columns+1] == cluster_number): false,
		"right": (col<(columns-1))? (data.groups[i+1] == cluster_number): false,
		"bottomRight": (row<(rows-1) && col<(columns-1))? (data.groups[i+columns+1] == cluster_number): false,
		"bottom": (row<(rows-1))? (data.groups[i+columns] == cluster_number): false,
		"bottomLeft": (row<(rows-1) && col>0)? (data.groups[i+columns-1] == cluster_number): false,
		"left": (col>0)? (data.groups[i-1] == cluster_number): false,
		"topLeft": (row>0 && col>0)? (data.groups[i-columns-1] == cluster_number): false
	};
}

function get_coverable_corners (neighborhood) {
	var n = neighborhood;
	return {
		"topRight": !(n["top"] || n["topRight"] || n["right"]),
		"bottomRight": !(n["bottom"] || n["bottomRight"] || n["right"]),
		"bottomLeft": !(n["bottom"] || n["bottomLeft"] || n["left"]),
		"topLeft": !(n["top"] || n["topLeft"] || n["left"])
	};
}

function get_uncoverable_corners (i, data, sel) {
	var cols = Math.ceil (data.image_width / data.cell_width);
	var rows = Math.ceil (data.image_height / data.cell_height);
	var col = i % cols
	var row = Math.floor (i / cols)
	var dg = data.groups;
	return {
		"topRight": (row>0 && col<(cols-1))? (dg[i-cols] == sel && dg[i-cols+1] == sel && dg[i+1] == sel): false,
		"bottomRight": (row<(rows-1) && col<(cols-1))? (dg[i+cols] == sel && dg[i+cols+1] == sel && dg[i+1] == sel): false,
		"bottomLeft": (row<(rows-1) && col>0)? (dg[i+cols] == sel && dg[i+cols-1] == sel && dg[i-1] == sel): false,
		"topLeft": (row>0 && col>0)? (dg[i-cols] == sel && dg[i-cols-1] == sel && dg[i-1] == sel): false
	};
}

window.onload = init;

