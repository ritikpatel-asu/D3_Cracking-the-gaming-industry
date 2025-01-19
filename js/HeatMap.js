function loadTopPublishersGenreHeatmap(data, svgSelector, topN = 10) {
	const publisherGenreData = {};
	const publisherTotalCounts = {};

	// Calculate counts and accumulate sales data
	data.forEach(d => {
		const publisher = d.Publisher;
		const genre = d.Genre;
		const NA_Sales = parseFloat(d.NA_Sales) || 0; // Convert to number or default to 0
		const Global_Sales = parseFloat(d.Global_Sales) || 0;
		const JP_Sales = parseFloat(d.JP_Sales) || 0;
		const EU_Sales = parseFloat(d.EU_Sales) || 0;
		const Other_Sales = parseFloat(d.Other_Sales) || 0;

		if (publisher && genre) {
			// Initialize data structure for the publisher and genre if not already present
			if (!publisherGenreData[publisher]) publisherGenreData[publisher] = {};
			if (!publisherGenreData[publisher][genre]) {
				publisherGenreData[publisher][genre] = {
					count: 0,
					sales: {
						NA_Sales: 0,
						Global_Sales: 0,
						JP_Sales: 0,
						EU_Sales: 0,
						Other_Sales: 0
					}
				};
			}
			if (!publisherTotalCounts[publisher]) publisherTotalCounts[publisher] = 0;

			// Increment the count
			publisherGenreData[publisher][genre].count++;
			publisherTotalCounts[publisher]++;

			// Accumulate sales data
			publisherGenreData[publisher][genre].sales.NA_Sales += NA_Sales;
			publisherGenreData[publisher][genre].sales.Global_Sales += Global_Sales;
			publisherGenreData[publisher][genre].sales.JP_Sales += JP_Sales;
			publisherGenreData[publisher][genre].sales.EU_Sales += EU_Sales;
			publisherGenreData[publisher][genre].sales.Other_Sales += Other_Sales;
		}
	});


	const topPublishers = Object.entries(publisherTotalCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, topN)
		.map(d => d[0]);

	const heatmapData = [];
	Object.entries(publisherGenreData).forEach(([publisher, genres]) => {
		if (topPublishers.includes(publisher)) {
			Object.entries(genres).forEach(([genre, data]) => {
				const percentage = ((data.count / publisherTotalCounts[publisher]) * 100).toFixed(2);
				heatmapData.push({
					publisher,
					genre,
					count: data.count,
					NA_Sales: data.sales.NA_Sales,
					JP_Sales: data.sales.JP_Sales,
					EU_Sales: data.sales.EU_Sales,
					Global_Sales: data.sales.Global_Sales,
					Other_Sales: data.sales.Other_Sales,
					percentage
				});
			});
		}
	});


	const genres = Array.from(new Set(heatmapData.map(d => d.genre)));

	const margin = { top: 100, right: 20, bottom: 100, left: 150 };
	const width = 1000 - margin.left - margin.right;
	const height = 700 - margin.top - margin.bottom;

	const svg = d3.select(svgSelector)
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	const x = d3.scaleBand().domain(genres).range([0, width]).padding(0.1);
	const y = d3.scaleBand().domain(topPublishers).range([0, height]).padding(0.1);
	const color = d3.scaleSequential(d3.interpolateBlues)
		.domain([0, d3.max(heatmapData, d => +d.percentage)]);

	svg.append("g")
		.attr("class", "x-axis")
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x))
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-0.8em")
		.attr("dy", "0.15em")
		.attr("transform", "rotate(-45)");

	svg.append("g")
		.attr("class", "y-axis")
		.call(d3.axisLeft(y));

	// Add X axis label
	svg.append("text")
		.attr("x", width / 2)
		.attr("y", height + margin.bottom - 20)
		.attr("text-anchor", "middle")
		.style("font-size", "14px")
		.style("font-weight","bold")
		.text("Publisher - Genre");

	// Add Y axis label
	svg.append("text")
		.attr("x", -height / 2 - 50)
		.attr("y", -margin.left + 50)
		.attr("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.style("font-size", "16px")
		.style("font-weight","bold")
		.text("Sales Metrics");

	const tooltip = d3.select("body").append("div")
		.attr("class", "tooltip");

	let selectedCells = [];

	svg.selectAll(".tile")
		.data(heatmapData)
		.enter()
		.append("rect")
		.attr("x", d => x(d.genre))
		.attr("y", d => y(d.publisher))
		.attr("width", x.bandwidth())
		.attr("height", y.bandwidth())
		.style("fill", d => color(d.percentage))
		.style("stroke", "#fff")
		.on('click', function (event, d) {
			if (selectedCells.length < 2) {
				selectedCells.push(d);
				d3.select(this).style('stroke', 'red');
			} else {
				selectedCells.forEach(cell => {
					svg.selectAll("rect").filter(cd => cd === cell).style('stroke', '#fff');
				});

				selectedCells = [selectedCells[1], d];

				svg.selectAll("rect").filter(cd => cd === selectedCells[0]).style('stroke', 'red');
				d3.select(this).style('stroke', 'red');
			}

			if (selectedCells.length === 2) {
				plotMirroredComparison(selectedCells);
			}
		})
		.on('mouseover', function (event, d) {
			tooltip.transition().duration(200).style('opacity', 0.9);
			tooltip.style('visibility', 'visible')
				.html(`
                    <strong>Publisher:</strong> ${d.publisher}<br>
                    <strong>Genre:</strong> ${d.genre}<br>
                    <strong>Games:</strong> ${d.count}<br>
                    <strong>Percentage:</strong> ${d.percentage}%
                `);
		})
		.on('mousemove', function (event) {
			tooltip.style('top', `${event.pageY - 10}px`)
				.style('left', `${event.pageX + 10}px`);
		})
		.on('mouseout', function () {
			tooltip.transition().duration(500).style('opacity', 0);
		});

	function plotMirroredComparison(cells) {
		// Data for comparison
		const comparisonData = cells.map(d => ({
			category: `${d.publisher} - ${d.genre}`,
			metrics: {
				"NA Sales": d.NA_Sales,
				"EU Sales": d.EU_Sales,
				"JP Sales": d.JP_Sales,
				"Global Sales": d.Global_Sales,
				"Other Sales": d.Other_Sales
			}
		}));

		const salesMetrics = Object.keys(comparisonData[0].metrics);

		// Set dimensions and margins
		const marginComp = { top: 100, right: 20, bottom: 100, left: 150 };
		const widthComp = 800 - marginComp.left - marginComp.right;
		const heightComp = 600 - marginComp.top - marginComp.bottom;

		const svgComp = d3.select("#comparison_container").html("")
			.append("svg")
			.attr("width", widthComp + marginComp.left + marginComp.right)
			.attr("height", heightComp + marginComp.top + marginComp.bottom)
			.append("g")
			.attr("transform", `translate(${marginComp.left},${marginComp.top})`);

		// Create X scale
		const xScale = d3.scaleBand()
			.range([0, widthComp])
			.domain(comparisonData.map(d => d.category))
			.padding(0.1);

		// Create Y scale
		const yScale = d3.scaleBand()
			.range([0, heightComp])
			.domain(salesMetrics)
			.padding(0.5);

		// Create color scale for bars
		const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

		// Add X axis
		svgComp.append("g")
			.attr("transform", `translate(0,${heightComp})`)
			.call(d3.axisBottom(xScale))
			.selectAll("text").attr("dx", "4em")
			.style("text-anchor", "end");

		// Add Y axis
		svgComp.append("g")
			.attr("transform", `translate(${widthComp / 2},0)`)
			.call(d3.axisLeft(yScale))
			.selectAll("text")
			.attr("dy", "0.2em")
			.attr("x", -10)
			.style("text-anchor", "end")
			.style("font-size", "12px");

		// Add X axis label
		svgComp.append("text")
			.attr("x", widthComp / 2)
			.attr("y", heightComp + marginComp.bottom - 20)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text("Publisher - Genre");

		// Add Y axis label
		svgComp.append("text")
			.attr("x", -heightComp / 2)
			.attr("y", -marginComp.left + 50)
			.attr("text-anchor", "middle")
			.attr("transform", "rotate(-90)")
			.style("font-size", "14px")
			.text("Sales Metrics");

		const salesScale = d3.scaleLinear()
			.domain([0, d3.max(comparisonData, d => d3.max(salesMetrics.map(metric => d.metrics[metric])))])
			.range([0, xScale.bandwidth() - 70]);

		// Draw Bars 
		svgComp.selectAll(".right-bar-group")
			.data(comparisonData)
			.enter()
			.append("g")
			.attr("class", "right-bar-group")
			.attr("transform", d => `translate(${xScale(d.category) + 30},0)`)
			.selectAll("rect")
			.data(d => salesMetrics.map(metric => ({
				metric,
				value: d.metrics[metric],
				category: d.category
			})))
			.enter()
			.append("rect")
			.attr("y", d => yScale(d.metric) + yScale.bandwidth() * 0.25)
			.attr("height", yScale.bandwidth() * 0.5)
			.attr("x", 0)
			.attr("width", d => d.value >= 0 ? salesScale(d.value) : 0)
			.style("fill", d => colorScale(d.metric));
	}
}

