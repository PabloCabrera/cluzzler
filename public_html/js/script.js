function init () {
	M.AutoInit();
	load_stuff ();
	//load_metric_list ();
	//load_select_image ();
	adjust_canvas_size ();
	set_canvas_mouse_listener ();
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
	update_image ()
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
	if (typeof (PRESETS[basename]) == "object") {
		var ranges = document.querySelectorAll ("input.metric_range");
		ranges.forEach (function (range) {
			console.log (range.name + ": "+PRESETS[basename][range.name]);
			if (typeof (PRESETS[basename][range.name]) != "undefined") {
				range.value = Number (PRESETS[basename][range.name]);
			} else {
				range.value = 0
			}
		});
	}
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
		canvas_mouse (x, y);
	});
}

function canvas_mouse (x, y) {
	if (
		(typeof (CLUSTER_DATA) == "object")
		&& (CLUSTER_DATA != null)
		&& (x >= 0) && (x <= CLUSTER_DATA.image_width)
		&& (y >= 0) && (y <= CLUSTER_DATA.image_height)
	) {
		var row = Math.floor (y / CLUSTER_DATA.cell_height);
		var col = Math.floor (x / CLUSTER_DATA.cell_width);
		var cols_per_row = Math.ceil (CLUSTER_DATA.image_width / CLUSTER_DATA.cell_width);
		var cell_pos = row * cols_per_row + col;
		var cluster_number = CLUSTER_DATA.groups [cell_pos];
		draw_single_cluster (cluster_number);
		
	}
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
	var metrics_string = get_metrics_string ();
	var xhr = new XMLHttpRequest ();
	xhr.open ("GET", "process?cell_size="+Number(cell_size)+"&filename="+encodeURI(filename)+metrics_string);
	xhr.onload = on_process_success;
	xhr.send ();
}

function on_process_success (evt) {
	var button = document.querySelector(".btn_process");
	button.disabled = false;
	var response = JSON.parse (evt.target.responseText);
	var context = document.querySelector ("canvas.demo_canvas").getContext("2d");
	CLUSTER_DATA = response;
	draw_clusters (response, context);

}

function get_metrics_string () {
	var str = "";
	var ranges = document.querySelectorAll ("input.metric_range");
	ranges.forEach (function (range) {
		if (range.value > 0 && range.name != "") {
			str += "&" + range.name + "=" + range.value;
		}
	});
	return str;
}

function draw_clusters (data, context) {
	var container = document.querySelector (".img_container");
	var columns = Math.ceil (data.image_width / data.cell_width);
	var dot_colors = [];
	for (var i = 0; i< data.groups.length; i++) {
		if (typeof (dot_colors[data.groups[i]]) == "undefined") {
			dot_colors[data.groups[i]] = "rgba("+Math.round (Math.random()*255)+","+Math.round (Math.random()*255)+","+Math.round (Math.random()*255)+", 0.6)";
		}
		var center_x = data.cell_width * ((i % columns) + 0.5);
		var center_y = Math.ceil (data.cell_height * Math.floor (i/columns)) + data.cell_height/2
		var radius = (Math.min (data.cell_width, data.cell_height)/2)-2;

		context.beginPath ();
		context.fillStyle = dot_colors[data.groups[i]];
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
	}
}

function cover_waste_cells (context, cluster_number, data) {
	var columns = Math.ceil (data.image_width / data.cell_width);

	for (var i = 0; i< data.groups.length; i++) {
		if (data.groups[i] != cluster_number) {
			var pos_x = data.cell_width * (i % columns);
			var pos_y = Math.ceil (data.cell_height * Math.floor (i/columns));
		
			context.beginPath ();
			context.fillStyle = "rgba(0,0,0,0.9)";
			context.rect (pos_x, pos_y, data.cell_width, data.cell_height);
			context.fill ();
		}
	}
	
}

window.onload = init;

