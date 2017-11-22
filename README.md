# Leaflet Map Builder

## by gherardo.varando [gherardo.varando@gmail.com](mailto:gherardo.varando@gmail.com)

## demo at <https://gherardovarando.github.io/leaflet-map-builder/>

leaflet-map-builder is a leaflet plugin that permits to build a leaflet map starting from a configuration object that can be easily stored in JSON format. leaflet-map-builder can create the following type of layers:

- tileLayer
- tileLayerWMS
- imageOverlay
- featureGroup
- layerGroup
- GeoJSON
- polygon
- rectangle
- circle
- polyline
- marker
- circlemarker
- [csvTiles](https://github.com/gherardovarando/leaflet-csvtiles)
- [deepZoom](https://github.com/alfarisi/leaflet-deepzoom)

It works fine with [leaflet-multilevel](https://github.com/gherardovarando/leaflet-multilevel/), through the `multiLevel` option in layer configuration (see [Layer configuration](#layer-configuration)).

It also supports the following controls:

- LayersControl
- zoomControl
- attributionControl
- drawControl (via Leafelt.draw and works well with leaflet.snap)

### If you want to add support for a particular layer or control just fork the repository, implement the new layer appropriate method and (if you want) make a pull request.

## API

### Creation

#### `L.mapBuilder(map, options, configuration)`

- `map` leaflet map object, instance of `L.Map` (optional)
- `options` options object (optional)
- `configuration` configuration object (optional), it can be set in a second time with `setConfiguration` method.

#### Options

The option that can be passed on creation

- `drawingColor` String, the color to draw
- `controls`:

  - `draw` L.Control.Draw options
  - `zoom` L.Control.Zoom options
  - `layers` L.Control.Layers options or a function `function(layer, configuration, where)`, if `null` or `false` the layers will be added to the map directly.

- `tooltip` Define which objects will have an appended tooltip automatically set with content given by the `name` in the layer configuration object. Otherwise individually tooltip can be created with the `tooltip` field in the layer configuration object (see [Layer configuration](#layer-configuration)).

  - `polygon` logical
  - `rectangle` logical
  - `polyline` logical
  - `circle` logical
  - `marker` logical
  - ....

- `popup` Define which objects will have an appended popup automatically set with content given by the fields `name` and `details` in the layer configuration object. Otherwise individually popup can be created with the `popup` field in the layer configuration object (see [Layer configuration](#layer-configuration)).

  - `polygon` logical
  - `rectangle` logical
  - `polyline` logical
  - `circle` logical
  - `marker` logical
  - ....

#### Configuration

The configuration object that defines the layers that will be added to the map.

- `type`, String equal to `map` otherwise the configuration will not be loaded.
- `name`, String (optional).
- `authors`, String (optional).
- `layers`, array or object of layer configuration objects (optional).
- `center`, Array (optional), where the map has to be centered on loading.
- `zoom`, Integer (optional), zoom to be set in loading.

##### Layer configuration

- `type` String, one of the possible layer types: tileLayer, tileLayerWMS, imageOverlay (or imageLayer), featureGroup, layerGroup, polygon, polyline, rectangle, circle, marker, circlemarker, csvTiles, tileLayerMultiSlice.
- `name` String (optional).
- `role` String (optional), a string of type `role1 role2 role3` where each role can be one of the following:

  - `drawnItems` for featureGroup type layers it indicates that the given layer has to be used as the featureGroup for editing in the drawControl.
  - `guide` the given layer will be used as snap guideLayer, works for polygon, polyline, rectangle, marker, circlemarker, featureGroup, layerGroup.

- `author` String (optional).

- `details` String (optional).
- `multiLevel` Logical, use the multiLevel (`.ml`) verison of the type of layer works for tileLayer.
- `popup` String or object:

  - `content` String the content of the popup
  - `options` Object, popup options.

- `tooltip` String or object:

  - `content` String the content of the tooltip
  - `options` Object, tooltip options.

Plus, other layer-dependent options:

###### tileLayer

- `url || tileUrlTemplate || urlTemplate` String
- `baseLayer` Logical
- `options` TileLayer options

###### tileLayerWMS

- `url || baseUrl` String
- `baseLayer` Logical
- `options` TileLayer.WMS options

###### imageOverlay

- `url || imageUrl` String
- `baseLayer` Logical
- `bounds` LatLng bounds
- `options` ImageOverlay options

###### csvTile

- `url || urlTemplate` String
- `options` CsvTile options

###### featureGroup/layerGroup

- `layers` Object, layers configurations

###### # GeoJSON

- `data` geoJSON object
- `options`

###### polyline

- `latlngs` LatLngs
- `options` PolylineOptions

###### polygon

- `latlngs` LatLngs
- `options` PolylineOptions

###### rectangle

- `latlngs` LatLngs bounds
- `options` PolylineOptions

###### circle

- `latlng` LatLng
- `options` CircleOptions

###### marker

- `latlng` LatLng
- `options` MarkerOptions

###### circlemarker

- `latlng` LatLng
- `options` CircleMarkerOptions

###### gridLayer

Crete a grid of circle markers, if `role` includes `guide` it creates a snapping guide for drawing.

- `options` Options object:

  - `size`
  - `tileSize`
  - `color`
  - `radius`
  - `fillColor`

###### deepZoom

- `url`
- `options` Options object:
  - `width` Number, width of the original image
  - `height` Number, height of the original image
  - `imageFormat` String , default to `'jpg'`
  - `tileSize` Number, default to `256`
  - `maxZoom` Number, optional

###### Example

You can try copy paste the following configuration in the demo page.

```
  {
    "type": "map",
    "layers": {
        "a": {
            "name": "OpenStreetMap",
            "type": "tileLayer",
            "tileUrlTemplate": "http://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "baseLayer": true,
            "options": {
                "tileSize": 256,
                "noWrap": true,
                "attribution": "©<a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
            }
        },
        "b": {
            "name": "Stamen Watercolor",
            "type": "imageOverlay",
            "imageUrl": "http://c.tile.stamen.com/watercolor/0/0/0.jpg",
            "bounds": [
                [
                    360,
                    180
                ],
                [
                    -360,
                    -180
                ]
            ],
            "options": {
                "attribution": "© stamen",
                "opacity": 0.4
            }
        },
        "karona": {
            "name": "korona.geog.uni-heidelberg",
            "type": "tileLayer",
            "tileUrlTemplate": "http://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}",
            "baseLayer": true,
            "options": {
                "tileSize": 256,
                "maxZoom": 18,
                "noWrap": true
            }
        },
        "featgr": {
            "name": "some shapes",
            "type": "featureGroup",
            "layers": {
                "1": {
                    "type": "polygon",
                    "latlngs": [
                        [
                            34,
                            -10
                        ],
                        [
                            7,
                            9
                        ],
                        [
                            19,
                            -54
                        ],
                        [
                            78,
                            -90
                        ]
                    ],
                    "name": "polygon_3",
                    "options": {
                        "color": "#ed8414",
                        "fillColor": "#ed8414"
                    }
                },
                "2": {
                    "type": "polygon",
                    "latlngs": [
                        [
                            70,
                            123
                        ],
                        [
                            104,
                            115
                        ],
                        [
                            88,
                            140
                        ],
                        [
                            60,
                            110
                        ]
                    ],
                    "name": "polygon_4",
                    "tooltip": {
                      "content": "I am a permanent tooltip",
                      "options": {
                        "permanent": true
                      }
                    },
                    "options": {
                        "color": "#ed8414",
                        "fillColor": "#ed8414"
                    }
                },
                "circ": {
                    "name": "circle",
                    "type": "circle",
                    "latlng": [
                        0,
                        0
                    ],
                    "options": {
                        "radius": 200000
                    }
                },
                "circ2": {
                    "name": "circle",
                    "type": "circle",
                    "latlng": [
                        -20,
                        80
                    ],
                    "popup": "That's a circle!",
                    "options": {
                        "radius": 3000000
                    }
                }
            }
        }
    }
  }
```

#### Methods

Since `L.MapBuilder` extends `L.Evented` it inherits all its methods.

##### `setMap(map)`

- `map` L.Map object

Associate the leaflet map object

##### `setConfiguration(configuration)`

- `configuration` configuration object

Set the configuration object and load it.

##### `setOptions(options)`

- `options` options object. Set the options and reload the map, the current configuration will be loaded if present.

##### `clear()`

Clear the map layers, controls and the events (just the events added with `onMap` method).

##### `reload()`

Reload (clean and load) the map with the current options and configuration. That is load the controls specified by the options and load all the layers in the configuration object.

##### `loadLayer(configuration, where)`

- `configuration` layer configuration object.
- `where` (optional), L.Map object or L.Layer as a featureGroup or layerGroup (must have an .addLayer method)

Returns `layer` the leaflet layer.

Load the layer specified by the `configuration` in `where` (or into the associated leaflet `map`).

##### `onMap(event, cl)`

Register event on map, events registered by this method are cleared on `clear` method.

##### `offMap(event)`

Unregister a map event.

#### Events

##### `set:map`

Emitted when the a map object is linked to the MapBuilder.

##### `set:configuration`

Emitted when a new configuration object is set.

##### `clear`

Emitted when the map is cleared.

##### `reload`

Emitted when the reloading is completed.

##### `load:layer`

Emitted when a layer is loaded. Returns

- `layer` leaflet layer loaded.
- `configuration` configuration object of the layer.
- `where` leaflet object where the layer is(has to be, depending of the value of the layers control) added.

##### `load:control`

Emitted when a control is loaded. Returns

- `controlType` type of control.
- `control` control object.

### LICENSE

The MIT License (MIT)

Copyright (c) 2017 Gherardo Varando (gherardo.varando@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
