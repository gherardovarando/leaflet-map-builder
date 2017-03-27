/**
 * @author : gherardo varando (gherardo.varando@gmail.com)
 *
 * @license: GPL v3
 *     This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.


 */
'use strict';


const leafelt = require('leaflet');

if (L != undefined) {

    /**
     * MapBuilder Class
     */
    L.MapBuilder = L.Evented.extend({
        _l: null,
        _indx: 0,
        _configuration: {
            layers: {}
        },
        _events: [],
        _layers: {},
        _controls: {},
        _activeBaseLayer: null,
        _state: {
            baseLayerOn: false
        },
        _options: {
            drawingColor: "#ed8414",
            controls: {
                draw: false, // logical, options of configuration
                zoom: false, // logical, options of configuration
                layers: false // logical, options of configuration or function for external control
            },
            tooltip: {
                polygon: false,
                rectangle: false,
                polyline: false,
                circle: false
            },
            popup: {
                polygon: false,
                rectangle: false,
                polyline: false,
                circle: false
            }
        },

        /**
         * constructor
         * @param  {Object} map               L.Map leaflet object
         * @param  {Object} options
         * @param  {Object} configuration
         * @return {MapBuilder}
         */
        initialize: function(map, options, configuration) {
            this.setMap(map);
            this.setOptions(options);
            this.setConfiguration(configuration || {
                type: 'map',
                layers: {}
            });

        },

        /**
         * Set map object
         * @param {Object} map L.Map lealfet object
         */
        setMap: function(map) {
            if (map instanceof L.Map) {
                this._l = map;
                this.fire("map-added", map);
            } else {
                throw {
                    type: "map error",
                    map: map
                };
            }

        },


        /**
         * parse the configuration object
         * @param  {Object, String} configuration
         * @return {Object}
         */
        _parse: function(configuration) { // add some more
            if (typeof configuration === 'string') {
                configuration = JSON.parse(configuration);
            }
            configuration.type = configuration.type || 'undefined';
            if (configuration.type.includes("map")) {
                //return Object.assign({}, configuration);
                configuration.layers = configuration.layers || {};
                return configuration;
            } else {
                throw 'ERROR: configuration must have "type":"..map.." ';
            }
        },

        setConfiguration: function(configuration) {
            this._configuration = this._parse(configuration);
            this.fire('set:configuration', {
                configuration: configuration
            });
            this.reload();
        },

        // return a copy of the configuration object
        getConfiguration: function() {
            //  return Object.assign({}, this._configuration);
            return this._configuration;
        },

        setOptions: function(options) {
            if (!options) return;
            Object.assign(this._options, options);
            this.reload();
        },

        //clean the map
        clear: function() {
            if (this._l) {
                this._l.eachLayer((layer) => {
                    this._l.removeLayer(layer);
                });
                if (this._controls.draw instanceof L.Control.Draw) {
                    this._l.removeControl(this._controls.draw);
                }
                if (this._controls.layers instanceof L.Control.Layers) {
                    this._l.removeControl(this._controls.layers);
                }
                if (this._controls.zoom instanceof L.Control.Zoom) {
                    this._l.removeControl(this._controls.zoom);
                }
                this._removeMapListener();
            }
            this._events = [];
            this._layers = {};
            this._controls = {};
            this._state = {
                baseLayerOn: false
            }
            this._activeBaseLayer = null;
            this.fire('clean');
        },

        _removeMapListener: function() {
            if (this._l) {
                this._events.map((ev) => {
                    this._l.off(ev);
                });
            }
        },

        reload: function() {
            if (!this._l) {
                return;
            } else {
                this.clear();
                if (this._options.controls.layers) {
                    this._addLayersControl();
                }
                if (this._options.controls.draw) {
                    //this._addDrawnItems();
                    this._addDrawControl();
                }
                if (this._options.controls.zoom) {
                    this._addZoomControl();
                }
                this._indx = 0;
                this._layerindx = 0;
                //load all the layers
                if (this._configuration.layers) {
                    if (this._configuration.layers instanceof Array) {
                        this._configuration.layers.map((layer) => {
                            this._loadLayer(layer);
                        });
                    } else { //we assume is an object
                        for (let a in this._configuration.layers) {
                            this._loadLayer(this._configuration.layers[a]);
                        }
                    }
                }
                this.fitWorld();
                this.fire('reload');
            }
        },


        center: function() {
            this._map.setView([0, 0], 0);
        },

        onMap: function(ev, cl) {
            this._events.push(ev);
            this._l.on(ev, cl);
        },

        offMap: function(ev) {
            this._l.off(ev);
        },


        fitWorld() {
            this._l.fitWorld();
        },

        getDrawingColor: function() {
            if (typeof this._drawingColor === 'string') return this._drawingColor;
            return "#ed8414";
        },

        setDrawingColor: function(color) {
            if (typeof color === 'string') this._drawingColor = color;
        },

        setMaxZoom: function(zoom) {
            this._l.setMaxZoom(zoom);
            this.fire('set:maxZoom', {
                maxZoom: zoom
            });
        },

        setMinZoom: function(zoom) {
            this._l.setMinZoom(zoom);
            this.fire('set:minZoom', {
                minZoom: zoom
            });
        },

        addLayer: function(configuration, where) {
            configuration.name = configuration.name || `${configuration.type}${this._indx++}`;
            if (!configuration) return;
            if (typeof where === 'string') {
                where = this._layers[where];
            }
            if (!where) {
                where = this;
            }
            if ((!where._layers) || (!where._configuration) || (!where._configuration.layers)) {
                console.log('Destination does not permit adding layer, you can just add a layer to the map, featureGroup, layerGroup and similar');
                return;
            }
            if (where._layers[configuration.name]) {
                console.log('Layer with same name already present');
                return;
            }
            where._configuration.layers[configuration.name] = configuration;
            this._loadLayer(configuration, where);
        },


        _loadLayer: function(configuration, where) {
            if (!configuration) return;
            if (typeof where === 'string') {
                where = this._layers[where];
            }
            if (!where) {
                where = this;
            }
            configuration.name = configuration.name || `${configuration.type}_${this._indx++}`;
            if (where._layers[configuration.name]) {
                console.log('already a layer with the given name')
                return;
            }
            let layer;
            switch (configuration.type) {
                case 'tileLayer':
                    layer = this._loadTileLayer(configuration);
                    break;
                case 'polygon':
                    layer = this._loadPolygon(configuration);
                    break;
                case 'rectangle':
                    layer = this._loadRectangle(configuration);
                    break;
                case 'circle':
                    layer = this._loadCircle(configuration);
                    break;
                case 'marker':
                    layer = this._loadMarker(configuration);
                    break;
                case 'circleMarker':
                    layer = this._loadCircleMarker(configuration);
                    break;
                case 'guideLayer':
                    layer = this._loadGuideLayer(configuration);
                    break;
                case 'imageLayer':
                    layer = this._loadImageLayer(configuration);
                    break;
                case 'featureGroup':
                    layer = this._loadFeatureGroup(configuration);
                    break;
                case 'layerGroup':
                    layer = this._loadLayerGroup(configuration);
                    break;
                default:
                    return;
            }

            if (layer) {
                if (layer._configuration.tooltip) {
                    layer._l.bindTooltip(layer._configuration.tooltip.content || layer._configuration.tooltip, layer._configuration.tooltip.options);
                } else if (this._options.tooltip[layer._configuration.type]) {
                    layer._l.bindTooltip(layer._configuration.name);
                }
                if (layer._configuration.popup) {
                    layer._l.bindPopup(layer._configuration.popup.content || layer._configuration.popup, layer._configuration.popup.options);
                } else if (this._options.popup[layer._configuration.type]) {
                    layer._l.bindPopup(layer._configuration.name);
                }
            }
        },

        setLayerStyle(name, style, where) {
            if (!where) {
                where = this;
            }
            if (!where._layers) return;
            if (!where._layers[name]) return;

            if (where._layers[name]._l.setStyle) {
                where._layers[name]._l.setStyle(style);
            }

        },

        renameLayer: function(old, now, where) {
            if (!old) return;
            if (!now) return;
            if (typeof where === 'string') {
                where = this._layers[where];
            }
            if (!where) {
                where = this;
            }
            if (!where._layers[old]) return;
            where._layers[old]._configuration.name = now;
            where._layers[now] = where._layers[old];
            delete where._layers[old];
            where._configuration.layers[now] = where._configuration.layers[old];
            delete where._configuration.layers[old];
            this.fire('rename:layer', {
                name: now,
                layer: where._layers[now]
            });
        },

        removeLayer: function(name, where) {
            if (typeof where === 'string') {
                where = this._layers[where];
            }
            if (!where) {
                where = this;
            }
            if (!where._layers) return;
            if (!where._layers[name]) return;
            where._l.removeLayer(where._layers[name]._l);
            if (this._controls.layers) {
                this._controls.layers.removeLayer(where._layers[name]._l);
            }
            this._controls.layers.
            delete where._layers[name];
            delete where._configuration.layers[name];
            this.fire('remove:layer', {
                name: name
            });
        },


        _addDrawnItems: function() {
            this.addLayer({
                name: 'drawnItems',
                type: 'featureGroup',
                layers: {}
            }, this);
            this.fire('add:drawnitems', {
                layer: this._layers.drawnItems._l,
                configuration: this._layers.drawnItems._configuration
            });
        },


        _addDrawControl: function() {
            if (!L.Control.Draw) return;
            if (!this._layers.drawnItems) {
                this._addDrawnItems();
            }
            let drawnItems = this._layers.drawnItems._l
            let options = {};
            if (!this._options.controls.draw) {
                options.draw = false;
                options.edit = false;
            } else {
                Object.assign(options, this._options.controls.draw);
                if (options.draw) {
                    options.draw = Object.assign({}, options.draw);
                }
                ['polyline', 'polygon', 'rectangle', 'circle'].map((t) => {
                    if (options.draw[t]) {
                        options.draw[t] = Object.assign({
                            shapeOptions: {
                                color: this.getDrawingColor(),
                                fillColor: this.getDrawingColor()
                            }
                        }, options.draw[t]);
                    }
                });
                if (options.edit) {
                    options.edit = Object.assign({}, options.edit);
                    options.edit = Object.assign(options.edit, {
                        featureGroup: drawnItems
                    });
                }
            }
            let drawControl = new L.Control.Draw(options);
            this._controls.draw = drawControl;
            this._l.addControl(drawControl);

            this.onMap('draw:created', (e) => {
                let type = e.layerType,
                    layer = e.layer;
                let config = {
                    type: type,
                    options: layer.options
                }
                if (layer.getLatLngs) {
                    config.latlngs = layer.getLatLngs();
                } else if (layer.getLatLng) {
                    config.latlng = layer.getLatLng();
                } else if (layer.getRadius) {
                    config.radius = layer.getRadius();
                }
                this.addLayer(config, this._layers.drawnItems);
            });

            // when items are removed
            this.onMap('draw:deleted', (e) => {
                var layers = e.layers;
                layers.eachLayer((layer) => {
                    this._removeLayer(layer, this._layers.drawnItems);
                });
            });

            this.onMap('draw:edited', (e) => {
                let layers = e.layers;
                layers.eachLayer((layer) => {

                });
            });

            this.onMap('draw:drawstart', () => {});

        },

        _addLayersControl: function() {
            if (typeof this._options.controls.layers === 'function') return; //external controls
            let options = Object.assign({}, this._options.controls.layers);
            this._controls.layers = L.control.layers(null, null, options);
            this._l.addControl(this._controls.layers);
            this.fire('add:control', {
                type: 'layers',
                control: this._controls.layers
            });
        },

        _addZoomControl: function() {
            let options = Object.assign({}, this._options.controls.zoom);
            this._controls.zoom = L.control.zoom(options);
            this._l.addControl(this._controls.zoom);
            this.fire('add:control', {
                type: 'zoom',
                control: this._controls.zoom
            });
        },

        _addAttributionControl: function() {
            let options = Object.assign({}, this._options.controls.attribution);
            this._controls.attribution = L.control.attribution(options);
            this._l.addControl(this._controls.attribution);
            this.fire('add:control', {
                type: 'atttribution',
                control: this._controls.attribution
            });
        },

        _loadFeatureGroup: function(configuration) {
            configuration.name = configuration.name || `${configuration.type}${this._indx++}`;
            configuration.layers = configuration.layers || {};
            let layer = L.featureGroup();
            this._l.addLayer(layer);
            this._layers[configuration.name] = {
                _l: layer,
                _configuration: configuration,
                _layers: {}
            }
            this._configuration.layers[configuration.name] = configuration;
            Object.keys(configuration.layers).map((key) => {
                this._loadLayer(configuration.layers[key], this._layers[configuration.name]);
            });
            this.fire(`load:featuregroup`, {
                layer: layer,
                configuration: configuration
            });

        },

        _loadLayerGroup: function() {
            configuration.name = configuration.name || `${configuration.type}${this._indx++}`;
            configuration.layers = configuration.layers || {};
            let layer = L.featureGroup();
            this._l.addLayer(layer);
            this._layers[configuration.name] = {
                _l: layer,
                _configuration: configuration,
                _layers: {}
            }
            this._configuration.layers[configuration.name] = configuration;
            Object.keys(configuration.layers).map((key) => {
                this._loadLayer(configuration.layers[key], this._layers[configuration.name]);
            });
            this.fire(`load:layergroup`, {
                layer: layer,
                configuration: configuration
            });
        },

        _loadPolygon: function(configuration, where) {
            if (!where) {
                if (this._layers.drawnItems) {
                    where = this._layers.drawnItems;
                } else {
                    where = this;
                }
            }
            if (typeof where == 'string') {
                where = this._layers[where];
            }
            let layer = L.polygon(configuration.latlngs ||
                configuration.latLngs ||
                configuration.path ||
                configuration.points ||
                configuration.coordinates ||
                configuration.coords || [configuration.lats || configuration.y, configuration.langs || configuration.x], configuration.options || {});

            where._l.addLayer(layer);
            where._configuration.layers[configuration.name] = configuration;
            where._layers[configuration.name] = {
                _l: layer,
                _configuration: configuration
            }

            this.fire('load:polygon', {
                layer: layer,
                configuration: configuration
            });

            return {
                _l: layer,
                _configuration: configuration
            };
        },

        _loadRectangle: function(configuration, where) {
            if (!where) {
                if (this._layers.drawnItems) {
                    where = this._layers.drawnItems;
                } else {
                    where = this;
                }
            }
            let layer = L.rectangle(configuration.bounds || configuration.latlngs ||
                configuration.latLngs ||
                configuration.path ||
                configuration.points ||
                configuration.coordinates ||
                configuration.coords || [configuration.lats || configuration.y, configuration.langs || configuration.x], configuration.options || {});

            where._l.addLayer(layer);
            where._configuration.layers[configuration.name] = configuration
            where._layers[configuration.name] = {
                _l: layer,
                _configuration: configuration
            };
            this.fire('load:rectangle', {
                layer: layer,
                configuration: configuration
            });

            return {
                _l: layer,
                _configuration: configuration
            };


        },

        _loadMarker: function(configuration, where) {
            if (!where) {
                if (this._layers.drawnItems) {
                    where = this._layers.drawnItems;
                } else {
                    where = this;
                }
            }
            let layer = L.marker(configuration.latlng ||
                configuration.latLng ||
                configuration.point ||
                configuration.coordinate ||
                configuration.coord || [configuration.lat || configuration.y, configuration.lang || configuration.x], configuration.options || {});

            where._l.addLayer(layer);
            where._configuration.layers[configuration.name] = configuration;
            where._layers[configuration.name] = {
                _l: layer,
                _configuration: configuration
            };

            this.fire('load:marker', {
                layer: layer,
                configuration: configuration
            });

            return {
                _l: layer,
                _configuration: configuration
            };
        },

        getBaseLayer: function() {
            return this._activeBaseLayer || this._layers[0]; // FIX THAT
        },

        loadGuideLayer: function(layerConfig) {
            if (!this.getBaseLayer()) return;
            layerConfig.name = layerConfig.name || 'Guide';
            let guideLayer = L.featureGroup();
            this._layers.push(guideLayer);
            guideLayer.on("add", () => {
                this._guideLayers.map((g) => {
                    if (g === guideLayer) return;
                    this._map.removeLayer(g);
                });

                this._drawControl.setDrawingOptions({
                    polyline: {
                        guideLayers: [guideLayer]
                    },
                    polygon: {
                        guideLayers: [guideLayer],
                        snapDistance: 5
                    },
                    rectangle: {
                        guideLayers: [guideLayer],
                        snapDistance: 5
                    }
                });
            });
            guideLayer.on("remove", () => {
                this._drawControl.setDrawingOptions({
                    polyline: {
                        guideLayers: null
                    },
                    polygon: {
                        guideLayers: null
                    },
                    rectangle: {
                        guideLayers: null
                    }
                });
            });
            if (layerConfig.points) {

            } else {
                let scale = 1;
                let baselayer = this._activeBaseLayer || this._tilesLayers[0];
                if (layerConfig.size) {
                    scale = layerConfig.size / this.getSize();
                    let tileSize = layerConfig.tileSize || layerConfig.size;
                    if (tileSize > 0 && layerConfig.size < 100 * tileSize) {
                        for (let i = 0; i <= layerConfig.size; i = i + tileSize) {
                            for (let j = 0; j <= layerConfig.size; j = j + tileSize) {
                                guideLayer.addLayer(L.circleMarker([-i / scale, j / scale], {
                                    radius: layerConfig.radius || 4,
                                    color: layerConfig.color || this.getDrawingColor()
                                }));
                            }
                        }
                    }
                }
            }

            if (this._layerControl) {
                this._layerControl.addOverlay(guideLayer, layerConfig.name);
            } else if (!this._options.externalControl) {
                this._map.addLayer(guideLayer);
            }
            this.fire('load:guidelayer', {
                layer: guideLayer,
                configuration: layerConfig
            });

        },

        loadImageLayer: function(layerConfig) {
            if (layerConfig.imageUrl) { //check if there is an url
                let options = layerConfig.options || {
                    opacity: layerConfig.opacity || 1,
                };

                Object.keys(layerConfig).map((key) => { //copy all the attributes of layerConfig
                    options[key] = options[key] || layerConfig[key];
                });

                options.bounds = layerConfig.bounds || [
                    [-256, 0],
                    [0, 256]
                ];
                let layer = L.imageOverlay(basePath + options.imageUrl, options.bounds, options);
                layer._configuration = options;
                this._layers.push(layer);
                if (options.baseLayer) {
                    this._configuration.size = this._configuration.size || options.size;
                    this._activeBaseLayer = this._activeBaseLayer || layer;
                }
                if (options.baseLayer) {
                    layer.on("add", () => {
                        this._map.setMaxZoom(options.maxZoom);
                        this._map.setMinZoom(options.minZoom);
                        this._activeBaseLayer = layer;
                    });
                }
                if (this._layerControl) {
                    if (options.baseLayer) {
                        this._layerControl.addBaseLayer(layer, options.name);
                        if (!this._state.baseLayerOn) {
                            this._map.addLayer(layer);
                            this._state.baseLayerOn = true;
                        }
                    } else {
                        this._layerControl.addOverlay(layer, options.name);
                    }
                } else if (!this._options.externalControl) {
                    this._map.addLayer(layer);
                }
                this._map.setView(options.view || [-100, 100], 0);
                this.fire('laod:imagelayer', {
                    layer: layer,
                    layerConfig: options
                });

            }

        },


        _loadTileLayer: function(configuration, where) {
            if (!where) {
                where = this;
            }
            if (typeof where === 'string') {
                where = this._layers[where];
            }
            //create layer
            if (configuration.tilesUrlTemplate) { //check if there is the tilesUrlTemplate
                let options = Object.assign({}, configuration.options || configuration);
                if (options.tileSize) {
                    if (Array.isArray(options.tileSize)) {
                        options.tileSize = L.point(options.tileSize[0], options.tileSize[1]);
                    }
                    if (options.tileSize.x && options.tileSize.y) {
                        options.tileSize = L.point(options.tileSize.x, options.tileSize.y);
                    }
                } else {
                    options.tileSize = 256;
                }

                let layer = L.tileLayer(configuration.tilesUrlTemplate, options);
                where._layers[configuration.name] = {
                    _l: layer,
                    _configuration: configuration
                }

                if (this._controls.layers) {
                    if (configuration.baseLayer) {
                        this._controls.layers.addBaseLayer(layer, configuration.name);
                        if (!this._state.baseLayerOn) {
                            this._l.addLayer(layer);
                            this._state.baseLayerOn = true;
                        }
                    } else {
                        this._controls.layers.addOverlay(layer, options.name);
                    }
                } else if (typeof this._options.controls.layers === 'function') {
                    this._options.controls.layers(layer, configuration, where);
                } else {
                    where._l.addLayer(layer);
                }
                this.fitWorld();
                this.fire('load:tileslayer', {
                    layer: layer,
                    configuration: configuration
                });
            }
        }
    });

    L.mapBuilder = function(map, options, configuration) {
        return (new L.MapBuilder(map, options, configuration));
    }

}
