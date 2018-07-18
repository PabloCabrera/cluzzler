
function main () {
	var req = new XMLHttpRequest ();
	req.open ("GET", "output/groups_jirafa-masai.jpg.json");
	req.onreadystatechange = (function () {
		if (req.readyState == 4) {
			on_data_recieved (JSON.parse(req.responseText));
		}
	});
	req.send ();
}

function on_data_recieved (data) {
	DEBUG_DATA = data;
	var container = document.querySelector (".img_container");
	var columns = Math.ceil (data.image_width / data.cell_width);
	var dot_colors = [];
	container.style.backgroundColor = "#888888";
	container.style.borderColor = "#000000";
	container.style.width = data.image_width + "px";
	container.style.height = data.image_height + "px";
	container.style.backgroundImage = "url('input/jirafa-masai.jpg')";
	container.style.position = "relative";
	for (var i = 0; i< data.groups.length; i++) {
		var dot = document.createElement ("DIV");
		if (typeof (dot_colors[data.groups[i]]) == "undefined") {
			dot_colors[data.groups[i]] = "rgba("+Math.round (Math.random()*255)+","+Math.round (Math.random()*255)+","+Math.round (Math.random()*255)+", 0.8)";
		}
		dot.style.width = (data.cell_width/4) + "px";
		dot.style.height = (data.cell_height/4) + "px";
		dot.style.borderRadius = "50%";
		dot.style.padding = "10px";
		dot.style.boxSizing = "border-box";
		dot.style.position = "absolute";
		dot.style.left = (data.cell_width * (i % columns)) + "px";
		dot.style.top = Math.ceil (data.cell_height * Math.floor (i/columns)) + "px";
		dot.style.background = dot_colors[data.groups[i]];
		container.appendChild (dot);
	}
}

window.onload = main;
