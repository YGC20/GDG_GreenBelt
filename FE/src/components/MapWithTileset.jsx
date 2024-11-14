import React from "react";
import MapGL, { Source, Layer } from "react-map-gl";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZHVkYWRpZG8iLCJhIjoiY20zaDI2aXp5MGI1YTJscHQyMHF3cWVmNSJ9.h0rrQrjgno24QZjnIZx3Tw"; // 발급받은 Mapbox Access Token을 여기에 입력하세요.

function MapWithTileset() {
  return (
    <MapGL
      initialViewState={{
        latitude: 36.5, // 지도 중심 좌표 (대한민국 중심 예시)
        longitude: 127.5,
        zoom: 7,
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/dudadido/cm3h2etw0006801r7hjpc83w0" // 기본 맵 스타일
      mapboxAccessToken={MAPBOX_TOKEN}
    >
      <Source
        id="grid-data"
        type="vector"
        url="mapbox://dudadido.3rxucz9w" // Tileset ID 사용
      >
        <Layer
          id="grid-layer"
          type="fill"
          source-layer="1km_2022-d5osyhchevron-right" // 타일셋의 source-layer 이름을 확인해서 입력하세요.
          paint={{
            "fill-color": "#888", // 그리드의 기본 색상
            "fill-opacity": 0.4,
          }}
        />
      </Source>
    </MapGL>
  );
}

export default MapWithTileset;
