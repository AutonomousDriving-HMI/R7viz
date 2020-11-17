import React from 'react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {LogViewer, VIEW_MODE} from 'streetscape.gl';
import { XVIZ_CONFIG, APP_SETTINGS, CONFIG_SETTINGS, XVIZ_STYLE, CAR } from './constants';
//import {XVIZ_STYLE, LOG_VIEWER_STYLE} from './custom-styles';


export default class MapView extends React.PureComponent {
  _onViewStateChange = ({viewOffset}) => {
    this.props.onSettingsChange({viewOffset});
  };
  state = {
    mapGeoJsonUrl: 'https://raw.githubusercontent.com/GwangRyul/kitti-data/main/2011_09_26/trim_only_dgits_detail.geojson'
  };

  

  /**map update code
   * 이 코드를 실행한다면 map loading 때문에 StreetScape.gl이 느려진다.
   * map이 깨져도 된다면 주석처리할것
   * 
   */
  /**********************************map loading function start**************************************** */

  componentDidMount() {
    // Attach event listener when new log data arrives
    this.props.log.on('update', this._onDataUpdate);
  }

  componentWillUnmount() {
    // Remove event listener
    this.props.log.off('update', this._onDataUpdate);
  }

  _onDataUpdate() {
    //const frame = this.props.log.getCurrentFrame();
    // `getChunkIdFromLngLat` is a utility that returns the internal map id from [longitude, latitude]
    //const chunkId = getChunkIdFromLngLat(frame.trackPosition);
    this.setState({mapGeoJsonUrl: `https://raw.githubusercontent.com/GwangRyul/kitti-data/main/2011_09_26/trim_only_dgits_detail.geojson`});
    //this.setState({mapGeoJsonUrl: `http://our.map.service/?chunk=${chunkId}`});
  }

  /**********************************map loading function end**************************************** */


  render() {

    const {log, settings,mapToken, mapStyle} = this.props;
    //console.log("geojson data",this.state.mapGeoJsonUrl);

    //geojsonlayer customLayers

    const customLayers = [
      new GeoJsonLayer({
        id: 'map-geojson-layer',
        // The layer is only re-generated if this URL changes
        data: this.state.mapGeoJsonUrl,
        //pickable: true,
        stroked: true,
        filled: true,
        extruded: true,
        pointRadiusScale : 0,
        getFillColor: f => (f && f.properties && f.properties.fill) || [255, 0, 0],
        getLineColor: f => (f && f.properties && f.properties.stroke) || [255, 255, 255],
        getLineWidth: 0.5
      })
    ];

    return (
      <LogViewer
        log={log}
        mapboxApiAccessToken={mapToken}
        mapStyle={mapStyle}
        car={CAR}
        xvizStyles={XVIZ_STYLE}
        customLayers={customLayers}
        viewMode={VIEW_MODE[settings.viewMode]}
        customLayers={customLayers}
      />
    );
  }
}