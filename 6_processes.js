///////////////////////////////////////////////////////////////////////////
//////////////////////////// libs /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

// import * as d3 from "d3";
// import { easeBounceIn, easeCubic, easeExp, easePoly } from "d3";
// import { csv } from "d3-fetch";
// import _ from "lodash";

// import mustache
// https://github.com/janl/mustache.js
// const Mustache = require("mustache");

console.clear();

///////////////////////////////////////////////////////////////////////////
//////////////////////////// drawing function /////////////////////////////
///////////////////////////////////////////////////////////////////////////

const createChart = async () => {
	// const url = "https://eucyberdirect.eu/wp-content/uploads/2020/11/cpi_cyber_operations_database_2020_version-1.0.csv";
	const url = "./data/CPI_Cyber_Operations_Database_2020_Version 1.0.csv";

	//////////////////////////// data /////////////////////////////////////////

	let data = [
		{ title: "Russia", label: "(9 cases)", group: "G20", status: "yes" },
		{ title: "Russia", label: "(9 cases)", group: "GGE", status: "yes" },
		{ title: "Russia", label: "(9 cases)", group: "OSCE", status: "yes" },
		{ title: "Russia", label: "(9 cases)", group: "SCO", status: "yes" },
		{
			title: "North Korea",
			label: "(5 cases)",
			group: "N/A",
			status: "observer"
		},
		{ title: "Iran", label: "(4 cases)", group: "SCO", status: "observer" },
		{ title: "United States", label: "(4 cases)", group: "G20", status: "yes" },
		{ title: "United States", label: "(4 cases)", group: "G7", status: "yes" },
		{ title: "United States", label: "(4 cases)", group: "GGE", status: "yes" },
		{ title: "United States", label: "(4 cases)", group: "OAS", status: "yes" },
		{
			title: "United States",
			label: "(4 cases)",
			group: "OSCE",
			status: "yes"
		},
		{
			title: "United Arab Emirates",
			label: "(1 case)",
			group: "LAS",
			status: "yes"
		}
	];

	// console.log(data);

	data = _.filter(data, (d) => d.group !== "N/A");

	//////////////////////////// accessors ////////////////////////////////////

	const col = "status";
	const xAccessor = (d) => d.group;
	const yAccessor = (d) => d.title;
	const cAccessor = (d) => d[col];

	//////////////////////////// Set up svg ///////////////////////////////////

	const wrapper = d3.select("#appProcesses").append("svg");

	// if element already exists, return selection
	// if it doesn't exist, create it and give it class
	const selectOrCreate = (elementType, className, parent) => {
		const selection = parent.select("." + className);
		if (!selection.empty()) return selection;
		return parent.append(elementType).attr("class", className);
	};

	///////////////////////////////////////////////////////////////////////////
	//////////////////////////// update ///////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	const update = () => {
		//////////////////////////// sizes ///////////////////////////////////
		// const size = d3.min([window.innerWidth * 0.99, window.innerHeight * 0.99]);
		const size = 1100;

		let dimensions = {
			width: size,
			height: size * 0.33,
			margin: {
				top: 15,
				right: 15,
				bottom: 60,
				left: 60
			}
		};

		const radius = dimensions.width / 70;

		dimensions.boundedWidth =
			dimensions.width - dimensions.margin.left - dimensions.margin.right;
		dimensions.boundedHeight =
			dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

		//////////////////////////// svg ///////////////////////////////////

		// tag = name; class = .name; id = #name;
		wrapper.attr("width", dimensions.width).attr("height", dimensions.height);

		// shifting
		const bounds = selectOrCreate("g", "wrapper", wrapper).style(
			"transform",
			`translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
		);

		//////////////////////////// colors ///////////////////////////////////////

		const colorsType = [
			"#113655",
			// "#f28c00",
			"#3f8ca5",
			// "#fab85f",
			"#99d4e3"
			// "#fed061"
		];

		//////////////////////////// col var ///////////////////////////////////////

		var dataType = _.chain(data)
			.map((d) => d[col])
			.uniq()
			.value();

		var xValue = _.chain(data)
			.map((d) => xAccessor(d))
			.uniq()
			.value();

		var yValue = _.chain(data)
			.map((d) => yAccessor(d))
			.uniq()
			.value()
			.reverse();

		// console.log(xValue);
		console.log(yValue);

		//////////////////////////// scales ///////////////////////////////////////

		const xScale = d3
			// .scaleOrdinal()
			.scalePoint()
			.domain(xValue)
			.range([0, dimensions.boundedWidth]);

		const yScale = d3
			// .scaleOrdinal()
			.scalePoint()
			.domain(yValue)
			.range([dimensions.boundedHeight, 0]);

		const cScale = d3.scaleOrdinal().domain(dataType).range(colorsType);

		//////////////////////////// axes /////////////////////////////////////////

		// var formatAxis = d3.format(".4r");

		const xAxisGenerator = d3
			.axisBottom()
			.scale(xScale)
			// .tickFormat(formatAxis)
			.ticks();

		const xAxis = selectOrCreate("g", "xAxis", bounds)
			.call(xAxisGenerator)
			.style("transform", `translate(0,${dimensions.boundedHeight}px)`);

		const yAxisGenerator = d3
			.axisLeft()
			.scale(yScale)
			.tickSize(-dimensions.boundedWidth);

		const yAxis = selectOrCreate("g", "yAxis", bounds).call(yAxisGenerator);
		// 	.style("transform", `translate(0,${dimensions.boundedHeight}px)`);

		//////////////////////////// plot /////////////////////////////////////////

		// starting position
		const dots = (data) => {
			const tooltip = selectOrCreate(
				"div",
				"tooltip",
				d3.select("#appProcesses")
			);

			const dots = bounds
				.selectAll(".dots")
				.data(data)
				.enter()
				// cell
				.append("circle")
				.attr("class", "dots")
				.attr("r", 0)
				.attr("cx", (d) => xScale(xAccessor(d)))
				.attr("cy", (d) => yScale(yAccessor(d)))
				.style("opacity", 0);

			// animated drop
			dots
				.transition()
				.duration((d, i) => i * 50)
				.attr("r", radius)
				.attr("cx", (d) => xScale(xAccessor(d)))
				.attr("cy", (d) => yScale(yAccessor(d)))
				.attr("fill", (d) => cScale(cAccessor(d)))
				.style("opacity", 1);

			// tooltip
			dots.on("mouseover", (event, d) => {
				var mouseX = event.pageX + 5;
				var mouseY = event.pageY + 5;
				d3.select(".tooltip")
					.style("visibility", "visible")
					.style("opacity", 1)
					.style("left", mouseX + "px")
					.style("top", mouseY + "px")
					.text(d.title);
				// smoother change in opacity
				dots.transition().style("opacity", 0.5);
			});

			dots.on("mousemove", (d, i) => {
				var mouseX = event.pageX + 5;
				var mouseY = event.pageY + 5;
				d3.select(".tooltip")
					.style("left", mouseX + "px")
					.style("top", mouseY + "px")
					.text(d.title + " " + d.label);
			});

			dots.on("mouseleave", function (d) {
				d3.select(".tooltip").style("visibility", "hidden");
				dots.transition().style("opacity", 1);
			});

			///////////////////////////////////////////////////////////////////////////
			//////////////////////////// details //////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////

			var dataL = 0;
			var legendOffset = radius * 10;
			// var legendOffset = (dimensions.boundedWidth - 100) / dataType.length;

			var legend = selectOrCreate("g", "legend", bounds)
				.attr("width", dimensions.boundedWidth)
				.attr("height", radius * 2);

			var drawLegend = legend
				.selectAll(".legend")
				.data(dataType)
				.enter()
				.append("g")
				.attr("class", "legend")
				.attr("transform", function (d, i) {
					if (i === 0) {
						dataL = d.length + legendOffset;
						return "translate(0,0)";
					} else {
						var newdataL = dataL;
						dataL += d.length + legendOffset;
						return "translate(" + newdataL + ",0)";
					}
				});

			drawLegend
				.append("circle")
				.attr("cx", radius)
				.attr("cy", radius)
				.attr("r", radius / 2)
				.style("fill", (d, i) => colorsType[i]);

			drawLegend
				.append("text")
				.attr("x", radius + radius)
				.attr("y", radius * 1.5)
				.text((d) => d)
				.attr("class", "textselected")
				.style("text-anchor", "start");
		};
		dots(data);
	};

	update();
};

createChart();
