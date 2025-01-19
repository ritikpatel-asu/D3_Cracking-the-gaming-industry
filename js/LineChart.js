function loadGenreTrends(data, genre_trends_svg) {
    const gamesByYearGenre = d3.rollup(
        data,
        v => v.length,
        d => +d.Year,
        d => d.Genre
    );

    const gamesData = Array.from(gamesByYearGenre, ([Year, genres]) => ({
        Year,
        Genres: Array.from(genres, ([Genre, Count]) => ({ Genre, Count }))
    })).filter(d => d.Year >= 2000 && d.Year <= 2016).sort((a, b) => a.Year - b.Year);

    // Get all unique genres
    const allGenres = Array.from(new Set(data.map(d => d.Genre)));

    // Set dimensions and margins for the SVG
    const margin = { top: 20, right: 150, bottom: -20, left: 50 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select(`#${genre_trends_svg}`)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(gamesData, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(gamesData, d => d3.max(d.Genres, g => g.Count))])
        .nice()
        .range([height, 0]);

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

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll("text")
        .attr("font-size", "14px");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("font-size", "14px");;

    // Add X axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Year");

    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Number of Games Released");

    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Count));

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

    allGenres.forEach(genre => {
        const genreData = gamesData.map(yearData => ({
            Year: yearData.Year,
            Count: (yearData.Genres.find(g => g.Genre === genre) || { Count: 0 }).Count
        }));

        const path = svg.append("path")
            .datum(genreData)
            .attr("fill", "none")
            .attr("stroke", color(genre))
            .attr("stroke-width", 1.5)
            .attr("d", line);

        path.attr("stroke-dasharray", function () {
            const length = this.getTotalLength();
            return `${length} ${length}`;
        })
            .attr("stroke-dashoffset", function () {
                return this.getTotalLength();
            })
            .transition()
            .duration(2000)
            .attr("stroke-dashoffset", 0);

        path.on('mouseover', function () {
            d3.select(this)
                .attr('stroke-width', 3)
                .attr("stroke-opacity", 1);
        })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 1.5)
                    .attr("stroke-opacity", 0.7);
            });

        svg.selectAll(`.dot-${genre}`)
            .data(genreData)
            .enter().append("circle")
            .attr("class", `dot-${genre}`)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d.Count))
            .attr("r", 4)
            .style("fill", color(genre))
            .style("opacity", 0)
            .transition()
            .delay((d, i) => i * 100)
            .duration(500)
            .style("opacity", 1);

        // Add hover interaction to enlarge dots
        svg.selectAll(`.dot-${genre}`)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8);
                tooltip.transition().duration(200).style('opacity', 0.9);
                tooltip.html(`Genre: ${genre}<br>Year: ${d.Year}<br>Count: ${d.Count}`)
                    .style('left', (event.pageX + 5) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 4);
                tooltip.transition().duration(500).style('opacity', 0);
            });


    });

    // Add legend
    const legend = svg.append("g")
        .attr('transform', `translate(${width + 40},0)`)
        .selectAll(".legend-item")
        .data(allGenres)
        .enter().append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0,${i * 30})`);

    legend.append('rect')
        .attr('width', 100)
        .attr('height', 25)
        .attr('fill', color)
        .on("click", function (event, genre) {
            const isVisible = d3.selectAll(`.dot-${genre}`).style("display") !== "none";
            d3.selectAll(`.dot-${genre}`).style("display", isVisible ? "none" : null);
            d3.selectAll(`path[stroke="${color(genre)}"]`).style("display", isVisible ? "none" : null);
        });

    legend.append('text')
        .attr('x', 7)
        .attr('y', 9.5)
        .attr("font-size", "16px")
        .attr('dy', '0.32em')
        .text(d => d)
        .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");
        }).on("click", function (event, genre) {
            const isVisible = d3.selectAll(`.dot-${genre}`).style("display") !== "none";
            d3.selectAll(`.dot-${genre}`).style("display", isVisible ? "none" : null);
            d3.selectAll(`path[stroke="${color(genre)}"]`).style("display", isVisible ? "none" : null);
        });
}