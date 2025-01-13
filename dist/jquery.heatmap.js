/*!
 * Heatmap Plugin
 * Author: Your Name <t.kirsch@webcito.de>
 * Version: 1.0.1
 * License: MIT
 * Description: A jQuery plugin to create and render an interactive heatmap visualization.
 *
 * Usage:
 * - Initialize the heatmap on a jQuery element. For example: $('#heatmap').heatmap(settings);
 *
 * Settings:
 * - data (Array | String): Either an array of data points or a URL from which data can be fetched.
 * - startDate (String): The start date for the heatmap in the format 'YYYY-MM-DD' (default: first day of the current year).
 * - endDate (String): The end date for the heatmap in the format 'YYYY-MM-DD' (default: last day of the current year).
 * - locale (String): The locale identifier for date formatting and first day of the week calculation (default: 'en-US').
 * - cellSize (Number): The size of each day cell in pixels (default: 14px).
 * - gutter (String | Number): Space between cells or weeks (default: '2px').
 * - colors (Object): A map of contribution levels to colors (e.g. `{ 0: '#ebedf0', 1: '#196127' }`).
 * - queryParams (Function): A function returning additional query parameters for data fetching.
 * - debug (Boolean): If true, logs internal events and settings to the console (default: `false`).
 * - titleFormatter (Function): A function to format tooltips for heatmap cells.
 *
 * Methods:
 * - getSettings($el): Reads and returns the heatmap settings for a given element.
 * - getData($el): Fetches or provides the data for the heatmap. Can handle local arrays or fetch from URLs.
 * - calculateWeeks(startDate, endDate, firstDayOfWeek): Computes all weeks in the given time period.
 * - drawHeatmap($el): Creates the heatmap and draws it into the provided element.
 *
 * Example:
 * $('#heatmap').heatmap({
 *    data: 'https://example.com/data',
 *    startDate: '2023-01-01',
 *    endDate: '2023-12-31',
 *    locale: 'en-US',
 *    cellSize: 14,
 *    gutter: '4px',
 *    titleFormatter: (locale, date, count) => `${date.toLocaleDateString(locale)} - ${count}`,
 *    colors: {
 *        0: '#ebedf0',
 *        0.25: '#c6e48b',
 *        0.5: '#7bc96f',
 *        0.75: '#239a3b',
 *        1: '#196127'
 *    }
 * });
 *
 * Notes:
 * - The plugin automatically calculates the first day of the week based on the provided locale.
 * - Week calculations dynamically adapt to custom start and end dates.
 * - If data is provided via URL, query parameters for startDate, endDate, and any custom params are appended.
 */
(function ($) {
    const DEFAULTS = {
        // Neue Default-Werte:
        startDate: `${new Date().getFullYear()}-01-01`, // 1. Januar im aktuellen Jahr
        endDate: `${new Date().getFullYear()}-12-31`,   // 31. Dezember im aktuellen Jahr
        locale: 'en-US',
        debug: true,
        classes: 'border border-5 w-100 p-5',
        data: null,
        gutter: 2,
        cellSize: 14,
        colors: {
            0: '#ebedf0',   // Kein Wert
            0.25: '#c6e48b', // Bis 25%
            0.5: '#7bc96f',  // Bis 50%
            0.75: '#239a3b', // Bis 75%
            1: '#196127'     // Bis 100%
        },
        titleFormatter(locale, date, count) {
            return date.toLocaleDateString() + ' - ' + count;
        },
        queryParams(p) {
            return p;
        }
    };


    function init($el, settings) {
        const setup = $.extend({}, DEFAULTS, settings || {});

        setup.colors = setup.colors || DEFAULTS.colors;
        $el.data('heatmapSettings', setup);

        if (setup.debug) {
            console.log('heatmap:init:', $el.data('heatmapSettings'));
        }

        drawHeatmap($el);
    }

    function getSettings($el) {
        return $el.data('heatmapSettings');
    }

    async function getData($el) {
        const settings = getSettings($el);

        if (Array.isArray(settings.data)) {
            return Promise.resolve(settings.data); // Wenn Daten ein Array sind, direkt zurückgeben
        }

        let xhr = $el.data('xhr') || null;
        if (xhr && xhr.abort) {
            xhr.abort(); // Existierende Anfrage abbrechen
            xhr = null;
        }

        const query = {
            startDate: settings.startDate || `${new Date().getFullYear()}-01-01`,
            endDate: settings.endDate || `${new Date().getFullYear()}-12-31`,
        };

        // Benutzerdefinierte Query-Parameter einfügen
        const customQuery = typeof settings.queryParams === 'function' ? settings.queryParams() : {};
        const finalQuery = {
            ...customQuery, // Benutzerdefinierte Werte
            ...query,       // Standardwerte wie Start-/Enddatum
        };

        try {
            // Umstellung von $.get auf $.ajax
            xhr = $.ajax({
                url: settings.data, // URL aus den Einstellungen
                method: 'GET', // Entspricht $.get, da GET standardmäßig verwendet wird
                data: finalQuery, // Query-Parameter
                dataType: 'json', // Antwort-Datenformat festlegen
                beforeSend: function () {
                    if (settings.debug) {
                        console.log('getData: Anfrage gestartet.', finalQuery);
                    }
                },
            });

            $el.data('xhr', xhr); // Speichere die laufende Anfrage

            const response = await xhr; // Warte auf die Antwort

            if (settings.debug) {
                console.log('getData:result', response);
            }

            // Nach dem Abschluss: Zurücksetzen
            $el.data('xhr', null);
            return response;
        } catch (error) {
            // Fehlerbehandlung
            $el.data('xhr', null); // Anfrage zurücksetzen
            if (settings.debug) {
                console.error('getData:error', error);
            }
            throw error; // Fehler weitergeben
        }
    }

    // Berechnung aller Wochen eines Jahres (ink. angrenzender Wochen aus Vor- und Folgejahr)
    function calculateWeeks(startDate, endDate, firstDayOfWeek) {
        // Start- und Enddatum in JavaScript-Objekte konvertieren
        const start = getStartOfWeek(new Date(startDate), firstDayOfWeek);
        const end = getEndOfWeek(new Date(endDate), firstDayOfWeek);

        const weeks = [];
        let currentDate = new Date(start);
        let currentWeek = [];

        // Schleife durch alle Tage zwischen start und end
        while (currentDate <= end) {
            currentWeek.push(new Date(currentDate));

            // Wenn 7 Tage erreicht, füge die Woche hinzu und starte eine neue
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }

            currentDate.setDate(currentDate.getDate() + 1); // Zum nächsten Tag
        }

        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    }

    function getEndOfWeek(date, firstDayOfWeek) {
        const startOfWeek = getStartOfWeek(date, firstDayOfWeek);
        const end = new Date(startOfWeek);
        end.setDate(startOfWeek.getDate() + 6); // 6 Tage nach dem Startdatum
        end.setHours(23, 59, 59, 999); // Uhrzeit auf Ende des Tages setzen
        return end;
    }

    function getStartOfWeek(date, firstDayOfWeek) {
        const diff = (date.getDay() - firstDayOfWeek + 7) % 7; // Differenz zum Wochenstart berechnen
        const start = new Date(date);
        start.setDate(date.getDate() - diff); // Verschiebe das Datum auf den Wochenbeginn
        start.setHours(0, 0, 0, 0); // Uhrzeit auf Anfang des Tages setzen
        return start;
    }

    function drawHeatmap($el) {
        const settings = getSettings($el);

        // Validierung der Einstellungen
        if (!settings) {
            console.error('Keine Heatmap-Einstellungen gefunden, Abbruch');
            return;
        }

        const currentYear = new Date().getFullYear();
        const startDate = settings.startDate || `${currentYear}-01-01`;
        const endDate = settings.endDate || `${currentYear}-12-31`;

        console.log(`Heatmap-Zeitraum: ${startDate} bis ${endDate}`);

        const locale = settings.locale || 'en-US';
        const dayFormatter = new Intl.DateTimeFormat(locale, {weekday: 'short'});
        const monthFormatter = new Intl.DateTimeFormat(locale, {month: 'short'});
        const firstDayOfWeek = getFirstDayOfWeek(locale);

        // Zell- und Abstandseinstellungen
        let gutter = settings.gutter || '2px';
        if (typeof gutter === 'number') {
            gutter = `${gutter}px`;
        }
        const cellSize = settings.cellSize || 14;
        const cellSizePx = `${cellSize}px`;

        // Wochen und Daten vorbereiten
        const weeks = calculateWeeks(startDate, endDate, firstDayOfWeek);

        $el.empty();

        // Daten abrufen
        getData($el).then(rawData => {
            const data = Array.isArray(rawData) ? rawData : JSON.parse(rawData);

            if (!Array.isArray(data)) {
                throw new Error('Die erhaltenen Daten sind kein Array.');
            }

            // Daten einmalig in eine Map umwandeln (für schnelle Suche)
            const dataMap = new Map(data.map(entry => [entry.date, entry.count]));

            // Min- und Max-Werte berechnen
            const counts = data.map(entry => entry.count);
            const minCount = Math.min(...counts);
            const maxCount = Math.max(...counts);

            // Farben cachen
            const colorCache = {};

            function getCachedColor(count) {
                const cacheKey = `${count}-${minCount}-${maxCount}`;
                if (colorCache[cacheKey]) {
                    return colorCache[cacheKey];
                }

                const color = getContributionColor($el, count, minCount, maxCount);
                colorCache[cacheKey] = color;
                return color;
            }

            // Wochen vorbereiten (Tage mit Zählwerten verbinden)
            weeks.forEach(week => {
                week.forEach((day, index) => {
                    const dayKey = day.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
                    week[index] = {
                        date: day,
                        count: dataMap.get(dayKey) || 0, // Standardwert 0, falls kein Eintrag
                    };
                });
            });

            // Heatmap-Container erstellen
            const heatmapContainer = $('<div class="heatmap-wrapper"></div>');
            heatmapContainer.css({
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: gutter,
            });

            // Tagesnamen-Spalte (Montag, Dienstag, ...)
            const dayLabelColumn = $('<div class="day-labels"></div>');
            dayLabelColumn.css({
                display: 'grid',
                gridTemplateRows: `${cellSizePx} repeat(7, ${cellSizePx})`,
                marginRight: gutter,
                textAlign: 'right',
                rowGap: gutter,
            });
            dayLabelColumn.append('<div></div>'); // Platz für Monatsnamen oberhalb der Labels
            Array.from({length: 7}, (_, i) => (firstDayOfWeek + i) % 7).forEach(dayIndex => {
                const tempDate = new Date(2024, 0, Number(dayIndex));
                const label = $('<div class="day-label"></div>');
                label.text(dayFormatter.format(tempDate));
                label.css({
                    fontSize: '10px',
                    color: '#666',
                    lineHeight: cellSizePx,
                });
                dayLabelColumn.append(label);
            });

            heatmapContainer.append(dayLabelColumn);

            // Wochen und Zellen rendern
            const heatmapGrid = $('<div class="heatmap"></div>');
            heatmapGrid.css({
                display: 'flex',
                gap: gutter,
            });

            let lastRenderedMonth = -1;

            weeks.forEach(week => {
                const weekColumn = $('<div class="heatmap-week"></div>');
                weekColumn.css({
                    display: 'grid',
                    gridTemplateRows: `${cellSizePx} repeat(7, ${cellSizePx})`,
                    rowGap: gutter,
                });

                // Monatsnamen hinzufügen
                const currentMonth = week.find(d => d.date && d.date.getDate() === 1)?.date.getMonth();
                if (currentMonth !== undefined && currentMonth !== lastRenderedMonth) {
                    lastRenderedMonth = currentMonth;
                    const monthLabel = $('<div class="month-label"></div>');
                    monthLabel.text(monthFormatter.format(week.find(d => d.date && d.date.getDate() === 1).date));
                    monthLabel.css({
                        textAlign: 'center',
                        fontSize: `${Math.min(cellSize - 4, 12)}px`,
                        lineHeight: cellSizePx,
                        height: cellSizePx,
                        width: cellSizePx,
                    });
                    weekColumn.append(monthLabel);
                } else {
                    weekColumn.append('<div style="height: ' + cellSizePx + ';"></div>');
                }

                // Tageszellen rendern
                week.forEach(dayEntry => {
                    const cell = $('<div class="heatmap-cell"></div>');
                    cell.css({
                        width: cellSizePx,
                        height: cellSizePx,
                        backgroundColor: getCachedColor(dayEntry.count),
                        borderRadius: '2px',
                        cursor: 'pointer',
                    });

                    if (dayEntry.date) {
                        cell
                            .attr('data-bs-toggle', 'tooltip') // Bootstrap 5
                            .attr('data-bs-html', true) // Tooltip mit HTML
                            .attr(
                                'title',
                                settings.titleFormatter(settings.locale, dayEntry.date, dayEntry.count) || ''
                            );
                    }

                    weekColumn.append(cell);
                });

                heatmapGrid.append(weekColumn);
            });

            heatmapContainer.append(heatmapGrid);
            $el.append(heatmapContainer);
        }).catch(err => {
            console.error('Fehler beim Laden der Daten:', err);
            $el.append(`<div class="heatmap-error">${err.message || err}</div>`);
        }).finally(() => {
            $el.trigger('post.heatmap', [$el]);
        });
    }

// Unterstützungsfunktion: Ermitteln, ob die Woche mit Montag oder Sonntag startet
    function getFirstDayOfWeek(locale) {
        try {
            // Wochentage gemäß Locale prüfen (0 = Sonntag, 1 = Montag etc.)
            const formatter = new Intl.DateTimeFormat(locale, {weekday: 'long'});
            const sampleDate = new Date(2023, 0, 1); // Testdatum (Sonntag, 1. Januar 2023)

            const dayName = formatter.format(sampleDate); // Lokaler Name des Tages
            console.log('Locale-TagName:', dayName); // Für Debugging sicherstellen

            // Rückgabe des Wertes basierend auf Lokalisierung
            return dayName.toLowerCase().startsWith('sun') ? 0 : 1; // 0 = Sonntag, 1 = Montag

        } catch (error) {
            console.error('Fehler bei getFirstDayOfWeek:', error);
            return 1; // Default: Montag
        }
    }


// Unterstützungsfunktion: Farbskala für Contributions
    function getContributionColor($el, count, minCount, maxCount) {
        console.log('getContributionColor:settings', getSettings($el));
        const settings = getSettings($el) || {colors: {}}; // Fallback: Leeres `colors`-Objekt

        if (!settings.colors || Object.keys(settings.colors).length === 0) {
            // console.error('Fehlende Farb-Einstellungen in settings:', settings);
            return '#ff0000'; // Fallback-Farbe z. B. Rot
        }

        // Direkte Zuordnung für count = 0
        if (count === 0) {
            return settings.colors['0']; // Farbe für count = 0
        }

        const range = maxCount - minCount || 1; // Bereich berechnen
        let percentage = (count - minCount) / range; // Prozentwert berechnen

        // Begrenze percentage auf [0, 1]
        percentage = Math.max(0, Math.min(percentage, 1));

        const colorKeys = Object.keys(settings.colors)
            .map(Number) // Keys zu Zahlen
            .sort((a, b) => a - b); // Aufsteigend sortieren

        const matchedKey = colorKeys.find(key => percentage <= key) || Math.max(...colorKeys);

        // Debugprinzipien
        console.log({
            count,
            minCount,
            maxCount,
            range,
            percentage,
            matchedKey,
            color: settings.colors[matchedKey],
        });

        return settings.colors[matchedKey] || settings.colors['1']; // Fallback: Standardfarbe
    }

    $.fn.heatmap = function (options, params) {
        if ($(this).length > 1) {
            return $(this).each(function (i, element) {
                return $(element).heatmap(options, params);
            });
        }

        const $element = $(this);

        const methodCalled = typeof options === 'string';
        const isInitialized = $element.data('heatmapSettings');

        if (!isInitialized) {
            init($element, options);
        }

        // Rückgabewert für Methodenaufruf oder Initialisierung
        if (!methodCalled) {
            return $element; // Kein Methodenaufruf, Initialisierung abgeschlossen
        }

        switch (options) {
            case 'updateOptions': {
                const setup = $element.data('heatmapSettings');
                if (setup.debug) {
                    console.log('heatmap:updateOptions', params);
                }
                $element.data('heatmapSettings', $.extend({}, DEFAULTS, setup, params || {}));
                drawHeatmap($element);
            }
                break;
        }

        return $element;
    }
}(jQuery));
