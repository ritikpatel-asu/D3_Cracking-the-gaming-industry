function loadGenrePopularity(data, genre_popularity_svg) {
	const salesByGenrePlatform = d3.rollup(
		data,
		v => d3.sum(v, d => parseFloat(d.Global_Sales)),
		d => d.Genre,
		d => d.Platform
	);

	const salesData = Array.from(salesByGenrePlatform, ([Genre, platforms]) => ({
		Genre,
		Platforms: Array.from(platforms, ([Platform, Global_Sales]) => ({ Platform, Global_Sales }))
	}));

	const platformSales = d3.rollup(
		data,
		v => d3.sum(v, d => parseFloat(d.Global_Sales)),
		d => d.Platform
	);

	const topPlatforms = Array.from(platformSales)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(d => d[0]);

	salesData.forEach(d => {
		d.Platforms = d.Platforms.filter(p => topPlatforms.includes(p.Platform));
	});

	const margin = { top: 20, right: 30, bottom: 100, left: 100 };
	const width = 1000 - margin.left - margin.right;
	const height = 700 - margin.top - margin.bottom;

	const svg = d3.select(`#${genre_popularity_svg}`)
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	const x0 = d3.scaleBand()
		.domain(salesData.map(d => d.Genre))
		.range([0, width])
		.padding(0.2);

	const x1 = d3.scaleBand()
		.domain(topPlatforms)
		.range([0, x0.bandwidth()])
		.padding(0.05);

	const y = d3.scaleLinear()
		.domain([0, d3.max(salesData, d => d3.max(d.Platforms, p => p.Global_Sales))])
		.nice()
		.range([height, 0]);

	svg.append("g")
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x0))
		.selectAll("text")
		.attr("font-size", "16px")
		.attr("transform", "rotate(-45)")
		.style("text-anchor", "end");

	svg.append("g")
		.call(d3.axisLeft(y))
		.selectAll("text")
		.attr("font-size", "16px");

	svg.append("text")
		.attr("x", width / 2)
		.attr("y", height + margin.bottom - 30)
		.attr("font-size", "20px")
		.attr("text-anchor", "middle")
		.text("Genre");

	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", -height / 2)
		.attr("y", -margin.left + 30)
		.attr("font-size", "20px")
		.attr("text-anchor", "middle")
		.text("Global Sales (in millions)");

	const color = d3.scaleOrdinal(d3.schemeCategory10);

	const tooltip = d3.select("body").append("div")
		.attr("class", "tooltip");

	const bars = svg.selectAll(".genre")
		.data(salesData)
		.enter().append("g")
		.attr("class", "genre")
		.attr("transform", d => `translate(${x0(d.Genre)},0)`)
		.selectAll("rect")
		.data(d => d.Platforms)
		.enter().append("rect")
		.attr("x", d => x1(d.Platform))
		.attr("y", d => y(d.Global_Sales))
		.attr("width", x1.bandwidth())
		.attr("height", d => height - y(d.Global_Sales))
		.attr("fill", d => color(d.Platform))
		.style("opacity", 1)
		.on("mouseover", function (event, d) {
			tooltip.transition().duration(200).style("opacity", 0.9);
			tooltip.html(`<strong>Platform:</strong> ${d.Platform}<br><strong>Sales:</strong> ${d.Global_Sales.toFixed(2)}M`)
				.style("left", (event.pageX + 5) + "px")
				.style("top", (event.pageY - 28) + "px");
			d3.select(this).style('fill', 'orange');
		})
		.on("mousemove", function (event) {
			tooltip.style("left", (event.pageX + 5) + "px").style("top", (event.pageY - 28) + "px");
		})
		.on("mouseout", function () {
			tooltip.transition().duration(500).style("opacity", 0);
			d3.select(this).style('fill', color(this.__data__.Platform));
		});

	const selectedPlatforms = new Set();

	const legend = svg.append("g")
		.attr("font-family", "sans-serif")
		.attr("font-size", 20)
		.attr("text-anchor", "end")
		.selectAll("g")
		.data(topPlatforms.slice().reverse())
		.enter().append("g")
		.attr("transform", (d, i) => `translate(0,${i * 35})`);

	legend.append('rect')
		.attr('x', width - 30)
		.attr('width', 55)
		.attr('height', 30)
		.attr('fill', color)
		.style("cursor", "pointer")
		.on("click", function (event, d) {
			if (selectedPlatforms.has(d)) {
				selectedPlatforms.delete(d);
			} else {
				selectedPlatforms.add(d);
			}

			bars.style("opacity", b => selectedPlatforms.size === 0 || selectedPlatforms.has(b.Platform) ? 1 : 0.2);
		});

	legend.append('text')
		.attr('x', width + 15)
		.attr('y', 9.5)
		.attr('dy', '10px')
		.text(d => d)
		.on("mouseover", function (event, d) {
			d3.select(this).style("cursor", "pointer");
		})
		.on("click", function (event, d) {
			if (selectedPlatforms.has(d)) {
				selectedPlatforms.delete(d);
			} else {
				selectedPlatforms.add(d);
			}

			bars
				.style("opacity", b => selectedPlatforms.size === 0 || selectedPlatforms.has(b.Platform) ? 1 : 0.2);
		});

	d3.select("body").on("click", function (event) {
		bars.transition().duration(500).style("opacity", 1);
	});
	legend.on("click", function (event) {
		event.stopPropagation();
	});
}
