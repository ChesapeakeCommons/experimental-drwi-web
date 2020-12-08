'use strict';

angular.module('FieldDoc')
    .filter('elapsedTime', ['$filter', function($filter) {

        return function(timer, fullStamp) {

            fullStamp = (typeof fullStamp === 'boolean') ? fullStamp : false;

            var period,
                minutes,
                hours,
                days,
                currentDate,
                originDate,
                delta;

            currentDate = moment.utc(new Date());

            console.log('$filter.elapsedTime --> currentDate', currentDate);

            originDate = moment.utc(timer);

            console.log('$filter.elapsedTime --> originDate', originDate);

            delta = currentDate.diff(originDate);

            console.log('$filter.elapsedTime --> timeDelta', delta);

            // 
            // The value of delta is greater than or equal to 1 day
            // (86400000 milliseconds)
            // 

            if (delta >= 86400000) {

                if (fullStamp) {

                    period = [
                        $filter('date')(timer, 'mediumDate'),
                        '·',
                        $filter('date')(timer, 'h:mm'),
                        $filter('date')(timer, 'a')
                    ].join(' ');

                } else {

                    period = $filter('date')(timer, 'longDate');

                    if (currentDate.year() !== originDate.year()) {

                        period += (', ' + originDate.year());

                    }

                    period += ' at ';

                    period += $filter('date')(timer, 'shortTime');

                }

            } else if (3600000 <= delta && delta < 86400000) {

                // 
                // The value of delta is less than 1 day (86400000 milliseconds)
                // and greater than or equal to 1 hour (3600000 milliseconds)
                // 

                hours = Math.round(delta / 3600000);

                console.log('$filter.elapsedTime --> hours', hours);

                period = hours + ' hours ago';

            } else {

                // 
                // The value of delta is less than 1 hour
                // (3600000 milliseconds)
                // 

                minutes = Math.floor(delta / 60000);

                console.log('$filter.elapsedTime --> minutes', minutes);

                period = minutes > 0 ? minutes + ' minutes ago' : 'moments ago';

            }

            console.log('$filter.elapsedTime --> period', period);

            return period;

        };

    }]);