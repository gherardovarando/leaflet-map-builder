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

if (L != undefined) {

    /**
     * MapBuilder Class
     */
    L.MapBuilder = L.Evented.extend({
        map: null,
        _indx: 0,
        _nameIndx: 0,
        _size: null,
        _configuration: {
            layers: {}
        },
        _eventsmap: [],
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
                layers: false, // logical, options of configuration or function for external control
                attribution: false
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

            this.setConfiguration(configuration);

        },

        /**
         * Set map object
         * @param {Object} map L.Map lealfet object
         */
        setMap: function(map) {
            if (map instanceof L.Map) {
                this.map = map;
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
            if (!configuration) return;
            this._configuration = this._parse(configuration);
            this.fire('set:configuration', {
                configuration: this._configuration
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
            if (this.map) {
                this.map.eachLayer((layer) => {
                    this.map.removeLayer(layer);
                });
                if (L.Control.Draw && this._controls.draw instanceof L.Control.Draw) {
                    this.map.removeControl(this._controls.draw);
                }

                if (this._controls.layers instanceof L.Control.Layers) {
                    this.map.removeControl(this._controls.layers);
                }
                if (this._controls.zoom instanceof L.Control.Zoom) {
                    this.map.removeControl(this._controls.zoom);
                }
                if (this._controls.attribution instanceof L.Control.Attribution) {
                    this.map.removeControl(this._controls.attribution);
                }
                this._removeMapListener();
                //this.map.off();
            }
            this._drawnItems = null;
            this._indx = 0;
            this._nameIndx = 0;
            this._size = null;
            this._eventsmap = [];
            this._layers = {};
            this._controls = {};
            this._state.baseLayerOn = false;
            this._activeBaseLayer = null;
            this.fire('clear');
        },

        _removeMapListener: function() {
            if (this.map) {
                this._eventsmap.map((ev) => {
                    this.map.off(ev);
                });
            }
        },

        reload: function() {
            if (!this.map) {
                return;
            } else {
                this.clear();
                if (this._options.controls.layers) {
                    this._addLayersControl();
                }
                if (this._options.controls.attribution) {
                    this._addAttributionControl();
                }
                this._indx = 0;
                //load all the layers
                if (this._configuration.layers) {
                    if (this._configuration.layers instanceof Array) {
                        this._configuration.layers.map((layer, key) => {
                            this.loadLayer(layer);
                        });
                    } else { //we assume is an object
                        Object.keys(this._configuration.layers).map((key) => {
                            this.loadLayer(this._configuration.layers[key]);
                        });
                    }

                }
                if (this._options.controls.draw) {
                    //this._addDrawnItems();
                    this._addDrawControl();
                }
                if (this._options.controls.zoom) {
                    this._addZoomControl();
                }
                if (this._configuration.maxZoom) {
                    this.setMaxZoom(this._configuration.maxZoom);
                }
                if (this._configuration.minZoom) {
                    this.setMinZoom(this._configuration.minZoom);
                }
                this.fitWorld();
                this.fire('reload');
            }
        },

        center: function() {
            this.map.setView([0, 0], 0);
        },

        onMap: function(ev, cl) {
            this._eventsmap.push(ev);
            this.map.on(ev, cl);
        },

        offMap: function(ev) {
            this.map.off(ev);
        },

        fitWorld() {
            this.map.fitWorld();
        },

        getSize() {
            return this._size;
        },

        getDrawingColor: function() {
            if (typeof this._drawingColor === 'string') return this._drawingColor;
            return "#ed8414";
        },

        setDrawingColor: function(color) {
            if (typeof color === 'string') this._drawingColor = color;
            if (this._controls.draw) {
                this._controls.draw.setDrawingOptions({
                    polygon: {
                        shapeOptions: {
                            color: color,
                            fillColor: color
                        }
                    },
                    rectangle: {
                        shapeOptions: {
                            color: color,
                            fillColor: color
                        }
                    },
                    circle: {
                        shapeOptions: {
                            color: color,
                            fillColor: color
                        }
                    },
                    polyline: {
                        shapeOptions: {
                            color: color,
                            fillColor: color
                        }
                    }
                });
            }
        },

        setMaxZoom: function(zoom) {
            this.map.setMaxZoom(zoom);
            this.fire('set:maxZoom', {
                maxZoom: zoom
            });
        },

        setMinZoom: function(zoom) {
            this.map.setMinZoom(zoom);
            this.fire('set:minZoom', {
                minZoom: zoom
            });
        },

        loadLayer: function(configuration, where) {
            if (!configuration) return;
            configuration.name = configuration.name || `${configuration.type}_${this._nameIndx++}`;
            configuration._id = this._indx++;
            configuration.options = configuration.options || {
                color: this.getDrawingColor(),
                fillColor: this.getDrawingColor()
            };
            let layer;
            if (!where || (!where instanceof L.LayerGroup)) {
                where = this.map;
            }
            switch (configuration.type) {
                case 'tileLayer':
                    layer = this._loadTileLayer(configuration, where);
                    break;
                case 'polygon':
                    layer = this._loadPolygon(configuration, where);
                    break;
                case 'rectangle':
                    layer = this._loadRectangle(configuration, where);
                    break;
                case 'circle':
                    layer = this._loadCircle(configuration, where);
                    break;
                case 'polyline':
                    layer = this._loadPolyline(configuration, where);
                    break;
                case 'marker':
                    layer = this._loadMarker(configuration, where);
                    break;
                case 'circleMarker':
                    layer = this._loadCircleMarker(configuration, where);
                    break;
                case 'guideLayer':
                    layer = this._loadGuideLayer(configuration, where);
                    break;
                case 'imageLayer':
                    layer = this._loadImageLayer(configuration, where);
                    break;
                case 'featureGroup':
                    layer = this._loadFeatureGroup(configuration, where);
                    break;
                case 'layerGroup':
                    layer = this._loadLayerGroup(configuration, where);
                    break;
                default:
                    return;
            }

            if (layer) {
                layer._id = configuration._id;
                if (configuration.tooltip) {
                    layer.bindTooltip(configuration.tooltip.content || configuration.tooltip, configuration.tooltip.options);
                } else if (this._options.tooltip[configuration.type]) {
                    layer.bindTooltip(configuration.name);
                }
                if (configuration.popup) {
                    layer.bindPopup(configuration.popup.content || configuration.popup, configuration.popup.options);
                } else if (this._options.popup[configuration.type]) {
                    layer.bindPopup(`${configuration.name}  <p>${configuration.details}</p>`);
                }
            }
            return layer;
        },

        _addDrawnItems: function() {
            this._drawnItems = this.loadLayer({
                name: 'drawnItems',
                role: 'drawnItems',
                type: 'featureGroup',
                layers: {}
            });
            this.fire('add:drawnitems', {
                configuration: {
                    name: 'drawnItems',
                    role: 'drawnItems',
                    type: 'featureGroup',
                    layers: {}
                }
            })
        },

        _addDrawControl: function() {
            if (!L.Control.Draw) return;
            if (!this._drawnItems) this._addDrawnItems();
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
                        featureGroup: this._drawnItems
                    });
                }
            }
            let drawControl = new L.Control.Draw(options);
            this._controls.draw = drawControl;
            this.map.addControl(drawControl);


        },

        _addLayersControl: function() {
            if (typeof this._options.controls.layers === 'function') return; //external controls
            let options = Object.assign({}, this._options.controls.layers);
            this._controls.layers = L.control.layers(null, null, options);
            this.map.addControl(this._controls.layers);
            this.fire('add:control', {
                type: 'layers',
                control: this._controls.layers
            });
        },

        _addZoomControl: function() {
            let options = Object.assign({}, this._options.controls.zoom);
            this._controls.zoom = L.control.zoom(options);
            this.map.addControl(this._controls.zoom);
            this.fire('add:control', {
                type: 'zoom',
                control: this._controls.zoom
            });
        },

        _addAttributionControl: function() {
            let options = Object.assign({}, this._options.controls.attribution);
            this._controls.attribution = L.control.attribution(options);
            this.map.addControl(this._controls.attribution);
            this.fire('add:control', {
                type: 'attribution',
                control: this._controls.attribution
            });
        },

        _loadFeatureGroup: function(configuration) {
            configuration.name = configuration.name || `${configuration.type}_${configuration._id}`;
            configuration.layers = configuration.layers || {};
            let layer = L.featureGroup();
            this.map.addLayer(layer);
            Object.keys(configuration.layers).map((key) => {
                this.loadLayer(configuration.layers[key], layer);
            });
            if (this._controls.layers) {
                this._controls.layers.addOverlay(layer, configuration.name);
            } else if (typeof this._options.controls.layers === 'function') {
                this._options.controls.layers(layer, configuration, this.map);
            } else {
                this.map.addLayer(layer);
            }
            if (configuration.role === 'drawnItems') {
                this._drawnItems = layer;
            }
            this.fire(`load:featuregroup`, {
                layer: layer,
                configuration: configuration
            });
            return layer;
        },

        _loadLayerGroup: function(configuration) {
            configuration.name = configuration.name || `${configuration.type}_${configuration._id}`;
            configuration.layers = configuration.layers || {};
            let layer = L.featureGroup();
            this.map.addLayer(layer);
            Object.keys(configuration.layers).map((key) => {
                this.loadLayer(configuration.layers[key], layer);
            });
            if (this._controls.layers) {
                this._controls.layers.addOverlay(layer, configuration.name);
            } else if (typeof this._controls.layers === 'function') {
                this._controls.layers(layer, configuration, this.map);
            } else {
                this.map.addLayer(layer);
            }
            this.fire(`load:layergroup`, {
                layer: layer,
                configuration: configuration
            });
            return layer;
        },

        _loadPolygon: function(configuration, where) {
            if (!where) {
                if (this._drawnItems) {
                    where = this._drawnItems;
                } else {
                    where = this.map;
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

            where.addLayer(layer);
            this.fire('load:polygon', {
                layer: layer,
                configuration: configuration,
                where: where
            });
            return layer;
        },

        _loadRectangle: function(configuration, where) {
            if (!where) {
                if (this._drawnItems) {
                    where = this._drawnItems;
                } else {
                    where = this.map;
                }
            }
            let layer = L.rectangle(configuration.bounds || configuration.latlngs ||
                configuration.latLngs ||
                configuration.path ||
                configuration.points ||
                configuration.coordinates ||
                configuration.coords || [configuration.lats || configuration.y, configuration.langs || configuration.x], configuration.options || {});

            where.addLayer(layer);
            this.fire('load:rectangle', {
                layer: layer,
                configuration: configuration,
                where: where
            });
            return layer;
        },


        _loadCircle: function(configuration, where) {
            if (!where) {
                if (this._drawnItems) {
                    where = this._drawnItems;
                } else {
                    where = this.map;
                }
            }
            let layer = L.circle(configuration.latlng || configuration.center, configuration.radius, configuration.options || {});

            where.addLayer(layer);
            this.fire('load:circle', {
                layer: layer,
                configuration: configuration,
                where: where
            });
            return layer;
        },

        _loadPolyline: function(configuration, where) {
            if (!where) {
                if (this._drawnItems) {
                    where = this._drawnItems;
                } else {
                    where = this.map;
                }
            }
            let layer = L.polyline(configuration.latlngs, configuration.options || {});
            where.addLayer(layer);
            this.fire('load:circle', {
                layer: layer,
                configuration: configuration,
                where: where
            });
            return layer;
        },

        _loadMarker: function(configuration, where) {
            if (!where) {
                if (this._drawnItems) {
                    where = this._drawnItems;
                } else {
                    where = this.map;
                }
            }
            let opt = Object.assign({
                icon: {
                    options: {}
                }
            }, configuration.options);
            if (!opt.icon.options.url) {
                delete opt.icon;
            } else {
                opt.icon = L.icon(opt.icon.options);
            }


            let layer = L.marker(configuration.latlng ||
                configuration.latLng ||
                configuration.point ||
                configuration.coordinate ||
                configuration.coord || [configuration.lat || configuration.y, configuration.lang || configuration.x], opt);

            if (this._options.dev) {
                configuration.details = `Lat:${layer.getLatLng().lat} Lng:${layer.getLatLng().lng}`;
            }
            where.addLayer(layer);
            this.fire('load:marker', {
                layer: layer,
                configuration: configuration,
                where: where
            });

            return layer;
        },

        _loadGuideLayer: function(configuration) {
            let guideLayer = L.featureGroup();
            guideLayer.on("add", () => {
                if (this._controls.draw) {
                    this._controls.draw.setDrawingOptions({
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
                }
            });
            guideLayer.on("remove", () => {
                if (this._controls.draw) {
                    this._controls.draw.setDrawingOptions({
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
                }
            });

            if (configuration.points) {

            } else {
                let baselayer = this._activeBaseLayer || this._tilesLayers[0];
                let size = configuration.size || this.getSize();
                let scale = size / this.getSize();
                let opt = Object.assign({
                    color: this.getDrawingColor(),
                    fillColor: this.getDrawingColor(),
                    radius: 4
                }, configuration);
                Object.assign(opt, configuration.options);
                let tileSize = configuration.tileSize || size;
                if (tileSize > 0 && size < 100 * tileSize) { //limit the number to draw to 10000
                    for (let i = 0; i <= configuration.size; i = i + tileSize) {
                        for (let j = 0; j <= configuration.size; j = j + tileSize) {
                            guideLayer.addLayer(L.circleMarker([-i / scale, j / scale], opt));
                        }
                    }
                }
            }

            if (this._controls.layers) {
                this._controls.layers.addOverlay(guideLayer, configuration.name);
            } else if (typeof this._controls.layers === 'function') {
                this._controls.layers(guideLayer, configuration, this.map);
            } else {
                this.map.addLayer(guideLayer);
            }

            this.fire('load:guidelayer', {
                layer: guideLayer,
                configuration: configuration
            });
            return guideLayer;

        },

        _loadImageLayer: function(configuration) {
            if (configuration.imageUrl) { //check if there is an url

                let options = Object.assign({
                    opacity: 1,
                    bounds: [
                        [-256, 0],
                        [0, 256]
                    ]
                }, configuration);
                Object.assign(options, configuration.options);
                let layer = L.imageOverlay(options.imageUrl, options.bounds, options);
                if (this._controls.layers) {
                    if (configuration.baseLayer) {
                        if (!this._state.baseLayerOn) {
                            this.map.addLayer(layer);
                            this._state.baseLayerOn = true;
                        }
                        this._controls.layers.addBaseLayer(layer, configuration.name);
                    } else {
                        this._controls.layers.addOverlay(layer, configuration.name);
                    }
                } else if (typeof this._options.controls.layers === 'function') {
                    this._options.controls.layers(layer, configuration, this.map);
                } else {
                    this.map.addLayer(layer);
                }
                this.fitWorld();
                this.fire('load:imagelayer', {
                    layer: layer,
                    configuration: configuration
                });
                return layer;

            }

        },


        _loadTileLayer: function(configuration) {
            //create layer
            if (configuration.tileUrlTemplate) { //check if there is the tilesUrlTemplate
                let options = Object.assign({}, configuration);
                Object.assign(options, configuration.options);
                if (options.tileSize) {
                    if (Array.isArray(options.tileSize)) {
                        options.tileSize = L.point(options.tileSize[0], options.tileSize[1]);
                        this._size = this._size || Math.max(options.tileSize);
                    }
                    if (options.tileSize.x && options.tileSize.y) {
                        options.tileSize = L.point(options.tileSize.x, options.tileSize.y);
                        this._size = this._size || Math.max(options.tileSize.x, options.tileSize.y);
                    }
                    if (options.tileSize > 0) {
                        this._size = this._size || options.tileSize;
                    }
                } else {
                    options.tileSize = 256;
                    this._size = this._size || options.tileSize;
                }

                let layer = L.tileLayer(configuration.tileUrlTemplate, options);

                if (this._controls.layers) {
                    if (configuration.baseLayer) {
                        if (!this._state.baseLayerOn) {
                            this.map.addLayer(layer);
                            this._state.baseLayerOn = true;
                        }
                        this._controls.layers.addBaseLayer(layer, configuration.name);
                    } else {
                        this._controls.layers.addOverlay(layer, options.name);
                    }
                } else if (typeof this._options.controls.layers === 'function') {
                    this._options.controls.layers(layer, configuration, this.map);
                } else {
                    this.map.addLayer(layer);
                }
                this.fitWorld();
                this.fire('load:tilelayer', {
                    layer: layer,
                    configuration: configuration
                });
                return layer;
            }
        }
    });

    L.mapBuilder = function(map, options, configuration) {
        return (new L.MapBuilder(map, options, configuration));
    }


}
