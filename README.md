# Leaflet Map Builder
#### by  gherardo.varando <gherardo.varando@gmail.com>

#### demo at https://gherardovarando.github.io/leaflet-map-builder/

leaflet-map-builder is a leaflet plugin that permits to build a leaflet map starting from a configuration object that can be easily stored in JSOn format.
leaflet-map-builder can create:
-  tileLayer
-  imageLayer
-  featureGroup
-  layerGroup
-  polygon
-  rectangle
-  circle
- polyline
- marker

It also supports the following controls:

- LayersControl
- zoomControl
- attributionControl
- drawControl (via Leafelt.draw)


### API

#### Map configuration structures

The map configuration object must be as follow:

```
configuration = {
  name : 'readable map name', \\ optional
  authors : 'XXX <xxx@aaa.bbb>'
  layers : {
    l1 : { \\the keys of the layer object do not affects the map
      name: 'layer 1', \\optional
      type: 'tileLayer',
      tileUrlTemplate: 'url template',
      tileSize: 256,
      baseLayer: true
    },
    l2: {
       name: 'layer 2',
       type: 'tileLayer',
       tileUrlTemplate: 'url template',
       tileSize: 512,
       baseLayer: false
    }
    \\ ... others layers

  }
  // others fields will be ignored by leaflet-map-builder and can be used to store others informations
  data = {
  \\  ...
  }
}
```

#### Creation

##### `` L.mapBuilder(map, options, configuration) ``
- ``map`` leaflet map object, instance of ``L.Map``
-  ``options`` options object (optional)
- ``configuration`` configuration object (optional)


#### Options

The option that can be passed on creation
- ``drawingColor`` String, the color to draw
- ``controls``:
  - ``draw`` L.Control.Draw options
  - ``zomm`` L.Control.Zoom options
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

#### Methods

##### ``setMap(map)``

##### ``setConfiguration(configuration)``

##### ``setOptions(options)``

##### ``clear()``

##### ``reload()``

##### ``center()``

##### ``onMap(event, cl)``

##### ``offMap(event)``

##### ``fitWorld()``

##### ``setDrawingColor(color)``

##### ``getDrawingColor()``

##### ``setMaxZoom``

##### ``setMinZoom``

##### ``loadLayer(configuration, where)``


#### Events
