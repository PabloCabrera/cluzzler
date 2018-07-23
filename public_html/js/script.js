function init () {
	M.AutoInit();
	load_metric_list ();
	load_select_image ();
	adjust_canvas_size ();
	window.addEventListener ("resize", redraw_image);
}

function load_metric_list () {
	var xhr = new XMLHttpRequest();
	xhr.open ("GET", "metrics");
	xhr.onload = on_load_metric_list_success;
	xhr.send();
}

function load_select_image () {
	var xhr = new XMLHttpRequest();
	xhr.open ("GET", "cluzzimages");
	xhr.onload = on_load_images_success;
	xhr.send();
}

function on_load_images_success (evt) {
	var groups = JSON.parse (evt.target.responseText);
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
	update_image ()
}

function on_load_metric_list_success (evt) {
	var metrics = JSON.parse (evt.target.responseText);
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
	canvas.height = canvas.parentNode.clientHeight;
}

function update_image () {
	clear_image_events ()
	var url = document.querySelector ("select[name=imagefile]").value;
	var img = document.createElement ("IMG");
	img.addEventListener ("load", draw_image_to_canvas);
	img.src = "images/" + url;
	CURRENT_IMG = img;
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

	var translate_x = (-img.width + (canvas.width /ratio)) /2;
	var translate_y = (-img.height + (canvas.height /ratio)) /2;
	context.translate (translate_x, translate_y);
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
	draw_clusters (response, context);
}

function get_metrics_string () {
	var str = "";
	var ranges = document.querySelectorAll ("input.metric_range");
	ranges.forEach (function (range) {
		if (range.value > 0) {
			str += "&" + range.name + "=" + range.value;
		}
	});
	return str;
}

function draw_clusters (data, context) {
	DEBUG_DATA = data;
	var container = document.querySelector (".img_container");
	var columns = Math.ceil (data.image_width / data.cell_width);
	var dot_colors = [];
	for (var i = 0; i< data.groups.length; i++) {
		var dot = document.createElement ("DIV");
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

window.onload = init;

