import React from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { 
    LogViewer,
    VIEW_MODE,
} from 'streetscape.gl';
import { XVIZ_STYLE, CAR } from './constants';

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

export default class MapView extends React.PureComponent {

    render() {

        const { log, settings, mapToken, mapStyle, debug } = this.props;
        const mapdata = require('./Dgist_driving_lane.json')
        const middleline = require("./Dgist_centerline.json")

        const customLayers = [
            new GeoJsonLayer({

                id: 'Dgist_driving_lane',
                data: mapdata,
                stroked: false,
                filled: false,
                extruded: false,
                getFillColor: f => (f && f.properties && f.properties.fill) || [255, 255, 255],
                getLineColor: f => (f && f.properties && f.properties.stroke) || [255, 255, 255],
                getLineWidth: 0.3
                
            }),
            new GeoJsonLayer({               
                id: 'Dgist_centerline',
                data: middleline,
                stroked: false,
                filled: false,
                extruded: false,
                getFillColor: f => (f && f.properties && f.properties.fill) || [255, 255, 0],
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
                renderObjectLabel={renderObjectLabel}
                customLayers={customLayers}
                debug={debug}
            />
        );
    }
}