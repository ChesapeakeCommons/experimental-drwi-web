'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('AtlasDataManager', function() {

        var queryFeatures = [];

        var fetchedFeatures = {
            'drainage': {
                'polygon': {}
            },
            'post': {
                'point': {}
            },
            'station': {
                'point': {}
            },
            'practice': {
                'centroid': {},
                'line': {},
                'point': {},
                'polygon': {}
            },
            'site': {
                'centroid': {},
                'line': {},
                'point': {},
                'polygon': {}
            },
            'project': {
                'point': {}
            }
        };

        return {
            createURLData: function (feature, toString, options) {

                console.log(
                    'createURLData:feature:',
                    feature
                );

                toString = typeof toString === 'boolean' ? toString : true;

                var style;

                var zoom;

                try {

                    style = options.style;

                    zoom = options.zoom;

                } catch (e) {

                    style = 'streets';

                    zoom = 12;

                }

                console.log(
                    'createURLData:style:',
                    style
                );

                console.log(
                    'createURLData:zoom:',
                    zoom
                );

                var origin = '-77.0147,38.9101,' + zoom;

                var params = {};

                var centroid = this.getCentroid(feature);

                if (centroid !== undefined) {

                    if (centroid.hasOwnProperty('coordinates')) {

                        origin = [
                            centroid.coordinates[0],
                            centroid.coordinates[1],
                            zoom
                        ].join(',');

                    } else {

                        origin = [
                            centroid.geometry.coordinates[0],
                            centroid.geometry.coordinates[1],
                            zoom
                        ].join(',');

                    }

                }

                params.origin = encodeURIComponent(
                    origin
                ).replace(/\./g, '%2E');

                var node = feature.type + '.' + feature.id;

                var dataString = [
                    'style:' + style,
                    'node:' + node
                ].join('|');

                params.data = encodeURIComponent(btoa(dataString));

                if (toString) {

                    var str = [];

                    for (var key in params) {

                        str.push(encodeURIComponent(key) + '=' + params[key]);

                    }

                    return str.join('&');

                }

                return params;

            },
            getCentroid: function (feature) {

                console.log(
                    'getCentroid:feature',
                    feature
                );

                var featureType = feature.type;

                console.log(
                    'getCentroid:featureType',
                    featureType
                );

                if (featureType === 'project') {

                    return feature.centroid;

                }

                try {

                    var geometryType = feature.geometry.type.toLowerCase();

                    if (geometryType === 'linestring') {

                        var line = turf.lineString(feature.geometry.coordinates);

                        console.log(
                            'getCentroid:line',
                            line
                        );

                        return turf.centroid(line);

                    }

                    if (geometryType === 'polygon') {

                        var polygon = turf.polygon(feature.geometry.coordinates);

                        console.log(
                            'getCentroid:polygon',
                            polygon
                        );

                        console.log(
                            'getCentroid:centroid',
                            turf.centroid(polygon)
                        );

                        return turf.centroid(polygon);

                    }

                } catch (e) {

                    console.warn(e);

                    return undefined;

                }

                return undefined;

            },
            list: function (idx) {

                var vals = [];

                for (var key in idx) {

                    if (idx.hasOwnProperty(key)) {

                        vals.push(idx[key]);

                    }

                }

                return vals;

            },
            getFetched: function (featureType, geometryType) {

                var index = fetchedFeatures[featureType][geometryType];

                return this.list(index);

            },
            getFetchedKeys: function (featureType, geometryType) {

                var index = fetchedFeatures[featureType][geometryType];

                return Object.keys(index);

            },
            getOrigin: function (params) {

                try {

                    var origin = decodeURIComponent(params.origin);

                    var tokens = origin.split(',');

                    return {
                        lng: +tokens[0],
                        lat: +tokens[1],
                        zoom: +tokens[2]
                    }

                } catch (e) {

                    return undefined;

                }

            },
            getData: function (params) {

                try {

                    var data = decodeURIComponent(params.data);

                    var str = atob(data);

                    var entities = str.split('|');

                    var datum = {};

                    entities.forEach(function (entity) {

                        console.log(
                            'getData:entity:',
                            entity
                        );

                        var tokens = entity.split(':');

                        datum[tokens[0]] = tokens[1];

                    });

                    return datum;

                } catch (e) {

                    console.warn(e);

                    return undefined;

                }

            },
            resetTrackedFeatures: function () {

                for (var key in fetchedFeatures) {

                    if (fetchedFeatures.hasOwnProperty(key)) {

                        var config = fetchedFeatures[key];

                        var configKeys = Object.keys(config);

                        configKeys.forEach(function (a) {

                            config[a] = {};

                        });

                        fetchedFeatures[key] = config;

                    }

                }

            },
            setPrimaryNode: function (feature) {

                this.primaryNode = feature;

            },
            getQueryFeatures: function () {

                return this.queryFeatures;

            },
            setQueryFeatures: function (features) {

                this.queryFeatures = features;

            },
            trackFeature: function (featureType, geometryType, feature) {

                fetchedFeatures[featureType][geometryType][feature.properties.id] = feature;

            }

        };

    });