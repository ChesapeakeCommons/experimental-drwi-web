'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('SourceUtil', function(AtlasDataManager) {

        var FEATURE_SOURCES = {
            'fd.practice.centroid': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.practice.point': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.practice.line': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.practice.polygon': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.site.point': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.site.line': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.site.polygon': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.project.point': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'wr.station.point': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            },
            'fd.drainage.polygon': {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                generateId: true
            }
        };

        return {
            _index: {},
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
            resetFeatureStates: function (map, urlComponents) {

                urlComponents.forEach(function (combination) {

                    var prefix = 'fd';

                    if (combination[0] === 'station' ||
                        combination[0] === 'post') {

                        prefix = 'wr';

                    }

                    var layerId = [
                        prefix,
                        combination[0],
                        combination[1]
                    ].join('.');

                    map.removeFeatureState({
                        source: layerId
                    });

                });

            },
            restoreSources: function (map) {

                var sourceIds = Object.keys(FEATURE_SOURCES);

                sourceIds.forEach(function (sourceId) {

                    var tokens = sourceId.split('.');

                    var nodeType = tokens[1];

                    var geometryType = tokens[2];

                    var source = map.getSource(sourceId);

                    var fetchedFeatures = AtlasDataManager.getFetched(
                        nodeType, geometryType);

                    if (source !== undefined) {

                        source.setData({
                            'type': 'FeatureCollection',
                            'features': fetchedFeatures
                        });

                    }

                });

            }

        };

    });