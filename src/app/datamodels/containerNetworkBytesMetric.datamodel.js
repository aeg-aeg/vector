/**!
 *
 *  Copyright 2015 Netflix, Inc.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

 (function () {
     'use strict';

    /**
    * @name ContainerNetworkBytesMetricDataModel
    * @desc
    */
    function ContainerNetworkBytesMetricDataModel(WidgetDataModel, MetricListService, VectorService, ContainerMetadataService) {
        var DataModel = function () {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function () {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + VectorService.getGuid();

            // create create base metrics
            var inMetric = MetricListService.getOrCreateCumulativeMetric('network.interface.in.bytes'),
                outMetric = MetricListService.getOrCreateCumulativeMetric('network.interface.out.bytes'),
                derivedFunction;

            // create derived function
            derivedFunction = function () {
                var returnValues = [],
                    lastValue;

                angular.forEach(inMetric.data, function (instance) {
                    ContainerMetadataService.setCurrentTime(instance.previousTimestamp);
                    if (instance.values.length > 0 && instance.key.indexOf('veth') !== -1) {
                        lastValue = instance.values[instance.values.length - 1];
                        returnValues.push({
                            timestamp: lastValue.x,
                            key: instance.key + ' in',
                            value: lastValue.y / 1024
                        });
                    }
                });

                angular.forEach(outMetric.data, function (instance) {
                    if (instance.values.length > 0 && instance.key.indexOf('veth') !==- 1) {
                        lastValue = instance.values[instance.values.length - 1];
                        returnValues.push({
                            timestamp: lastValue.x,
                            key: instance.key + ' out',
                            value: lastValue.y / 1024
                        });
                    }
                });

                return returnValues;
            };

            // create derived metric
            this.metric = MetricListService.getOrCreateDerivedMetric('container.network.interface', derivedFunction);

            this.updateScope(this.metric.data);
        };

        DataModel.prototype.destroy = function () {
            // remove subscribers and delete derived metric
            MetricListService.destroyDerivedMetric('container.network.interface');

            // remove subscribers and delete base metrics
            MetricListService.destroyMetric('network.interface.in.bytes');
            MetricListService.destroyMetric('network.interface.out.bytes');

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('ContainerNetworkBytesMetricDataModel', ContainerNetworkBytesMetricDataModel);
 })();
