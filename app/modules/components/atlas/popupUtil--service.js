'use strict';

/**
 * @ngdoc service
 * @name FieldDoc.template
 * @description
 * # template
 * Provider in the FieldDoc.
 */
angular.module('FieldDoc')
    .service('PopupUtil', function(environment, Dashboard, Site, Practice, mapbox) {

        // Let's set an internal reference to this service
        var self = this;

        return {
            createPopup: function(dashboardId, feature, featureType, style) {

                feature = feature.properties ? feature.properties : feature;

                var id = feature.id;

                var tpl;

                var summaryUrl;

                var siteUrl;

                var practiceUrl;

                switch (featureType) {

                    case 'practice':

                        summaryUrl = environment.siteUrl + '/practices/' + feature.id;

                        practiceUrl = encodeURI(dashboardId + '?pr=' + feature.id + '&style=' + style);

                        tpl = '<div class=\"project--popup\">' +
                            '<div class=\"title--group\">' +
                            '<div class=\"marker--title border--right\">' + feature.name + '</div>' +
                            '<a href=\"' + summaryUrl + '\" target=\"_blank\">' +
                            '<i class=\"material-icons\">keyboard_arrow_right</i>' +
                            '</a>' +
                            '</div>' +
                            '<a class=\"marker--title view-features\" href=\"' + practiceUrl + '\">View practice</a>' +
                            '</div>';

                        break;

                    case 'site':

                        summaryUrl = environment.siteUrl + '/sites/' + feature.id;

                        siteUrl = encodeURI(dashboardId + '?si=' + feature.id + '&style=' + style);

                        tpl = '<div class=\"project--popup\">' +
                            '<div class=\"title--group\">' +
                            '<div class=\"marker--title border--right\">' + feature.name + '</div>' +
                            '<a href=\"' + summaryUrl + '\" target=\"_blank\">' +
                            '<i class=\"material-icons\">keyboard_arrow_right</i>' +
                            '</a>' +
                            '</div>' +
                            '<a class=\"marker--title view-features\" href=\"' + siteUrl + '\">View site</a>' +
                            '</div>';

                        break;

                    case 'project':

                        summaryUrl = environment.siteUrl + '/projects/' + feature.id;

                        siteUrl = encodeURI(dashboardId + '?pj=' + feature.id + '&gr=false&style=' + style);

                        practiceUrl = encodeURI(dashboardId + '?pj=' + feature.id + '&gr=true&style=' + style);

                        //
                        // Create DOM node.
                        //

                        tpl = document.createElement('div')

                        tpl.className = 'project--popup';

                        if (angular.isDefined(feature.picture)) {

                            var imgEl = document.createElement('div');

                            imgEl.className = 'image';

                            imgEl.style.backgroundImage = 'url(\"' + feature.picture + '\")';

                            tpl.appendChild(imgEl);

                        }

                        var metaGrp = document.createElement('div');

                        metaGrp.className = 'meta-group';

                        var titleGrp = document.createElement('div');

                        titleGrp.className = 'title--group';

                        var markerTitle = document.createElement('div');

                        markerTitle.className = 'marker--title border--right';

                        markerTitle.textContent = feature.name;

                        titleGrp.appendChild(markerTitle);

                        var anchor = document.createElement('a');

                        anchor.href = summaryUrl;

                        anchor.target = '_blank';

                        var icon = document.createElement('span');

                        icon.className = 'material-icons';

                        icon.textContent = 'launch';

                        anchor.appendChild(icon);

                        titleGrp.appendChild(anchor);

                        metaGrp.appendChild(titleGrp);

                        tpl.appendChild(metaGrp);

                        var focusBtn = document.createElement('button');

                        focusBtn.className = 'focus-btn pad-0 pad-t-50p pad-b-50p pad-r-1 pad-l-1';

                        var focusIcon = document.createElement('span');

                        focusIcon.className = 'material-icons';

                        focusIcon.textContent = 'zoom_in';

                        focusBtn.appendChild(focusIcon);

                        tpl.appendChild(focusBtn);

                        break;

                }

                return tpl;

            }

        };

    });