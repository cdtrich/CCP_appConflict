console.clear();

///////////////////////////////////////////////////////////////////////////
//////////////////////////// drawing function /////////////////////////////
///////////////////////////////////////////////////////////////////////////

const createChart = async () => {
	const url = "./data/CPI_Cyber_Operations_Database_2020_Version 1.0.csv";

	//////////////////////////// data /////////////////////////////////////////

	let data = await d3.csv(url, (d) => {
		return {
			// order
			name: d.Name,
			// plotting
			startYear: +d.Start_year,
			reportDay: d.Report_day,
			reportMonth: d.Report_month,
			reportYear: d.Report_year,
			report: new Date(+d.Report_year, +d.Report_month, +d.Report_day),
			// labels
			dyad: d.Dyad,
			disputeType: d.Type_of_dispute,
			geopoliticalSetting: d.Geopolitical_setting,
			initialaccesEnterprise: d.Initial_access_MITRE_ATTCK_for_Enterprise,
			initialaccesICS: d.Initial_access_MITRE_ATTCK_for_ICS,
			impactEnterprise: d.Impact_MITRE_ATTCK_for_Enterprise,
			addImpactEnterprise: d.Additional_Impact_MITRE_ATTCK_for_Enterprise,
			impactICS: d.Impact_MITRE_ATTCK_for_ICS,
			infosecEffect: d.Infosec_effect,
			physicalEffect: d.Physical_effect,
			corporateDowntime: d.Corporate_downtime,
			estimatedLoss: d.Estimated_loss,
			targetEntity: d.Target_entity,
			attackNuclearCapability: d.Attack_nuclear_capability,
			targetNuclearCapability: d.Target_nuclear_capability,
			attackAccountabilityIndex: d.Attack_accountability_index,
			targetAccountabilityIndex: d.Target_accountability_index,
			attackfdi: d.Attack_Foreign_Direct_Investment_ranking,
			targetfdi: d.Target_Foreign_Direct_Investment_ranking,
			fdi: d.Foreign_Direct_Investment,
			attack_gdpRank: d.Attack_GDP_rank,
			target_gdpRank: d.Target_GDP_rank,
			attacker_jurisdiction: d.Attack_jurisdiction,
			target_jurisdiction: d.Target_jurisdiction,
			victim_jurisdiction: d.Victim_jurisdiction,
			// other for coloring
			military: d.Ongoing_military_confrontation,
			command: d.Attack_cyber_command.trim(),
			us_me: d.US_military_effects,
			url: d.url
		};
	});

	//////////////////////////// accessors ////////////////////////////////////

	const col = "military";
	const xAccessor = (d) => d.startYear;
	const cAccessor = (d) => d[col];
	const rAccessor = (d) => d[col];

	//////////////////////////// Set up svg ///////////////////////////////////

	const wrapper = d3.select("#appConflict").append("svg");

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
		const el = document.getElementById("col");
		const size = el.clientWidth * 0.99;

		let dimensions = {
			width: size,
			height: size * 0.7,
			margin: {
				top: 15,
				right: 60,
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

		// template
		var template = d3.select("#template").html();
		Mustache.parse(template);

		//////////////////////////// data /////////////////////////////////////////

		// pretty dates
		var formatTime = d3.timeFormat("%d %b %Y");
		data.forEach((d) => {
			d.reportLabel = formatTime(d.report);
		});

		// fixing incomplete data
		data.forEach((d) => {
			switch (d.name) {
				case "Stuxnet":
					d.startYear = 2010;
					break;
				case "DDoS on US Banks":
					d.reportLabel = "2012";
					break;
				default:
			}
		});

		//////////////////////////// colors ///////////////////////////////////////

		const colorsType = [
			"#113655",
			"#f28c00",
			"#3f8ca5",
			"#fab85f",
			"#99d4e3",
			"#fed061"
		];

		//////////////////////////// col var ///////////////////////////////////////

		var dataType = _.chain(data)
			.map((d) => d[col])
			.uniq()
			.value();

		//////////////////////////// scales ///////////////////////////////////////

		const xScale = d3
			.scaleLinear()
			.domain(d3.extent(data, xAccessor))
			.range([0, dimensions.boundedWidth]);

		const cScale = d3.scaleOrdinal().domain(dataType).range(colorsType);

		const sScale = d3
			.scaleOrdinal()
			.domain(dataType)
			.range([radius * 1, radius * 2, radius * 1.33, radius * 1.66]);

		var simulation = d3
			.forceSimulation(data)
			.force(
				"x",
				d3
					.forceX(function (d) {
						return xScale(xAccessor(d));
					})
					.strength(1)
			)
			.force("y", d3.forceY(dimensions.boundedHeight).strength(0.05))
			.force("collide", d3.forceCollide(radius * 3))
			.stop();

		for (var i = 0; i < 10; ++i) simulation.tick();

		//////////////////////////// axes /////////////////////////////////////////

		var formatAxis = d3.format(".4r");

		const xAxisGenerator = d3
			.axisBottom()
			.scale(xScale)
			.tickFormat(formatAxis)
			.ticks();
		const xAxis = selectOrCreate("g", "xAxis", bounds)
			.call(xAxisGenerator)
			.style("transform", `translate(0,${dimensions.boundedHeight}px)`);

		//////////////////////////// plot /////////////////////////////////////////

		// starting position
		const dots = (data) => {
			const tooltip = selectOrCreate(
				"div",
				"tooltip",
				d3.select("#appConflict")
			);

			const dots = bounds
				.selectAll(".dots")
				.data(data)
				.enter()
				// cell
				.append("circle")
				.attr("class", "dots")
				.attr("r", 0)
				.attr("cx", (d) => d.x)
				.attr("cy", 0)
				.style("opacity", 0);

			// animated drop
			dots
				.transition()
				.duration((d, i) => i * 50)
				.attr("r", (d) => sScale(rAccessor(d)))
				.attr("cx", (d) => xScale(xAccessor(d)))
				.attr("cy", (d) => d.y)
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
					.text(d.name);
				// smoother change in opacity
				dots.transition().style("opacity", 0.5);
			});

			dots.on("mousemove", (d, i) => {
				var mouseX = event.pageX + 5;
				var mouseY = event.pageY + 5;
				d3.select(".tooltip")
					.style("left", mouseX + "px")
					.style("top", mouseY + "px")
					.text(d.name);
			});

			dots.on("mouseleave", function (d) {
				d3.select(".tooltip").style("visibility", "hidden");
				dots.transition().style("opacity", 1);
			});

			// overlay
			dots.on("click", on);

			///////////////////////////////////////////////////////////////////////////
			//////////////////////////// details //////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////

			var dataL = 0;
			var legendOffset = radius * 10;

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
				// .attr("r", radius / 2)
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

		///////////////////////////////////////////////////////////////////////////
		//////////////////////////// details //////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		function on(f) {
			document.getElementById("overlay").style.display = "block";
			var detailsHtml = Mustache.render(template, f);
			d3.select("#overlay").html(detailsHtml);
		}

		dots(data);
	};

	update();
};

createChart();
