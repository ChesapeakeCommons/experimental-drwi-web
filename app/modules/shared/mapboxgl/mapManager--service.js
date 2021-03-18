'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('MapManager', function() {

        return {
            addLayers: function(map, arr) {

                arr.forEach(function(feature) {

                    console.log("Layer Spec",feature);

                    var spec = feature.layer_spec || {};

                    feature.spec = spec;

                    if (!feature.selected ||
                        typeof feature.selected === 'undefined') {

                        feature.selected = false;

                    } else {

                        feature.spec.layout.visibility = 'visible';

                    }

                    if (feature.spec.id) {

                        try {

                            console.log("'MapManager.addLayers",feature.spec);

                            map.addLayer(feature.spec);

                        } catch (error) {

                            console.log(
                                'MapManager.addLayers --> error',
                                error);

                        }

                    }

                });

                return arr;

            },
            clearLayers: function(map) {

                console.log("CLEARING LAYERS");

                var layers = map.getStyle().layers;

                layers.forEach(function (layer) {

                    if (layer.id.indexOf('feature') >= 0) {

                        map.removeLayer(layer.id);

                    }

                });

            },
            addFeature: function(map, feature, attribute, addToMap,
                                 fitBounds, featureType = null) {

                if (fitBounds === null || typeof fitBounds === 'undefined') {

                    fitBounds = true;

                }

                /*Check feature type to set color*/

                var geometryFillColor           = '#06aadf';
                var geometryCircleStrokeColor   = 'rgba(6, 170, 223, 0.5)';
                var geometryLineColor           = 'rgba(6, 170, 223, 0.8)';

                if(featureType != null){

                    if(featureType == 'site'){
                        geometryFillColor = '#06aadf';
                        geometryCircleStrokeColor = 'rgba(6, 170, 223, 0.5)';
                        geometryLineColor = 'rgba(6, 170, 223, 0.8)';

                    }else if(featureType == 'practice'){

                        geometryFillColor = '#df063e';
                        geometryCircleStrokeColor = 'rgba(223, 6, 62, 0.5)';
                        geometryLineColor = 'rgba(223, 6, 62, 0.8)';

                    }else if(featureType == 'secondary_practices') {

                        geometryFillColor = 'rgba(223, 6, 62, 0.5)';
                        geometryCircleStrokeColor = 'rgba(223, 6, 62, 0.1)';
                        geometryLineColor = 'rgba(223, 6, 62, 0.25)';

                    }else if(featureType == 'secondary_sites') {

                        geometryFillColor = 'rgba(6, 170, 223, 0.5)';
                        geometryCircleStrokeColor = 'rgba(6, 170, 223, 0.1)';
                        geometryLineColor = 'rgba(6, 170, 223, 0.25)';
                        
                    }


                }else{

                }

                var geojson = attribute ? feature[attribute] : feature;

                if (geojson !== null &&
                    typeof geojson !== 'undefined') {
                    //          console.log("G");
                    var geometryType = geojson.geometry ? geojson.geometry.type : geojson.type;

                    var bounds = turf.bbox(geojson);

                    if (geometryType === 'Point') {
                        //             console.log("H");
                        var buffer = turf.buffer(
                            geojson,
                            0.5, {
                                units: 'kilometers'
                            });

                        bounds = turf.bbox(buffer);

                    }

                    if (fitBounds) {
                        //   console.log("I");
                        map.fitBounds(bounds, {
                            padding: 40
                        });

                    }

                    let feature_id;

                    if(feature.properties != null && feature.properties != undefined){

                        feature_id = feature.properties.id;

                    }else{

                        feature_id = feature.id;

                    }

                    if (addToMap) {
                        //           console.log("J");
                        if (geometryType === 'Point' || geometryType === 'MultiPoint') {
                            //    console.log("K");
                            map.addLayer({
                                'id': 'feature-circle-' + Date.now(),
                                'type': 'circle',
                                'source': {
                                    'type': 'geojson',
                                    'data': {
                                        'type': 'Feature',
                                        'geometry': geojson
                                    }
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'circle-radius': 8,
                                    'circle-color': geometryFillColor,
                                    'circle-stroke-color': geometryCircleStrokeColor,
                                    'circle-stroke-opacity': 1,
                                    'circle-stroke-width': 4
                                }
                            });

                        } else if (geometryType.indexOf('Line') >= 0) {
                            //     console.log("L");
                            map.addLayer({
                                'id': 'feature-line-' + Date.now(),
                                'type': 'line',
                                'source': {
                                    'type': 'geojson',
                                    'data': {
                                        'type': 'Feature',
                                        'geometry': geojson
                                    }
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'line-color': geometryLineColor,
                                    'line-width': 2
                                }
                            });

                        } else {
                            //    console.log("M");
                            map.addLayer({
                                'id': 'feature-' + featureType +"-"+feature_id,
                                //     'id': 'feature-' + Date.now(),
                                'type': 'fill',
                                'source': {
                                    'type': 'geojson',
                                    'data': geojson
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'fill-color': geometryFillColor,
                                    'fill-opacity': 0.4
                                }
                            });

                            map.addLayer({
                                'id': 'feature-outline-' + featureType +"-"+feature_id,
                                //      'id': 'feature-outline-' + Date.now(),
                                'type': 'line',
                                'source': {
                                    'type': 'geojson',
                                    'data': geojson
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'line-color': geometryLineColor,
                                    'line-width': 2
                                }
                            });

                        }

                    }

                }

            },
            populateMap: function(map, feature, attribute, addToMap, fitBounds) {

                if (fitBounds === null ||
                    typeof fitBounds === 'undefined') {

                    fitBounds = true;

                }

                var geojson = attribute ? feature[attribute] : feature;

                if (geojson !== null &&
                    typeof geojson !== 'undefined') {

                    var bounds = turf.bbox(geojson);

                    if (fitBounds) {

                        map.fitBounds(bounds, {
                            padding: 40
                        });

                    }

                    if (!addToMap) {

                        return;

                    } else {

                        var geometryType = geojson.geometry ? geojson.geometry.type : geojson.type;

                        console.log(
                            'MapManager.populateMap --> geometryType',
                            geometryType);

                        if (geometryType === 'Point') {

                            var buffer = turf.buffer(
                                geojson,
                                0.5, {
                                    units: 'kilometers'
                                });

                            bounds = turf.bbox(buffer);

                            if (fitBounds) {

                                map.fitBounds(bounds, {
                                    padding: 40
                                });

                            }

                            map.addLayer({
                                'id': 'feature-circle-' + Date.now(),
                                'type': 'circle',
                                'source': {
                                    'type': 'geojson',
                                    'data': {
                                        'type': 'Feature',
                                        'geometry': geojson
                                    }
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'circle-radius': 8,
                                    'circle-color': '#06aadf',
                                    'circle-stroke-color': 'rgba(6, 170, 223, 0.5)',
                                    'circle-stroke-opacity': 1,
                                    'circle-stroke-width': 4
                                }
                            });

                        } else if (geometryType.indexOf('Line') >= 0) {

                            map.addLayer({
                                'id': 'feature-line-' + Date.now(),
                                'type': 'line',
                                'source': {
                                    'type': 'geojson',
                                    'data': {
                                        'type': 'Feature',
                                        'geometry': geojson
                                    }
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'line-color': 'rgba(6, 170, 223, 0.8)',
                                    'line-width': 2
                                }
                            });

                        } else {

                            map.addLayer({
                                'id': 'feature-' + Date.now(),
                                'type': 'fill',
                                'source': {
                                    'type': 'geojson',
                                    'data': geojson
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'fill-color': '#06aadf',
                                    'fill-opacity': 0.4
                                }
                            });

                            map.addLayer({
                                'id': 'feature-outline-' + Date.now(),
                                'type': 'line',
                                'source': {
                                    'type': 'geojson',
                                    'data': geojson
                                },
                                'layout': {
                                    'visibility': 'visible'
                                },
                                'paint': {
                                    'line-color': 'rgba(6, 170, 223, 0.8)',
                                    'line-width': 2
                                }
                            });

                        }

                    }

                }

            },
            drawOtherGeometries: function(type,map,collection,feature,callback){


                map.on('style.load', function () {

                    if(type === 'secondary_practices') {
                        collection.forEach(function (item) {
                            if (item.properties.id === feature.id) {

                            } else {
                                callback(
                                    map,
                                    item,
                                    'geometry',
                                    true,
                                    false,
                                    type);

                            }


                        });
                    }else  if(type === 'secondary_sites') {
                        collection.forEach(function (item) {

                            if (item.properties.id === feature.id) {


                            } else {
                                callback(
                                    map,
                                    item,
                                    'geometry',
                                    true,
                                    false,
                                    type
                                );

                            }


                        });
                    }


                });


            }
        };

    });