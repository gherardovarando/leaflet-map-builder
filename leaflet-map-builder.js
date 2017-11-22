// Copyright (c) 2017 Gherardo Varando
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
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
    _configuration: null,
    _eventsmap: [],
    _layers: {},
    _controls: {},
    _guides: [],
    _activeBaseLayer: null,
    _state: {
      baseLayerOn: false
    },
    _options: {
      loading: () => {},
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
      if (!map) return;
      if (map instanceof L.Map) {
        this.clear();
        this.map = map;
        this.fire("set:map", map);
      } else {
        throw {
          type: "Map error, trying to bind a non L.Map object",
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
      configuration.basePath = configuration.basePath || '';
      if (typeof configuration.type === 'string' && configuration.type.includes("map")) {
        return Object.assign({
          layers: {}
        }, configuration);
        //configuration.layers = configuration.layers || {};
        //return configuration;
      } else {
        throw {
          type: "configuration type error",
          configuration: configuration
        };
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
      //return Object.assign({}, this._configuration);
      return this._configuration;
    },

    setOptions: function(options) {
      if (!options) return;
      Object.assign(this._options, options);
      this.reload();
    },

    //clean the map
    clear: function(c) {
      if (this.map instanceof L.Map) {
        this.map.eachLayer((layer) => {
          if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
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
      }
      this._controls = {}
      this._drawnItems = null;
      this._indx = 0;
      this._nameIndx = 0;
      this._size = null;
      this._eventsmap = [];
      this._state.baseLayerOn = false;
      this._activeBaseLayer = null;
      this._guides = [];
      if (c) {
        this._configuration = null
      }
      this.fire('clear');
    },

    _removeMapListener: function() {
      if (this.map instanceof L.Map) {
        this._eventsmap.map((ev) => {
          this.map.off(ev);
        });
      }
    },

    reload: function() {
      if (!this.map || !this._configuration) {
        return;
      } else {
        this.clear();
        if (this._options.controls.layers) {
          this._addLayersControl();
        }
        if (this._options.controls.attribution) {
          this._addAttributionControl();
        }

        //load all the layers
        if (this._configuration && this._configuration.layers) {
          let i = 0;
          let tot = Object.keys(this._configuration.layers).length;
          if (this._configuration.layers instanceof Array) {
            this._configuration.layers.map((layer, key) => {
              this.loadLayer(layer, this.map);
              this._options.loading(i++, tot);
            });
          } else { //we assume is an object
            Object.keys(this._configuration.layers).map((key) => {
              this.loadLayer(this._configuration.layers[key], this.map);
              this._options.loading(i++, tot);
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
        if (this._configuration && this._configuration.maxZoom) {
          this.map.setMaxZoom(this._configuration.maxZoom);
        }
        if (this._configuration && this._configuration.minZoom) {
          this.map.setMinZoom(this._configuration.minZoom);
        }
        this.map.fitWorld();
        if (this._configuration && this._configuration.center) {
          this.map.setView(this._configuration.center, this._configuration.zoom || 0);
        }
        this.fire('reload');
      }
    },

    onMap: function(ev, cl) {
      this._eventsmap.push(ev);
      if (this.map instanceof L.Map) {
        this.map.on(ev, cl);
      }
    },

    offMap: function(ev) {
      if (this.map instanceof L.Map) this.map.off(ev);
    },


    loadLayer: function(configuration, where) {
      if (!configuration) return;
      configuration._id = this._indx++;
      configuration.name = configuration.name || `${configuration.type}_${configuration._id}`;
      configuration.options = configuration.options || {};
      let layer;
      if (!where || (!where instanceof L.LayerGroup)) {
        where = this.map;
      }
      if (configuration.multiLevel && !this.map.options.multilevel) return;
      switch (configuration.type.toLowerCase()) {
        case 'geojson':
          layer = this._loadGeoJSON(configuration, where)
          break;
        case 'tilelayer':
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
        case 'circlemarker':
          layer = this._loadCircleMarker(configuration, where);
          break;
        case 'guidelayer':
          if (typeof configuration.role === 'string' && !configuration.role.includes('guide')) configuration.role += ' guide'
          if (!configuration.role) configuration.role = 'guide'
          layer = this._loadGridLayer(configuration, where);
          break;
        case 'gridlayer':
          layer = this._loadGridLayer(configuration, where);
          break;
        case 'imageoverlay':
          layer = this._loadImageOverlay(configuration, where);
          break;
        case 'imagelayer':
          layer = this._loadImageOverlay(configuration, where);
          break;
        case 'featuregroup':
          layer = this._loadFeatureGroup(configuration, where);
          break;
        case 'layergroup':
          layer = this._loadLayerGroup(configuration, where);
          break;
        case 'tilelayerwms':
          layer = this._loadTileLayerWMS(configuration, where);
          break;
        case 'csvtiles':
          layer = this._loadCsvTiles(configuration, where);
          break;
        case 'deepzoom':
          layer = this._loadDeepZoom(configuration, where);
          break;
        default:
          return;
      }

      if (layer) {
        layer._id = configuration._id;
        layer._configuration = configuration;

        //tooltip
        if (configuration.tooltip) {
          layer.bindTooltip(configuration.tooltip.content || configuration.tooltip, configuration.tooltip.options);
        } else if (this._options.tooltip[configuration.type]) {
          layer.bindTooltip(() => {
            return configuration.name
          });
        }
        //popup
        if (configuration.popup) {
          layer.bindPopup(configuration.popup.content || configuration.popup, configuration.popup.options);
        } else if (this._options.popup[configuration.type]) {
          layer.bindPopup(() => {
            return `${configuration.name}  <p>${configuration.details || ''}</p>`
          });
        }

        //guide role
        if (typeof configuration.role === 'string' && configuration.role.includes('guide')) {
          layer.on("add", () => {
            this._guides.push(layer);
            this._updateGuides();
          });
          layer.on("remove", () => {
            this._guides.splice(this._guides.indexOf(layer), 1);
            this._updateGuides();
          });
        }


        //add the layer to something
        if (where && (typeof where.addLayer === 'function')) {
          if (this._options.controls.layers && this._controls.layers && where === this.map) {
            if (configuration.baseLayer) {
              if (!this._state.baseLayerOn) {
                where.addLayer(layer);
                this._state.baseLayerOn = true;
              }
              this._controls.layers.addBaseLayer(layer, configuration.name);
            } else {
              this._controls.layers.addOverlay(layer, configuration.name);
            }
          } else if (typeof this._options.controls.layers === 'function') {
            this._options.controls.layers(layer, configuration, where);
          } else {
            where.addLayer(layer);
          }
        }


        //fire the event
        this.fire('load:layer', {
          layer: layer,
          configuration: configuration,
          where: where
        });
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
      });
    },


    _updateGuides: function(guides) {
      if (guides && guides.length >= 0) this._guides = guides;
      let options = {};
      let keys = ['polygon', 'polyline', 'circle', 'rectangle', 'marker', 'circlemarker'];
      keys.map((tag) => {
        if (this._options.controls && this._options.controls.draw && this._options.controls.draw[tag]) {
          options[tag] = {
            guideLayers: this._guides
          }
        }
      });
      if (this._controls.draw) {
        this._controls.draw.setDrawingOptions(options);
      }
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
        let keys = ['polygon', 'polyline', 'circle', 'rectangle', 'marker', 'circlemarker'];
        keys.map((tag) => {
          if (options.draw[tag]) {
            options.draw[tag] = Object.assign({
              guideLayers: this._guides
            }, options.draw[tag]);
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
      if (this.map instanceof L.Map) this.map.addControl(drawControl);
      this.fire('load:control', {
        controlType: 'draw',
        control: this._controls.draw,
        featureGroup: this._drawnItems
      })
    },

    _addLayersControl: function() {
      if (typeof this._options.controls.layers === 'function') return; //external controls
      let options = Object.assign({}, this._options.controls.layers);
      this._controls.layers = L.control.layers(null, null, options);
      if (this.map instanceof L.Map) this.map.addControl(this._controls.layers);
      this.fire('load:control', {
        controlType: 'layers',
        control: this._controls.layers
      });
    },

    _addZoomControl: function() {
      let options = Object.assign({}, this._options.controls.zoom);
      this._controls.zoom = L.control.zoom(options);
      if (this.map instanceof L.Map) this.map.addControl(this._controls.zoom);
      this.fire('load:control', {
        controlType: 'zoom',
        control: this._controls.zoom
      });
    },

    _addAttributionControl: function() {
      let options = Object.assign({}, this._options.controls.attribution);
      this._controls.attribution = L.control.attribution(options);
      if (this.map instanceof L.Map) this.map.addControl(this._controls.attribution);
      this.fire('load:control', {
        controlType: 'attribution',
        control: this._controls.attribution
      });
    },

    _loadFeatureGroup: function(configuration) {
      configuration.name = configuration.name || `${configuration.type}_${configuration._id}`;
      configuration.layers = configuration.layers || {};
      let layer = L.featureGroup();
      if (typeof configuration.role === 'string' && configuration.role.includes('drawnItems')) {
        this._drawnItems = layer;
      }
      Object.keys(configuration.layers).map((key) => {
        this.loadLayer(configuration.layers[key], layer);
      });
      return layer;
    },

    _loadLayerGroup: function(configuration) {
      configuration.name = configuration.name || `${configuration.type}_${configuration._id}`;
      configuration.layers = configuration.layers || {};
      let layer = L.featureGroup();
      //this.map.addLayer(layer);
      Object.keys(configuration.layers).map((key) => {
        this.loadLayer(configuration.layers[key], layer);
      });
      return layer;
    },

    _loadPolygon: function(configuration) {
      let layer = L.polygon(configuration.latlngs ||
        configuration.latLngs ||
        configuration.path ||
        configuration.points ||
        configuration.coordinates ||
        configuration.coords || [configuration.lats || configuration.y, configuration.langs || configuration.x], configuration.options || {});

      return layer;
    },

    _loadRectangle: function(configuration) {
      let layer = L.rectangle(configuration.bounds || configuration.latlngs ||
        configuration.latLngs ||
        configuration.path ||
        configuration.points ||
        configuration.coordinates ||
        configuration.coords || [configuration.lats || configuration.y, configuration.langs || configuration.x], configuration.options || {});
      return layer;
    },


    _loadCircle: function(configuration) {
      let layer = L.circle(configuration.latlng || configuration.center, configuration.options || {});
      return layer;
    },

    _loadPolyline: function(configuration) {
      let layer = L.polyline(configuration.latlngs, configuration.options || {});
      return layer;
    },

    _loadCircleMarker: function(configuration) {
      let opt = Object.assign({
        radius: 10
      }, configuration.options);
      let layer = L.circleMarker(configuration.latlng ||
        configuration.latLng ||
        configuration.center ||
        configuration.point ||
        configuration.coordinate ||
        configuration.coord || [configuration.lat || configuration.y, configuration.lang || configuration.x], opt);

      return layer;
    },

    _loadMarker: function(configuration) {
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
      return layer;
    },

    _loadGridLayer: function(configuration) {
      let gridLayer = L.featureGroup();
      let scale = configuration.scale || 1;
      let size = (configuration.size || 256);
      let opt = Object.assign({
        radius: 4
      }, configuration);
      Object.assign(opt, configuration.options);
      let tileSize = (configuration.tileSize || size);
      if (tileSize > 0 && size < 100 * tileSize) { //limit the number to draw to 10000
        for (let i = 0; i <= configuration.size; i = i + tileSize) {
          for (let j = 0; j <= configuration.size; j = j + tileSize) {
            gridLayer.addLayer(L.circleMarker([-i / scale, j / scale], opt));
          }
        }
      }
      return gridLayer;
    },

    _loadImageOverlay: function(configuration) {
      let url = configuration.imageUrl || configuration.url
      if (typeof url === 'string') { //check if there is an url
        let options = Object.assign({
          opacity: 1,
          bounds: [
            [-256, 0],
            [0, 256]
          ]
        }, configuration);
        Object.assign(options, configuration.options);
        let layer = L.imageOverlay(this._joinBasePath(url), options.bounds, options);
        return layer;
      }

    },

    _loadTileLayerWMS: function(configuration) {
      //create layer
      let url = configuration.url || configuration.baseUrl
      if (typeof url == 'string') { //check if there is the tilesUrlTemplate
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
        if (options.layers) {
          let layer = L.tileLayer.wms(this._joinBasePath(url), options);
          return layer;
        }
      }
    },


    _loadTileLayer: function(configuration) {
      //create layer
      let url = configuration.url || configuration.tileUrlTemplate || configuration.urlTemplate
      if (typeof url === 'string') { //check if there is the tilesUrlTemplate
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

        let layer;
        if (configuration.multiLevel && (typeof L.tileLayer.ml === 'function')) {
          layer = L.tileLayer.ml(this._joinBasePath(url), options);
        } else {
          layer = L.tileLayer(this._joinBasePath(url), options);
        }
        return layer;
      }
    },

    _loadCsvTiles: function(configuration, where) {
      //create layer
      let url = configuration.url || configuration.urlTemplate
      if (url) { //check if there is the tilesUrlTemplate
        if (L.csvTiles) {
          let layer = L.csvTiles(this._joinBasePath(url), configuration.options);
          return layer;
        } else {
          throw {
            type: "leaflet-csvTiles plugin error",
            message: 'leaflet-csvTiles is not loaded, please load it before attempting to load a csvTile'
          };
        }
      }
    },

    _loadGeoJSON: function(configuration, where) {
      let data;
      if (configuration.data) data = configuration.data;
      else return;
      return L.geoJSON(data);
    },

    _joinBasePath: function(url) {
      let basePath = this._configuration.basePath;
      if (url.startsWith("http") ||
        url.startsWith("file:")) {
        return url;
      }
      if (url.startsWith(basePath)) {
        return url;
      }
      return `${basePath}${url}`; //simple join, maybe we should at least check for double slash //
    },

    _loadDeepZoom: function(configuration, where) {
      if (typeof L.tileLayer.deepzoom != 'function') return
      let url = configuration.url || configuration.tileUrlTemplate || configuration.urlTemplate
      if (typeof url === 'string') { //check if there is the tilesUrlTemplate
        let options = Object.assign({}, configuration);
        Object.assign(options, configuration.options);
        if (options.tileSize) {} else {
          options.tileSize = 256;
        }
        let layer = L.tileLayer.deepzoom(this._joinBasePath(url), options);
        return layer;
      }
    }

  });




  L.mapBuilder = function(map, options, configuration) {
    return (new L.MapBuilder(map, options, configuration));
  }


}
