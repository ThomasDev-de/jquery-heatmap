# jQuery Heatmap Plugin

This jQuery plugin generates a visually appealing and interactive heatmap visualization. It allows you to represent data intensity using color variations, providing a clear and concise overview of your dataset.

![heatmap](demo/heatmap.png)

## Features

* **Data-Driven Visualization:** Displays data as a heatmap, where color intensity corresponds to data values.
* **Dynamic Data Handling:** Supports both static data arrays and dynamic data fetching via AJAX requests. The `year` parameter is sent as a query parameter when fetching data dynamically.
* **Customizable Appearance:** Offers flexible options to customize cell size, gutter spacing, and the color gradient used for the heatmap.
* **Locale Support:** Handles different locales correctly, including automatic adjustment of the first day of the week.
* **Interactive Tooltips:** Provides tooltips on hover over each cell, displaying the date and corresponding data value.
* **Improved Error Handling:** Robust error handling for data fetching and proper handling of invalid data.
* **Easy Integration:** Simple and intuitive jQuery plugin syntax for seamless integration into your web projects.

## Usage

1. **Include jQuery and the Heatmap Plugin:**
   ```html
   <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
   <script src="jquery.heatmap.js"></script>
   ```

2. **Create a container element:**
   ```html
   <div id="heatmap-container"></div>
   ```

3. **Initialize the plugin:**
   ```javascript
   $('#heatmap-container').heatmap({
       data: [/* Your data array or URL */],
       year: 2024, // Example year parameter
       // ... other options
   });
   ```

## Options

* `data`: An array of data objects or a URL for fetching data. Each data object should have a `date` and a `count` property. For URLs, the plugin uses an AJAX GET request with the provided `year` parameter.
* `year`: The year to display. If `data` is a URL, this value is sent as a query parameter with the AJAX request. Defaults to the current year.
* `gutter`: The spacing between cells. Can be specified in pixels or other CSS units. Defaults to `2px`.
* `cellSize`: The size of each heatmap cell. Defaults to `14px`.
* `colors`: An object defining the color gradient. Keys represent percentages (0-1), and values are the corresponding color codes.
* `locale`: The locale to use for formatting. Defaults to 'en-US'.

## Methods

* `setData(data)`: Updates the heatmap with new data. Accepts the same data format as the `data` option. If you need to specify a different year for dynamic data fetching, update the `year` option directly using `.data('heatmapSettings', { year: newYear })` before calling `setData`.


## Example

```javascript
$('#heatmap-container').heatmap({
    data: 'data.json',
    year: 2024,
    gutter: 4,
    cellSize: 16,
    colors: {
        0: '#f0f0f0',
        0.5: '#00ff00',
        1: '#0000ff'
    }
});

// Example updating data and year
$('#heatmap-container').data('heatmapSettings', { year: 2025 });
$('#heatmap-container').heatmap('setData', newData); 
```

## Contributing

Contributions are welcome! Please feel free to submit bug reports, feature requests, or pull requests.