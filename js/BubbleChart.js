function loadGamesLibrary(data, games_library_svg) {
	const platformCounts = Array.from(
		d3.rollups(
			data,
			(v) => ({
				count: v.length,
				totalSales: d3.sum(v, (d) => +d.Global_Sales),
				totalNASales: d3.sum(v, (d) => +d.NA_Sales),
				yearRange: `${d3.min(v, (d) => +d.Year)} - ${d3.max(v, (d) => +d.Year)}`,
				publishers: Array.from(new Set(v.map((d) => d.Publisher))) // Unique publishers
			}),
			(d) => d.Platform
		),
		([platform, { count, totalSales, totalNASales, yearRange, publishers }]) => ({
			platform,
			count,
			totalSales,
			totalNASales,
			yearRange,
			publishers
		})
	);

	// Set up dimensions and margins
	const width = 800;
	const height = 600;

	//  Define scales
	const sizeScale = d3
		.scaleSqrt()
		.domain([0, d3.max(platformCounts, (d) => d.count)])
		.range([20, 75]);

	// Create the SVG container
	const svg = games_library_svg
		.attr("width", width)
		.attr("height", height);

	// Create a tooltip element
	const tooltip = d3.select("body").append("div")
		.attr("class", "tooltip");

	const simulation = d3.forceSimulation(platformCounts)
		.force("x", d3.forceX(width / 2).strength(0.05))
		.force("y", d3.forceY(height / 1.75).strength(0.05))
		.force(
			"collision",
			d3.forceCollide().radius((d) => sizeScale(d.count) + 5)
		)
		.on("tick", ticked);

	// Add bubbles
	const bubbles = svg
		.selectAll("circle")
		.data(platformCounts)
		.join("circle")
		.attr("r", (d) => sizeScale(d.count))
		.attr("fill", (d, i) => d3.schemeCategory10[i % 10])
		.attr("stroke", function () {
			return d3.select(this).style("fill");
		})
		.attr("stroke-width", 1.5);

	bubbles
		.on("mouseover", function (event, d) {
			tooltip.transition()
				.duration(200)
				.style('opacity', 0.9);

			tooltip.html(`
					<strong>Platform:</strong> ${d.platform}<br>
					<strong>Count:</strong> ${d.count}<br>
					<strong>Global Sales:</strong> ${d.totalSales.toFixed(2)} million
				`);

			d3.select(this)
				.attr("stroke", "black")
				.attr("r", sizeScale(d.count) * 1.2)
				.attr("stroke-width", 3);
		})
		.on("mousemove", function (event) {
			tooltip
				.style("top", `${event.pageY + 10}px`)
				.style("left", `${event.pageX + 10}px`);
		})
		.on("mouseout", function (event, d) {
			tooltip.transition().duration(500).style('opacity', 0);

			d3.select(this)
				.attr("stroke", function () {
					return d3.select(this).style("fill");
				})
				.attr("r", sizeScale(d.count))
				.attr("stroke-width", 1.5);
		})
		.on("click", function (event, d) {
			d3.select(this)
				.transition()
				.duration(200)
				.attr("r", (d) => sizeScale(d.count) * 1.5)
				.transition()
				.duration(200)
				.attr("r", (d) => sizeScale(d.count));

			d3.select("#games_library_detail").html(`
				<strong>Platform:</strong> ${d.platform}<br>
				<strong>Count:</strong> ${d.count}<br>
				<strong>Global Sales:</strong> $ ${d.totalSales.toFixed(2)} million<br>
				<strong>NA Sales:</strong> $ ${d.totalNASales.toFixed(2)} million<br>
				<strong>Year Range:</strong> ${d.yearRange}<br>
				<strong>Publishers:</strong> ${d.publishers.slice(0, 5).join(", ")}
			`);
		});

	d3.select("#search").on("input", function () {
		const query = this.value.toLowerCase();

		svg.selectAll("circle")
			.data(platformCounts)
			.transition()
			.duration(1000)
			.attr("cx", (d) => d.x)
			.attr("cy", (d) => d.y)
			.style("opacity", (d) => {
				const platformMatch = d.platform.toLowerCase().includes(query);
				const publisherMatch = d.publishers.some((publisher) =>
					publisher.toLowerCase().includes(query)
				);
				return platformMatch || publisherMatch ? 1 : 0.2;
			});
	});

	// Add labels
	const labels = svg
		.selectAll("text")
		.data(platformCounts)
		.join("text")
		.attr("text-anchor", "middle")
		.style("font-size", "14px")
		.style("fill", "white")
		.text((d) => `${d.platform}`);

	function ticked() {
		bubbles
			.attr("cx", (d) => d.x)
			.attr("cy", (d) => d.y);

		labels
			.attr("x", (d) => d.x)
			.attr("y", (d) => d.y);
	}
}