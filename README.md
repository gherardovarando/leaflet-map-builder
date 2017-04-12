# Leaflet Map Builder
#### by  gherardo.varando <gherardo.varando@gmail.com>

#### demo at https://gherardovarando.github.io/leaflet-map-builder/

leaflet-map-builder is a leaflet plugin that permits to build a leaflet map starting from a configuration object that can be easily stored in JSON format.
leaflet-map-builder can create:
-  tileLayer
-  imageOverlay
-  featureGroup
-  layerGroup
-  polygon
-  rectangle
-  circle
-  polyline
-  marker

It also supports the following controls:

- LayersControl
- zoomControl
- attributionControl
- drawControl (via Leafelt.draw)


## API


### Creation

##### `` L.mapBuilder(map, options, configuration) ``
- ``map`` leaflet map object, instance of ``L.Map``
-  ``options`` options object (optional)
- ``configuration`` configuration object (optional), it can be set in a second time with ``setConfiguration`` method.


#### Options

The option that can be passed on creation
- ``drawingColor`` String, the color to draw
- ``controls``:
  - ``draw`` L.Control.Draw options
  - ``zoom`` L.Control.Zoom options
  - ``layers`` L.Control.Layers options
- ``tooltip`` :
   - ``polygon`` logical
   - ``rectangle``  logical
   - ``polyline`` logical
   - ``circle`` logical
- ``popup``   
  - ``polygon`` logical
  - ``rectangle``  logical
  - ``polyline`` logical
  - ``circle`` logical

#### Configuration

The configuration object that defines the layers that will be added to the map.

- ``type``, String equal to ``map`` otherwise the configuration will not be loaded.
- ``name``, String (optional).
- ``authors``, String (optional).
- ``layers``, layer configuration object.

##### Layer configuration

- ``type`` String, one of the possible layer types: tileLayer, imageOverlay (or imageLayer), featureGroup, layerGroup, polygon, polyline, rectangle, circle, marker.
- ``name`` String (optional).

Depending on the type of layer:
###### tileLayer
  - `tileUrlTemplate` String
  - ``baseLayer`` Logical
  - ``options`` TileLayer options

###### imageOverlay
 - ``imageUrl`` String
 - ``baseLayer`` Logical
 - ``bounds``   LatLng bounds
 - ``options``  ImageOverlay options

###### featureGroup/layerGroup
 - ``layers`` Object, layers configurations


###### polyline
  - ``latlngs`` LatLngs
  - ``options`` PolylineOptions

###### polygon
 - ``latlngs`` LatLngs
 - ``options`` PolylineOptions

###### rectangle
- ``latlngs`` LatLngs bounds
- ``options`` PolylineOptions

###### circle
- ``latlng`` LatLng
- ``options`` CircleOptions

###### marker
- ``latlng`` LatLng
- ``options`` MarkerOptions
###### Example
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
                "attribution": "&copy;<a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
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
                "attribution": "&copy; stamen",
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

##### ``setMap(map)``
- ``map`` L.Map object

Associate the leaflet map object

##### ``setConfiguration(configuration)``
- ``configuration`` configuration object

Set the configuration object and load it.

##### ``setOptions(options)``
- ``options`` options object.
Set the options and reload the map, the current configuration will be loaded if present.

##### ``clear()``
Clear the map and the configuration.

##### ``reload()``
Reload the map with the current options and configuration.

##### ``loadLayer(configuration, where)``
- ``configuration`` layer configuration object.
- ``where`` (optional), L.Map object or L.Layer as a featureGroup or layerGroup (must have an .addLayer method)

Load the layer specified by the ``configuration`` in ``where`` (or into the associated leaflet map).

##### ``onMap(event, cl)``

Register event on map, events registered by this method are cleared on ``clear`` method.

##### ``offMap(event)``

Unregister a map event.

##### ``setDrawingColor(color)``

##### ``getDrawingColor()``


#### Events
