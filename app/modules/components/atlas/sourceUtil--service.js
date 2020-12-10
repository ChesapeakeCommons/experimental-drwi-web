'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('SourceUtil', function(environment, Dashboard, Site, Practice, mapbox) {

        // Let's set an internal reference to this service
        var self = this;

        var index = {};

        return {
            createSource: function(feature, prefix) {

                console.log(
                    'SourceUtil:createSource:feature',
                    feature);

                console.log(
                    'SourceUtil:createSource:prefix',
                    prefix);

                if (typeof prefix !== 'string') {

                    throw new Error('Invalid `prefix` parameter');

                }

                var featureId = feature.properties.id;

                var idString;

                if (typeof featureId === 'string' &&
                    featureId.startsWith('fd.')) {

                    idString = featureId;

                } else {

                    idString = 'fd.' + prefix + '.' + featureId;

                }

                return {
                    id: idString,
                    config: {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [
                                feature
                            ]
                        }
                    }
                };

            },
            _index: {},
            dropSource: function (key) {

                delete this._index[key];

            },
            list: function () {

                var vals = [];

                for (var key in this._index) {

                    if (this._index.hasOwnProperty(key)) {

                        vals.push({
                            id: key,
                            config: this._index[key]
                        });

                    }

                }

                return vals;

            },
            removeAll: function() {

                this._index = {};

            },
            removeSources: function(map) {

                var sources = map.getStyle().sources;

                var keys = Object.keys(sources);

                keys.forEach(function (key) {

                    if (key.startsWith('fd.') && map.getSource(key)) {

                        map.removeSource(key);

                    }

                });

            },
            trackSource: function (key, config) {

                this._index[key] = config;

            },
            trackSources: function (map) {

                var mod = this;

                var sources = map.getStyle().sources;

                var keys = Object.keys(sources);

                keys.forEach(function (key) {

                    if (key.startsWith('fd.') && map.getSource(key)) {

                        mod.trackSource(key, sources[key]);

                    }

                });

            }

        };

    });