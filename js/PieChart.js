function loadRegionalConsoleSales(data, regional_console_sales_svg) {
	let currentData = prepareTopPublishersData(data);

	const width = 1000;
	const height = 750;
	const radius = Math.min(width, height) / 3;

	const svg = d3.select(`#regional_console_sales_svg`)
		.attr("width", width)
		.attr("height", height);

	const group = svg.append("g")
		.attr("transform", `translate(${width / 2 - 50}, ${height / 2})`);

	const customColors = [
		"#FF0000", // Red
		"#00FF00", // Green
		"#0000FF", // Blue
		"#FFFF00", // Yellow
		"#FF00FF", // Magenta
		"#00FFFF", // Cyan
		"#FFA500", // Orange
		"#800080", // Purple
		"#008000", // Dark Green
		"#FFC0CB", // Pink
		"#ff7b7b", // light red
		"#808080"  // Gray
	];

	const color = d3.scaleOrdinal()
		.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
		.range(customColors);

	const pie = d3.pie().value(d => d[1]);

	const arc = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

	const labelArc = d3.arc()
		.outerRadius(radius + 30)
		.innerRadius(radius + 30);

	const percentArc = d3.arc()
		.outerRadius(radius + 150)
		.innerRadius(0);

	// Add a "Back" text element in the top-right corner
	const backButton = svg.append("text")
		.attr("x", 120)
		.attr("y", 70)
		.attr("text-anchor", "end")
		.attr("font-size", "30px")
		.attr("font-weight", "bold")
		.attr("cursor", "pointer")
		.style("fill", "blue")
		.style("display", "none")
		.text("< Back")
		.on("click", function () {
			currentData = prepareTopPublishersData(data);
			updatePieChart(currentData);
			backButton.style("display", "none");
		});

	// Prepare the data for the top publishers
	function prepareTopPublishersData(data) {
		const salesByPublisher = {};
		data.forEach(d => {
			const publisher = d.Publisher;
			const globalSales = parseFloat(d.Global_Sales);
			if (!salesByPublisher[publisher]) {
				salesByPublisher[publisher] = 0;
			}
			salesByPublisher[publisher] += globalSales;
		});
		return Object.entries(salesByPublisher)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
	}

	// Prepare the data for genre distribution of a specific publisher
	function prepareGenreData(data, selectedPublisher) {
		const salesByGenre = {};
		data.filter(d => d.Publisher === selectedPublisher).forEach(d => {
			const genre = d.Genre;
			const globalSales = parseFloat(d.Global_Sales);
			if (!salesByGenre[genre]) {
				salesByGenre[genre] = 0;
			}
			salesByGenre[genre] += globalSales;
		});
		return Object.entries(salesByGenre);
	}

	// Update the pie chart with new data
	function updatePieChart(newData) {
		const pieData = pie(newData);

		totalSales = currentData.reduce((sum, [, sales]) => sum + sales, 0);

		const slices = group.selectAll(".arc")
			.data(pieData, d => d.data[0]);

		const slicesEnter = slices.enter()
			.append("g")
			.attr("class", "arc");

		slicesEnter.append("path")
			.attr("d", arc)
			.attr("fill", d => color(d.data[0]))
			.on("mouseover", function (event, d) {
				const hoverArc = d3.arc()
					.innerRadius(0)
					.outerRadius(radius + 20);

				d3.select(this)
					.transition()
					.duration(200)
					.attr("d", hoverArc);

				group.append("text")
					.attr("class", "hover-percent")
					.attr("transform", `translate(${percentArc.centroid(d)})`)
					.attr("dy", "0.35em")
					.style("text-anchor", "middle")
					.style("font-size", "14px")
					.style("font-weight", "bold")
					.text(`${((d.data[1] / totalSales) * 100).toFixed(1)}%`);
			})
			.on("mouseout", function () {
				d3.select(this)
					.transition()
					.duration(200)
					.attr("d", arc);

				group.selectAll(".hover-percent").remove();
			})
			.on("click", function (event, d) {
				const clickedPublisher = d.data[0];
				const genreData = prepareGenreData(data, clickedPublisher);

				updateVizDetail(clickedPublisher);

				if (genreData.length) {
					currentData = genreData;
					updatePieChart(currentData);
					backButton.style("display", "block");
				}
				event.stopPropagation();
			});

		slicesEnter.append("text")
			.attr("transform", d => `translate(${labelArc.centroid(d)})`)
			.attr("dy", "0.35em")
			.style("text-anchor", "middle")
			.text(d => d.data[0])
			.style("display", d => (d.endAngle - d.startAngle < 0.1 ? "none" : "block"));

		// Update
		slices.select("path")
			.transition()
			.duration(1000)
			.attr("d", arc);

		slices.select("text")
			.transition()
			.duration(1000)
			.attr("transform", d => `translate(${labelArc.centroid(d)})`)
			.text(d => d.data[0]);


		// Exit
		slices.exit()
			.remove();

		addLegend(newData);
	}

	function addLegend(newData) {
		d3.select("#legend-group").remove();

		// Add legend group
		const legendGroup = svg.append("g")
			.attr("id", "legend-group")
			.attr("transform", `translate(${width - 250}, 30)`);

		const legendItems = legendGroup.selectAll(".legend-item")
			.data(newData)
			.enter().append("g")
			.attr("class", "legend-item")
			.attr("transform", (d, i) => `translate(0, ${i * 20})`);

		// Add legend color boxes
		legendItems.append("rect")
			.attr("width", 14)
			.attr("height", 14)
			.attr("fill", d => color(d[0]));

		// Add legend text
		legendItems.append("text")
			.attr("x", 16)
			.attr("y", 10)
			.style("font-size", "16px")
			.attr("alignment-baseline", "middle")
			.text(d => d[0]);

		const legendBBox = legendGroup.node().getBBox();

		// Add a border around the legend
		legendGroup.insert("rect", ":first-child")
			.attr("x", legendBBox.x - 10)
			.attr("y", legendBBox.y - 10)
			.attr("width", legendBBox.width + 20)
			.attr("height", legendBBox.height + 20)
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("stroke-width", 1.5);
	}
	updatePieChart(currentData);
}

function updateVizDetail(publisher) {
	const contentElement = document.querySelector('#regional-sales');
	const publisherData = {
		'Nintendo': "Founded in 1889, Nintendo is known for its iconic franchises like Mario and Zelda. Famous for the Wii and Switch consoles, Nintendo excels in creating family-friendly games.",
		'Electronic Arts': "Established in 1982, EA is famous for franchises like FIFA and Madden NFL. Known for its realistic sports games and engaging storytelling.",
		'Activision': "Founded in 1979, Activision is best known for the Call of Duty franchise. Considered a leader in high-quality graphics and multiplayer experiences.",
		'Sony Computer Entertainment': "Since 1993, Sony's PlayStation consoles have dominated the market with exclusives like Gran Turismo and Uncharted. Acclaimed for immersive graphics and storytelling.",
		'Ubisoft': "Ubisoft, founded in 1986, is acclaimed for its open-world series Assassin's Creed and Far Cry. The company delivers expansive, interactive gaming experiences.",
		'Take-Two Interactive': "Known for Grand Theft Auto and Red Dead series, Take-Two is celebrated for vast open-world games with rich narratives.",
		'THQ': "THQ was renowned for licensed titles like WWE and SpongeBob. Focused on delivering entertainment for a broad audience.",
		'Konami Digital Entertainment': "Konami, founded in 1969, is known for Metal Gear Solid and Silent Hill. Famous for storytelling and innovative gameplay.",
		'Sega': "Founded in 1960, Sega is best known for Sonic the Hedgehog. Produces beloved titles engaging generations of gamers.",
		'Namco Bandai Games': "Recognized for Tekken and Pac-Man, Namco Bandai excels at arcade-style games that capture wide appeal."
	};

	const customContent = publisherData[publisher] || contentElement;

	if (publisher in publisherData) {
		contentElement.innerHTML = `Publisher: <b>${publisher}</b><br><br>${customContent}`;
	}
}