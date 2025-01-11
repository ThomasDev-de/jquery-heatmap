# jQuery Heatmap Plugin

This jQuery plugin generates a visually appealing and interactive heatmap visualization. It allows you to represent data intensity using color variations, providing a clear and concise overview of your dataset.

![heatmap](demo/heatmap.png)
## Features

* **Data-Driven Visualization:** Displays data as a heatmap, where color intensity corresponds to data values.
* **Dynamic Data Handling:** Supports both static data arrays and dynamic data fetching via AJAX requests. Includes built-in handling for query parameters.
* **Customizable Appearance:** Offers flexible options to customize cell size, gutter spacing, and the color gradient used for the heatmap.
* **Year and Locale Support:** Handles different years and locales correctly, including automatic adjustment of the first day of the week.
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
       // ... other options
   });
   ```

## Options

* `data`: An array of data objects or a URL for fetching data. Each data object should have a `date` and a `count` property. For URLs, the plugin uses an AJAX GET request.
* `gutter`: The spacing between cells. Can be specified in pixels or other CSS units. Defaults to `2px`.
* `cellSize`: The size of each heatmap cell. Defaults to `14px`.
* `queryParams`: A function that returns an object of query parameters to be sent with the AJAX request (if `data` is a URL). Receives any parameters passed to the `setData` method.
* `colors`: An object defining the color gradient. Keys represent percentages (0-1), and values are the corresponding color codes.
* `year`: The year to display. Defaults to the current year.
* `locale`: The locale to use for formatting. Defaults to 'en-US'.


## Methods

* `setData(data)`: Updates the heatmap with new data. Accepts the same data format as the `data` option.

## Example

```javascript
$('#heatmap-container').heatmap({
   data: 'data.json',
   gutter: 4,
   cellSize: 16,
   colors: {
      0: '#f0f0f0',
      0.5: '#00ff00',
      1: '#0000ff'
   }
});
```

## Contributing

Contributions are welcome! Please feel free to submit bug reports, feature requests, or pull requests.