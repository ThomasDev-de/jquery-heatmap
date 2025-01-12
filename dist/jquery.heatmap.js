(function ($) {

    function getSettings($el) {
        return $el.data('heatmapSettings');
    }

    async function getData($el) {
        const settings = getSettings($el);

        // Wenn settings.data ein Array ist, direkt als Promise zurückgeben
        if (Array.isArray(settings.data)) {
            return Promise.resolve(settings.data);
        }

        // Abbrechen des bestehenden XMLHttpRequest, falls vorhanden.
        let xhr = $el.data('xhr') || null;
        if (xhr && xhr.abort) {
            xhr.abort();
            xhr = null;
        }

        const query = {
            year: settings.year || new Date().getFullYear()
        };

        try {
            xhr = $.get(settings.data, query);
            $el.data('xhr', xhr);

            // Die Antwort zurückgeben (auch wenn keine besonderen Änderungen gemacht werden)
            return await xhr;

        } catch (error) {
            // Optional: Fehler zurückwerfen oder `undefined` zurückgeben
            throw error;
        } finally {
            $el.data('xhr', null); // Reset des xhr-Datenobjekts
        }
    }

    // Berechnung aller Wochen eines Jahres (inkl. angrenzender Wochen aus Vor- und Folgejahr)
    function calculateWeeks(year, firstDayOfWeek) {
        // Startdatum: Der 1. Januar des Jahres
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);

        // Erster Tag der ersten Woche des Jahres
        const startOfFirstWeek = getStartOfWeek(startOfYear, firstDayOfWeek);

        // Letzter Tag der letzten Woche des Jahres
        const endOfLastWeek = getEndOfWeek(endOfYear, firstDayOfWeek);

        // Array für Wochen initialisieren
        const weeks = [];
        let currentDate = new Date(startOfFirstWeek);
        let currentWeek = [];

        // Schleife über den gesamten Zeitraum (von der ersten bis zur letzten Woche)
        while (currentDate <= endOfLastWeek) {
            currentWeek.push(new Date(currentDate)); // Füge den aktuellen Tag zur Woche hinzu

            // Wenn die Woche 7 Tage hat, speicher sie ins Wochenarray und starte eine neue Woche
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }

            // Zum nächsten Tag wechseln
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Letzte Woche hinzufügen, falls noch Tage übrig sind
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
        const diff = (date.getDay() - firstDayOfWeek + 7) % 7; // Differenz zum Wochenstart
        const start = new Date(date);
        start.setDate(date.getDate() - diff); // Verschiebe das Datum auf den Anfang der Woche
        start.setHours(0, 0, 0, 0); // Uhrzeit auf Beginn des Tages setzen
        return start;
    }

    function drawHeatmap($el) {
        const settings = getSettings($el);
        const year = settings.year || new Date().getFullYear();

        // Lokale Optionen
        const locale = settings.locale || 'en-US';
        const dayFormatter = new Intl.DateTimeFormat(locale, {weekday: 'short'});
        const monthFormatter = new Intl.DateTimeFormat(locale, {month: 'short'});
        const firstDayOfWeek = getFirstDayOfWeek(locale);

        // Gutter einstellen (Abstand zwischen den Elementen)
        let gutter = settings.gutter || '2px'; // Standardwert
        if (typeof gutter === 'number') {
            gutter = `${gutter}px`;
        } else if (!isNaN(parseFloat(gutter)) && !/[a-z%]+$/i.test(gutter)) {
            gutter = `${gutter}px`;
        }

        // Feldgröße einstellen
        const cellSize = settings.cellSize || 14; // Standardwert: 14px
        const cellSizePx = `${cellSize}px`; // Umwandlung für CSS

        // Dynamische Wochenberechnung
        const weeks = calculateWeeks(year, firstDayOfWeek);

        $el.empty();

        // Lade Daten und ordne sie den Tagen der Heatmap zu
        getData($el).then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Die erhaltenen Daten sind kein Array.');
            }

            // Min und Max Werte ermitteln
            const counts = data.map(entry => entry.count);
            const minCount = Math.min(...counts);
            const maxCount = Math.max(...counts);

            // Daten den Tagen zuordnen
            weeks.forEach(week => {
                week.forEach((day, index) => {
                    const matchingData = data.find(entry => {
                        const entryDate = new Date(entry.date);
                        return (
                            entryDate.getFullYear() === day.getFullYear() &&
                            entryDate.getMonth() === day.getMonth() &&
                            entryDate.getDate() === day.getDate()
                        );
                    });

                    // Falls Daten existieren, Eintrag speichern, sonst Standardwert setzen
                    week[index] = {
                        date: day,
                        count: matchingData ? matchingData.count : 0,
                    };
                });
            });

            // Hauptcontainer für die Heatmap
            const heatmapContainer = $('<div class="heatmap-wrapper"></div>');
            heatmapContainer.css({
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: gutter, // Abstand zwischen den Wochen
            });

            // Spalte für Tagesnamen (z. B. Mo, Di, ...)
            const dayLabelColumn = $('<div class="day-labels"></div>');
            dayLabelColumn.css({
                display: 'grid',
                gridTemplateRows: `${cellSizePx} repeat(7, ${cellSizePx})`, // Platz für Wochentage
                marginRight: gutter,
                textAlign: 'right',
                rowGap: gutter, // Vertikaler Abstand zwischen Labels
            });

            // Platz für den Monatsnamen über den Labels
            dayLabelColumn.append('<div></div>');

            // Tageslabels hinzufügen
            Array.from({length: 7}, (_, i) => (firstDayOfWeek + i) % 7).forEach(dayIndex => {
                const tempDate = new Date(2024, 0, dayIndex); // Dummy-Werte für die Tagesnamen
                const label = $('<div class="day-label"></div>');
                label.text(dayFormatter.format(tempDate));
                label.css({
                    fontSize: '10px',
                    color: '#666',
                    lineHeight: cellSizePx, // Gleiche Höhe wie Zellen
                });
                dayLabelColumn.append(label);
            });

            heatmapContainer.append(dayLabelColumn);

            // Haupt-Heatmap-Bereich
            const heatmapGrid = $('<div class="heatmap"></div>');
            heatmapGrid.css({
                display: 'flex',
                gap: gutter, // Horizontaler Abstand zwischen Wochen
            });

            let lastRenderedMonth = -1; // Für Monatswechselprüfung

            // Wochen rendern
            weeks.forEach((week) => {
                const weekColumn = $('<div class="heatmap-week"></div>');
                weekColumn.css({
                    display: 'grid',
                    gridTemplateRows: `${cellSizePx} repeat(7, ${cellSizePx})`, // Platz für Monatsnamen + Tage
                    rowGap: gutter, // Vertikaler Abstand zwischen Tagen
                });

                // Monatsbeschriftung
                const currentMonth = week.find(d => d.date && d.date.getDate() === 1)?.date.getMonth();

                if (currentMonth !== undefined && currentMonth !== lastRenderedMonth) {
                    lastRenderedMonth = currentMonth;

                    const monthLabel = $('<div class="month-label"></div>');
                    monthLabel.text(monthFormatter.format(week.find(d => d.date && d.date.getDate() === 1).date));
                    monthLabel.css({
                        textAlign: 'center',
                        fontSize: `${Math.min(cellSize - 4, 12)}px`, // Dynamische Schriftgröße, max 10px
                        lineHeight: cellSizePx, // Gleiche Höhe wie Zellen
                        height: cellSizePx, // Präzise Zellhöhe
                        width: cellSizePx, // Gleiche Breite wie Zellen
                        margin: '0', // Kein zusätzlicher Abstand
                        overflow: 'visible', // Kürzel bleibt auf Zellengröße beschränkt
                        whiteSpace: 'nowrap', // Kein Textumbruch
                        padding: '0', // Kein Innenabstand
                        backgroundColor: 'transparent',
                    });
                    weekColumn.append(monthLabel);
                } else {
                    // Leerzeile für den Monatsnamen (gleiche Höhe wie Zellen)
                    weekColumn.append('<div style="height: ' + cellSizePx + ';"></div>');
                }

                // Tageszellen rendern
                week.forEach(dayEntry => {
                    const cell = $('<div class="heatmap-cell"></div>');

                    // Zellenfarbe basierend auf Daten
                    cell.css({
                        width: cellSizePx,
                        height: cellSizePx,
                        backgroundColor: getContributionColor($el, dayEntry.count, minCount, maxCount),
                        borderRadius: '2px',
                        cursor: 'pointer',
                    });

                    if (dayEntry.date) {
                        cell.attr(
                            'title',
                            `Datum: ${dayEntry.date.toLocaleDateString(locale)}, Einträge: ${dayEntry.count}`
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
        });
    }

// Unterstützungsfunktion: Ermitteln, ob die Woche mit Montag oder Sonntag startet
    function getFirstDayOfWeek(locale) {
        // Mapping der Standard-Starttage basierend auf bekannten Regionen
        const mondayFirstLocales = ['de', 'fr', 'es', 'it']; // Sprachen, bei denen die Woche mit Montag beginnt
        return mondayFirstLocales.some(l => locale.startsWith(l)) ? 1 : 0; // 1 = Montag, 0 = Sonntag
    }


// Unterstützungsfunktion: Farbskala für Contributions
    function getContributionColor($el, count, minCount, maxCount) {
        const settings = getSettings($el);

        if (count === 0) {
            return settings.colors['0'];
        }

        const range = maxCount - minCount || 1; // Vermeidet Division durch 0
        const percentage = (count - minCount) / range;

        const colorKeys = Object.keys(settings.colors)
            .map(Number) // Konvertiert Keys zu Zahlen für korrekte Sortierung
            .sort((a, b) => a - b)
            .filter(key => key <= percentage);

        return settings.colors[colorKeys.pop()] || settings.colors['1']; // Gibt Standardfarbe zurück, falls keine passende gefunden wird
    }

    $.fn.heatmap = function (options, params) {
        if ($(this).length > 1) {
            return $(this).each(function (i, element) {
                return $(element).heatmap(options, params);
            })
        }
        const $element = $(this);
        const methodCalled = typeof options === 'string';
        const isInitialized = $element.data('heatmapSettings');
        const DEFAULTS = {
            debug: true,
            classes: 'border border-5 w-100 p-5',
            data: null,
            gutter: 2,
            cellSize: 14,
            colors: {
                0: '#ebedf0',
                0.25: '#c6e48b',
                0.5: '#7bc96f',
                0.75: '#239a3b',
                1: '#196127'
            }
        };

        if (!isInitialized) {
            init($element, options);
        } else {
            console.log('heatmap:isInitialized');
        }

        function init($el, settings) {

            const setup = $.extend({}, DEFAULTS, settings || {});
            if (setup.debug) {
                console.log('heatmap:init', setup);
            }
            $el.data('heatmapSettings', setup);
            drawHeatmap($el);
        }

        if (methodCalled) {
            switch (options) {
                case 'setData': {
                    const setup = $element.data('heatmapSettings');
                    if (setup.debug) {
                        console.log('heatmap:setData', params);
                    }
                    setup.data = params;
                    $element.data('heatmapSettings', setup);
                    drawHeatmap($element);
                }
                    break;
            }
        }

        return $element;
    }
}(jQuery));
