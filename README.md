# jQuery Heatmap Plugin

This jQuery plugin generates a visually appealing and interactive heatmap visualization.
It maps data intensity to color variations, providing an intuitive overview of your dataset.

![Heatmap](demo/heatmap.png)

---

## Features

- **Data-Driven Visualization:** Displays data in a heatmap where the color intensity corresponds to data values.
- **Dynamic Data Handling:** Supports both static data arrays and dynamic data fetching via AJAX requests.
- **Custom Query Parameters:** Define additional query parameters dynamically using the `queryParams` function without
  overriding standard values like `startDate` and `endDate`.
- **Customizable Design:** Adjust cell sizes, the gap (gutter) between cells, and color gradients.
- **Localization Support:** Automatically adjusts week start days and date formatting based on locale settings.
- **Interactive Tooltips:** Displays tooltips with date and associated data values when hovering over cells.
- **Comprehensive Error Handling:** Handles errors from data fetching or invalid input gracefully.
- **Easy Integration:** Designed with an intuitive jQuery syntax for effortless integration into web projects.

---

## What's New in Version 1.0.3

1. **Default Date Values:**
    - Removed outdated options `startDate` and `endDate`. Date handling is now fully dynamic based on the provided data.

2. **Query Parameters (`queryParams`):**
    - A new function allows users to add query parameters dynamically as part of the query string.

3. **Week Calculation:**
    - Weeks are now calculated dynamically without the need for `startDate` or `endDate` configuration.

4. **Enhanced Color Mapping:**
    - Define color gradients for different data intensity levels with flexible customization.

5. **Debugging Option:**
    - A new `debug` option allows you to log settings and queries to the browser console.

6. **Automatic First Day of the Week:**
    - The plugin determines the first day of the week automatically based on the provided locale.

---
## Requirements

- **jQuery:** Requires jQuery 3.6 or higher.
- **Moment:** Requires moment-with-locales.min.js ^2. Moment.js is required to reliably determine the first day of the week (e.g., Monday or Sunday).
- **Browser Compatibility:** Works on modern browsers with JavaScript enabled.
- **Dependencies:** No additional external libraries required.
---
## Installation

1. **Include jQuery and the Heatmap Plugin:**
   ```html
   <script src="/vendor/components/jquery/jquery.min.js"></script>
   <script src="/vendor/moment/moment/min/moment-with-locales.min.js"></script>
   <script src="dist/jquery.heatmap.min.js"></script>
   ```

2. **Create a Container Element:**
   ```html
   <div id="heatmap-container"></div>
   ```

3. **Initialize the Plugin:**
   ```javascript
   $('#heatmap-container').heatmap({
       data: [/* Your data array or API URL */],
       // Dates automatically inferred from data, or configurable if necessary,
       // Example: startDate: '2023-01-01', endDate: '2023-12-31',
       locale: 'en-US',
       // ...other options
   });
   ```

---

## Options

| Option               | Description                                                                                                  | Default Value                                                              |
|----------------------|--------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| **`data`**           | Array of data points or a URL from which data will be fetched.                                               | `null`                                                                     |
| **`queryParams`**    | Function for adding query parameters dynamically (e.g., `{ locale: 'en-US' }`).                              | `() => {}`                                                                 |
| **`cellSize`**       | The size of each heatmap cell in pixels.                                                                     | `14px`                                                                     |
| **`colors`**         | An object defining the heatmap's color gradient. Keys are thresholds between `0` and `1`. Values are colors. | See gradient below                                                         |
| **`locale`**         | Locale for displaying dates and determining the first day of the week.                                       | `en-US`                                                                    |
| **`debug`**          | If `true`, settings and queries are logged to the console.                                                   | `false`                                                                    |
| **`titleFormatter`** | A function to format the tooltip content, receiving locale, date, and count as arguments.                    | `(locale, date, count) => date.toLocaleDateString(locale) + " - " + count` |

---

## Methods

### Initialize:

```javascript
$('#heatmap-container').heatmap(options);
```

### Update Settings:

```javascript
$('#heatmap-container').heatmap('updateOptions', {
    data: [...urlOrDataSet],
    cellSize: 30,
    ...
});
```

---

### Events

This plugin supports specific events, allowing developers to respond to various states and actions.

- **`init.heatmap`**  
  Triggered after the heatmap has been successfully initialized.  
  Example:
  ```javascript
  $('#heatmap').on('init.heatmap', function (event, element) {
      console.log('Heatmap has been initialized!', element);
  });
  ```

- **`post.heatmap`**  
  Triggered after the heatmap has been fully rendered, including all data and visual elements. The event includes the element and the rendered data.  
  Example:
  ```javascript
  $('#heatmap').on('post.heatmap', function (event, element, data) {
      console.log('Heatmap rendering completed!', element);
      console.log('Rendered data:', data);
  });
  ```

---

## Example

### Simple Data Initialization:

```javascript
$('#heatmap-container').heatmap({
    data: [
        {date: '2024-01-01', count: 5},
        {date: '2024-01-02', count: 10},
        // Dynamic date handling relies on this data array
    ],

    startDate: '2024-01-01',
    endDate: '2024-12-31',
    colors: {
        0: '#ebedf0',
        0.25: '#c6e48b',
        0.5: '#7bc96f',
        0.75: '#239a3b',
        1: '#196127'
    },
});
```

### Query Parameters Example:

Include additional query parameters dynamically using the `queryParams` function:

```javascript
$('#heatmap-container').heatmap({
    data: '/api/data',
    queryParams: () => {
        return {
            locale: 'en-US',
            userId: 123, // Add custom parameters
        };
    },
});
```

---

## Debugging

Enable debugging to log data and settings in the browser console.
This can be useful for development and error diagnosis:

```javascript
$('#heatmap-container').heatmap({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
});
```

---

### Heatmap Color Customization

The `colors` option in the heatmap plugin defines the color intensity mapping for the heatmap cells.
The colors represent different intensity levels based on the data provided.
Each key in the `colors` object is a threshold between `0` and `1`,
and the corresponding value is the color that will be applied.

---

#### Default Color Mapping

By default, the plugin provides the following color mapping:

```
colors: {
    0: '#ebedf0',   // No intensity (lowest)
    0.25: '#c6e48b', // Low intensity
    0.5: '#7bc96f',  // Medium intensity
    0.75: '#239a3b', // High intensity
    1: '#196127'     // Maximum intensity
}
```

- **0:** This corresponds to no activity or zero intensities and typically uses a light, almost "empty" color.
- **1:** This is the highest activity or maximum intensity and uses the most vibrant or darkest defined color.
- Intermediate thresholds (e.g., `0.25`, `0.5`, and `0.75`) use colors to provide a gradient effect.

---

#### How Colors Work

Each value (`count`) in your data is converted to a relative intensity based on the range of the data
(minimum to maximum counts).
The plugin calculates the position of the data point and determines the corresponding color from the `colors` map.

The calculation respects the following principles:
- **Logarithmic scaling:** Data is scaled logarithmically to ensure even distribution of color across high-variable datasets.
- **Clamping:** Values below the minimum or above the maximum are clamped to use the lowest or highest defined colors, respectively.

---

#### Example: Custom Color Mapping

You can provide your own custom mapping of thresholds to colors based on the specific requirements of your heatmap visualization.
Here's an example:

```javascript
$('#heatmap-container').heatmap({
    colors: {
        0: '#f0f0f0',  // No intensity
        0.3: '#add8e6', // Light blue for low intensity
        0.6: '#0000ff', // Blue for medium intensity
        1: '#00008b'    // Dark blue for high intensity
    }
});
```

In this example:
- Data points that correspond to approximately 30% of the maximum intensity will appear light blue.
- Data points at 60% of the maximum intensity will appear as medium blue.
- The highest intensity will appear as dark blue.

---

#### Gradient Tipps

- Use light colors for low thresholds (e.g., `0`) and darker or more vibrant colors for high thresholds (e.g., `1`) to provide a clear visual hierarchy.
- The `colors` object supports any CSS-compatible color format, such as HEX (`#ffffff`), RGB (`rgb(255, 255, 255)`), or named colors (`red`).
- For large datasets with higher variability, consider using more intermediate threshold levels to create a smoother gradient.

---

#### Example: Smooth Gradient

For a smoother gradient with multiple intermediate values:

```javascript
$('#heatmap-container').heatmap({
    colors: {
        0: '#ffffff',  // White (lowest intensity)
        0.1: '#f7d7d0',
        0.2: '#f0a29a',
        0.5: '#e55241',
        0.75: '#be2d1b',
        1: '#7a1410'   // Dark red (highest intensity)
    }
});
```

The more intermediate values you define, the smoother the gradient will appear.

By customizing the `colors` option,
you can tailor the heatmap's appearance to fit your project's visual requirements more effectively.

---

## Contributing

Contributions are welcome! Feel free to report bugs, request features, or submit pull requests.

---

## License

This plugin is available under the [MIT Licence](LICENSE).
