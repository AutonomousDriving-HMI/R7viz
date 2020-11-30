import React from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { 
    LogViewer,
    VIEW_MODE,
    LogViewerStats,
    XVIZWorkerFarmStatus,
    XVIZWorkersMonitor,
    XVIZWorkersStatus 
} from 'streetscape.gl';
import { XVIZ_CONFIG, APP_SETTINGS, CONFIG_SETTINGS, XVIZ_STYLE, CAR } from './constants';
import { COORDINATE_SYSTEM } from "@deck.gl/core";

const renderObjectLabel = ({ id, object, isSelected }) => {
    const feature = object.getFeature('/tracklets/objects');

    if (!feature) {
        return isSelected && <b>{id}</b>;
    }

    const { classes } = feature.base;

    if (isSelected) {
        return (
            <div>
                <div>
                    <b>{id}</b>
                </div>
                <div>{classes.join(' ')}</div>
            </div>
        );
    }

    const objectType = classes && classes.join('');
    if (objectType in OBJECT_ICONS) {
        return (
            <div>
                <i className={`icon-${OBJECT_ICONS[objectType]}`} />
            </div>
        );
    }

    return null;
};

var count = 0;

export default class MapView extends React.PureComponent {


    /*
    mapview 기본 양식

    _onViewStateChange = ({ viewOffset }) => {
        this.props.onSettingsChange({ viewOffset });
    };
    state = {
        mapGeoJsonUrl: 'https://raw.githubusercontent.com/GwangRyul/kitti-data/main/2011_09_26/trim_only_dgits_detail.geojson'
    };
    */
    



    /**map update code
     * 이 코드를 실행한다면 map loading 때문에 StreetScape.gl이 느려진다.
     * map이 깨져도 된다면 주석처리할것
     * 
     */
    /**********************************map loading function start**************************************** */
    /*
    componentDidMount = () => {
        // Attach event listener when new log data arrives
        this.props.log.on('update', this._onDataUpdate);
    }

    componentWillUnmount = () => {
        // Remove event listener
        this.props.log.off('update', this._onDataUpdate);
    }

    _onDataUpdate = () => {
        //const frame = this.props.log.getCurrentFrame();
        // `getChunkIdFromLngLat` is a utility that returns the internal map id from [longitude, latitude]
        //const chunkId = getChunkIdFromLngLat(frame.trackPosition);
        this.setState({ mapGeoJsonUrl: `https://raw.githubusercontent.com/GwangRyul/kitti-data/main/2011_09_26/trim_only_dgits_detail.geojson` });
        //this.setState({mapGeoJsonUrl: `http://our.map.service/?chunk=${chunkId}`});
    }
    */
    
    /**********************************map loading function end**************************************** */


    render() {

        const { log, settings, mapToken, mapStyle, debug } = this.props;
        //console.log("geojson data",this.state.mapGeoJsonUrl);

        //const mapdata = require('./trim_only_dgits_detailgeo.json')
        //const middleline = require("./middlelinegeo.json")

        const mapdata = require('./dgist_carlinegeo.json')
        const middleline = require("./dgist_centerlinegeo.json")



        //geojsonlayer customLayers

        /*
        geojson 기본양식

        stroked: false,
        filled: true,
        extruded: true,
        pointRadiusScale: 0,
        getFillColor: f => (f && f.properties && f.properties.fill) || [255, 0, 0],
        getLineColor: f => (f && f.properties && f.properties.stroke) || [255, 255, 255],
        getLineWidth: 0.5
        */

        const customLayers = [
            new GeoJsonLayer({

                id: 'map-geojson-layer',
                // The layer is only re-generated if this URL changes
                data: mapdata,
                //pickable: true,
                stroked: false,
                filled: false,
                wireframe: false,
                extruded: false,
                getFillColor: [255, 255, 255, 255],
                getLineColor: [255, 255, 255, 255],
                getLineWidth: 0.3,
                getRadius: 0.00001,
                opacity: 10
            }),
            new GeoJsonLayer({

                
                id: 'middle-geojson-layer',
                // The layer is only re-generated if this URL changes
                data: middleline,
                //pickable: true,
                stroked: false,
                filled: false,
                extruded: false,
                getRadius: 0.00001,
                pointRadiusScale: 0,
                getFillColor: f => (f && f.properties && f.properties.fill) || [255, 255, 255],
                getLineColor: f => (f && f.properties && f.properties.stroke) || [255, 255, 0],
                getLineWidth: 0.7
                
            })
        ];

        return (
            <LogViewer
                log={log}
                mapboxApiAccessToken={mapToken}
                mapStyle={mapStyle}
                car={CAR}
                xvizStyles={XVIZ_STYLE}
                viewMode={VIEW_MODE[settings.viewMode]}
                showTooltip={true}
                //style={LOG_VIEWER_STYLE}
                //아래는 Object Labeling을 위한 코드
                renderObjectLabel={renderObjectLabel}
                customLayers={customLayers}
                debug={debug}
            />
        );
    }
}