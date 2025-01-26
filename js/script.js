document.addEventListener('DOMContentLoaded', function () {
	console.log("Page Loaded");

	let console_sales_comparision_svg = d3.select("#console_sales_comparision_svg");
	let games_library_svg = d3.select("#games_library_svg");
	let regional_console_sales_svg = d3.select("#regional_console_sales_svg");
	let user_reviews_svg = d3.select("#user_reviews_svg");
	let genre_popularity_svg = d3.select("#genre_popularity_svg");

	loadDataset().then(data => {
		loadGamesLibrary(data, games_library_svg);
		loadRegionalConsoleSales(data, 'regional_console_sales_svg');
		loadGenrePopularity(data, 'genre_popularity_svg');
		loadGenreTrends(data, 'genre_trends_svg');
		loadTopPublishersGenreHeatmap(data, '#heatmap_svg', 10);
	});


});


// Load the dataset
function loadDataset() {
	return d3.csv('/D3_Cracking-the-gaming-industry/data/vgsales.csv')
		.then(data => {
			return data;
		})
		.catch(error => {
			console.error(`Error loading dataset: ${error}`);
			throw error;
		});
}
