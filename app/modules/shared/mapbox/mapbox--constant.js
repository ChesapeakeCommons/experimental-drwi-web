'use strict';

/**
 * @ngdoc service
 * @name cleanWaterCommunitiesApp.Site
 * @description
 * # Site
 * Service in the cleanWaterCommunitiesApp.
 */
angular.module('Mapbox')
    .constant('mapbox', {
        geocodingUrl: 'https://api.tiles.mapbox.com/v4/geocode/mapbox.places-v1/',
        accessToken: 'pk.eyJ1IjoiZmllbGRkb2MiLCJhIjoiY2p1MW8zOHNyMDNwZTQ0bXlhMjNxaXVpMSJ9.0tUMQt2s0zd6DAthnmJItg',
        baseStyles: [
            {
                'name': 'Streets',
                'url': 'mapbox://styles/mapbox/streets-v11'
            },
            {
                'name': 'Satellite',
                'url': 'mapbox://styles/mapbox/satellite-streets-v11'
            },
            // {
            //     'name': 'Outdoors',
            //     'url': 'mapbox://styles/mapbox/outdoors-v11'
            // }
        ],
        defaultOptions: {
            center: [0, 0], // starting position [lng, lat]
            zoom: 2, // starting zoom,
            maxZoom: 20
        }
    });