'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('Utility', function() {

        if (!String.prototype.startsWith) {

            Object.defineProperty(String.prototype, 'startsWith', {

                value: function(search, rawPos) {

                    var pos = rawPos > 0 ? rawPos|0 : 0;

                    return this.substring(pos, pos + search.length) === search;

                }

            });

        }

        if (!String.prototype.endsWith) {

            String.prototype.endsWith = function(search, this_len) {

                if (this_len === undefined || this_len > this.length) {

                    this_len = this.length;

                }

                return this.substring(this_len - search.length, this_len) === search;

            };

        }

        Number.isInteger = Number.isInteger || function(value) {

            return (typeof value === 'number' && 
                    isFinite(value) && 
                    Math.floor(value) === value);
            
        };

        return {
            machineName: function(name, separator) {

                separator = typeof separator === 'string' ? separator : '-';

                if (name) {

                    var removeDashes = name.trim().replace(/-/g, ''),
                        removeSpaces = removeDashes.replace(/ /g, separator);

                    return removeSpaces.toLowerCase();

                }

                return null;

            },
            camelName: function(name) {

                if (name) {

                    return name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
                        return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
                    }).replace(/\s+/g, '');

                }

                return null;

            },
            precisionRound: function(value, decimals, base) {

                var pow = Math.pow(base || 10, decimals);

                return Math.round(value * pow) / pow;

            },
            meterCoefficient: function() {

                var range = [
                    0.04,
                    0.08,
                    0.12,
                    0.16,
                    0.20,
                    0.24,
                    0.28,
                    0.32,
                    0.36,
                    0.40
                ];

                return range[Math.floor(Math.random() * range.length)];

            },
            transformBounds: function(obj) {

                return [];

            },
            buildStaticMapURL: function(geometry, colorScheme = null,
                                        width = 400, height = 130) {

                // var styledFeature = {
                //     "type": "Feature",
                //     "geometry": geometry,
                //     "properties": {
                //         "marker-size": "small",
                //         "marker-color": "#2196F3",
                //         "stroke": "#2196F3",
                //         "stroke-opacity": 1.0,
                //         "stroke-width": 2,
                //         "fill": "#2196F3",
                //         "fill-opacity": 0.5
                //     }
                // };

                var color = "#06aadf";

                if(colorScheme != null){

                    if(colorScheme == 'practice'){

                        color = "#df063e";

                    }else{

                    }
                }else{

                }

                /*
                simplify thumbs

                lets create a new var from our geojson object
                then convert it to a string and store the length
                A series of conditionals to check the length
                depending on length, turf.simplify along tolerance scale.

                */

                let simplified = geometry;

                var lengthCheck = encodeURIComponent(JSON.stringify(geometry)).length;

                if(lengthCheck > 8192) {

                    let simplify_options = {tolerance: 0.6, highQuality: true, mutate: false};

                    simplified = turf.simplify(geometry, simplify_options);

                }else if(lengthCheck > 4096) {

                    let simplify_options = {tolerance: 0.4, highQuality: true, mutate: false};

                    simplified = turf.simplify(geometry, simplify_options);

                }else if(lengthCheck > 3072){

                    let simplify_options = {tolerance: 0.3, highQuality: true, mutate: false};

                    simplified = turf.simplify(geometry, simplify_options);


                }else{


                }

                //compose feature

                var styledFeature = {
                    "type": "Feature",
                    "geometry": simplified,
                    "zoom" : 10,
                    "properties": {
                        "marker-size": "small",
                        "marker-color": color,
                        "stroke": color,
                        "stroke-opacity": 1.0,
                        "stroke-width": 2,
                        "fill": color,
                        "fill-opacity": 0.5,
                    }
                };

                // Build static map URL for Mapbox API

               return [
                    'https://api.mapbox.com/styles/v1',
                    '/mapbox/streets-v10/static/geojson(',
                    encodeURIComponent(JSON.stringify(styledFeature)),
                    ')/auto/'+width+'x'+height+'@2x?access_token=',
                    'pk.eyJ1IjoiYm1jaW50eXJlIiwiYSI6IjdST3dWNVEifQ.ACCd6caINa_d4EdEZB_dJw'
                ].join('');

            },
            getDenominator: function(metric, global, nodeType) {

                console.log(
                    'Utility.getDenominator:metric',
                    metric
                );

                console.log(
                    'Utility.getDenominator:global',
                    global
                );

                console.log(
                    'Utility.getDenominator:nodeType',
                    nodeType
                );

                if (nodeType === 'territory') {

                    return metric.goal.parent;

                }

                if (global) {

                    if (typeof metric.target === 'number' &&
                        metric.target > 0) {

                        return metric.target;

                    } else {

                        return metric.agg_target;

                    }

                }

                return metric.agg_target || metric.self_target;

            },
            getNumerator: function(metric, global) {

                if (global) {

                    return metric.total_reported;

                }

                return metric.current_value;

            },
            calcProgress: function(metric, global, nodeType) {

                console.log(
                    'Utility.calcProgress:metric',
                    metric
                );

                console.log(
                    'Utility.calcProgress:global',
                    global
                );

                console.log(
                    'Utility.calcProgress:nodeType',
                    nodeType
                );

                var numerator = this.getNumerator(metric, global);

                console.log(
                    'Utility.calcProgress:numerator',
                    numerator
                );

                var denominator = this.getDenominator(metric, global, nodeType);

                console.log(
                    'Utility.calcProgress:denominator',
                    denominator
                );

                if (numerator >= 0 && (typeof denominator === 'number' && denominator > 0)) {

                    var progress = (numerator / denominator);

                    metric.percentComplete = Math.round(progress * 100);

                    console.log(
                        'Utility.calcProgress:percentComplete',
                        metric.percentComplete
                    );

                    metric.arcValue = (progress > 1) ? 1 : progress;

                } else {

                    metric.percentComplete = -1;

                    metric.arcValue = 0;

                }

                return metric;

            },
            processMetrics: function(arr) {

                arr.forEach(function(datum) {

                    datum.contextProgress = {
                        value: 0,
                        arcValue: 0
                    };

                    datum.selfProgress = {
                        value: 0,
                        arcValue: 0
                    };

                    if (datum.context_target) {

                        datum.contextProgress.value = datum.current_value / datum.context_target;

                    } else {

                        datum.contextProgress.value = datum.current_value / datum.target;

                    }

                    if (datum.self_target) {

                        datum.selfProgress.value = datum.current_value / datum.self_target;

                    }

                    datum.contextProgress.arcValue = datum.contextProgress.value > 1 ? 1 : datum.contextProgress.value;

                    datum.selfProgress.arcValue = datum.selfProgress.value > 1 ? 1 : datum.selfProgress.value;

                });

                return arr;

            },
            groupByModel: function(arr) {

                var index = {
                    'has_models': false,
                    'generic': [],
                    'models': {}
                };

                arr.forEach(function(datum) {

                    if (!datum.model || typeof datum.model === 'undefined') {

                        index.generic.push(datum);

                    } else {

                        var key = 'model_' + datum.model.id;

                        if (index.models.hasOwnProperty(key) &&
                            Array.isArray(index.models[key].collection)) {

                            index.models[key].collection.push(datum);

                        } else {

                            index.has_models = true;

                            index.models[key] = {
                                'datum': datum.model,
                                'collection': [
                                    datum
                                ]
                            };

                        }

                    }

                });

                return index;

            },
            groupByCategory: function(arr) {

                var index = {
                    'has_categories': false,
                    'generic': [],
                    'categories': {}
                };

                arr.forEach(function(datum) {

                    if (!datum.category || typeof datum.category === 'undefined') {

                        index.generic.push(datum);

                    } else {

                        var key = datum.category;

                        if (index.categories.hasOwnProperty(key) &&
                            Array.isArray(index.categories[key].collection)) {

                            index.categories[key].collection.push(datum);

                        } else {

                            index.has_categories = true;

                            index.categories[key] = {
                                'name': datum.category,
                                'collection': [
                                    datum
                                ]
                            };

                        }

                    }

                });

                return index;

            },
            sortCollection: function(arr, key) {

                arr.sort(function compare(a, b) {

                    if (a[key] < b[key]) {

                        return -1;

                    }

                    if (a[key] > b[key]) {

                        return 1;

                    }

                    return 0;

                });

                return arr;

            },
            scrubFeature: function(feature, excludedKeys) {

                var reservedProperties = [
                    'links',
                    'permissions',
                    '$promise',
                    '$resolved'
                ];

                excludedKeys.forEach(function(key) {

                    if (feature.properties) {

                        delete feature.properties[key];

                    } else {

                        delete feature[key];

                    }

                });

                reservedProperties.forEach(function(key) {

                    delete feature[key];

                });

            },
            extractUserPrograms: function(user) {

                var _programs = [];

                try {

                    user.programs.forEach(function (program) {

                        _programs.push(program);

                    });

                    _programs.sort(function (a, b) {

                        return a.id > b.id;

                    });

                } catch (e) {

                    return _programs;

                }

                return _programs;

            },
            processTags: function(arr) {

                arr.forEach(function(tag) {

                    if (tag.color &&
                        tag.color.length) {

                        tag.lightColor = tinycolor(tag.color).lighten(5).toString();

                    }

                });

                return arr;

            },
            measureGeometry: function(feature) {

                console.log(
                    'Utility.measureGeometry:feature',
                    feature);

                var dimension = {};

                var measurement;

                if (feature.geometry) {

                    var type = feature.geometry.type;

                    console.log(
                        'Utility.measureGeometry:type',
                        type);

                    dimension.type = type.toLowerCase();

                    if (type === 'LineString') {

                        dimension.label = 'length';

                        var line = turf.lineString(feature.geometry.coordinates);

                        measurement = turf.length(line, {units: 'miles'});

                        if (typeof measurement === 'number') {

                            measurement = measurement * 5280;

                        }

                    }

                    if (type === 'Polygon') {

                        dimension.label = 'area';

                        var polygon = turf.polygon(feature.geometry.coordinates);

                        measurement = turf.area(polygon);

                        if (typeof measurement === 'number') {

                            measurement = measurement * 0.0002471052;

                        }

                    }

                    console.log(
                        'Utility.measureGeometry:measurement',
                        measurement);

                    dimension.measurement = measurement;

                }

                return dimension;

            },
            values: function (obj) {

                var vals = [];

                try {

                    for (var key in obj) {

                        if (obj.hasOwnProperty(key)) {

                            vals.push(obj[key]);

                        }

                    }

                } catch (e) {

                    console.warn(
                        'Utility.values: Unable to retrieve object property values.',
                        e
                    )

                }

                return vals;

            }
        };

    });