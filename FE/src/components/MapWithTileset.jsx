import React, { useState, useRef, useEffect, useCallback } from "react";
import MapGL, { Source, Layer } from "react-map-gl";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
const MAPBOX_TOKEN = "pk.eyJ1IjoiZHVkYWRpZG8iLCJhIjoiY20zaDI2aXp5MGI1YTJscHQyMHF3cWVmNSJ9.h0rrQrjgno24QZjnIZx3Tw";

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-128 overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl"
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
}

function MapWithTileset() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [overlapArea, setOverlapArea] = useState(null);

  const mapRef = useRef(null); // MapGL 인스턴스를 참조

  useEffect(() => {
    if (modalInfo && modalInfo.latitude && modalInfo.longitude) {
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${modalInfo.longitude},${modalInfo.latitude}.json?access_token=${MAPBOX_TOKEN}&language=ko`
      )
        .then((response) => response.json())
        .then((data) => {
          const region = data.features.find((feature) => feature.place_type.includes("region"));
          const district = data.features.find((feature) => feature.place_type.includes("district")) || data.features.find((feature) => feature.place_type.includes("locality"));
          const suburb = data.features.find((feature) => feature.place_type.includes("neighborhood"));
          const place = data.features.find((feature) => feature.place_type.includes("place"));

          const isSpecialCity = region && ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시"].includes(region.text);

          const fullAddress = isSpecialCity
            ? `${region.text} ${district ? district.text : ""} ${suburb ? suburb.text : ""}`.trim() // 광역시/특별시일 경우 district와 suburb를 포함
            : `${region ? region.text : ""} ${place ? place.text : ""} ${suburb ? suburb.text : ""}`.trim(); // 일반 도/시일 경우 region, place, suburb 조합

          setLocationInfo({
            fullAddress: fullAddress,
          });
        })
        .catch((error) => console.error("Geocoding error:", error));
    }
  }, [modalInfo]);

  const handleMapLoad = useCallback((event) => {
    setMapLoaded(event.target.isStyleLoaded()); // 스타일 로드 완료 여부 확인
  }, []);

  const handleClick = useCallback(
    (event) => {
      if (!mapLoaded) return; // 맵이 로드되기 전 클릭 핸들링 방지

      const [feature] = event.features;
      if (feature) {
        const { properties } = feature;
        setModalInfo({
          ...properties,
          latitude: properties.latitude,
          longitude: properties.longitude,
        });

        // 산과 탄소 배출 영역 겹치는 부분 계산
        const mountainPolygon = turf.polygon([/* 산의 경계 좌표 배열 */]);
        const carbonPolygon = turf.polygon([/* 탄소 배출 구역 경계 좌표 배열 */]);
        const intersectedArea = turf.intersect(mountainPolygon, carbonPolygon);

        if (intersectedArea) {
          setOverlapArea(intersectedArea);
        } else {
          setOverlapArea(null);
        }
      }
    },
    [mapLoaded]
  );

  useEffect(() => {
    // MapGL 인스턴스가 로드되고 나면 resize 호출
    if (mapRef.current && mapLoaded) {
      mapRef.current.resize();
    }
  }, [mapLoaded]);

  return (
    <>
      <MapGL
        initialViewState={{
          latitude: 36.5,
          longitude: 127.5,
          zoom: 7,
        }}
        style={{ width: "100%", height: "82vh" }}
        mapStyle="mapbox://styles/dudadido/cm3h2etw0006801r7hjpc83w0"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={["grid-layer", "mountain-layer"]}
        onLoad={handleMapLoad}
        onClick={handleClick}
        className="w-full h-full"
        ref={mapRef} // ref 추가
      >
        {mapLoaded && (
          <>
            {/* 탄소 배출 레이어 */}
            <Source id="grid-data" type="vector" url="mapbox://dudadido.0avn7c0j">
              <Layer
                id="grid-layer"
                type="fill"
                source-layer="realrealfinal-3gve1p"
                paint={{
                  "fill-color": "#888",
                  "fill-opacity": 0,
                }}
              />
            </Source>

            {/* 산 레이어 */}
            <Source id="mountain-data" type="vector" url="mapbox://styles/dudadido/cm3h2etw0006801r7hjpc83w0">
              <Layer
                id="mountain-layer"
                type="fill"
                source-layer="hillshade"
                paint={{
                  "fill-color": "#228B22",
                  "fill-opacity": 0.4,
                }}
              />
            </Source>

            {/* 겹치는 영역을 Mapbox에 추가 */}
            {overlapArea && (
              <Source id="overlap-area" type="geojson" data={overlapArea}>
                <Layer
                  id="overlap-layer"
                  type="fill"
                  paint={{
                    "fill-color": "#FF0000",
                    "fill-opacity": 0.5,
                  }}
                />
              </Source>
            )}
          </>
        )}
      </MapGL>

      <Modal isOpen={!!modalInfo} onClose={() => { setModalInfo(null); setLocationInfo(null); }}>
  {modalInfo && (
    <div>
      {locationInfo && (
        <h2 className="text-gray-700 text-2xl font-bold">{locationInfo.fullAddress}</h2>
      )}
       {/* 상태별 조건부 렌더링 */}
       {modalInfo.total > 300000 && (
        <div>
          <p className="text-xl font-bold">비상 상태입니다. 즉각적인 조치가 필요합니다!</p>
          {/* 산림 면적 계산 */}
          <p>산림 면적 필요: {(modalInfo.total / 1.5 - 200000 / 1.5).toFixed(2)} m²</p> {/* 300,000 -> 200,000으로 줄이기 위한 면적 */}
          <p>설명: 성숙한 나무들로 구성된 산림 지역입니다.</p>
        </div>
      )}

      {modalInfo.total > 200000 && modalInfo.total <= 300000 && (
        <div>
          <p className="text-xl font-bold">매우 위험한 상태입니다. 빠른 조치가 필요합니다.</p>
          {/* 산림 면적 계산 */}
          <p>산림 면적 필요: {(modalInfo.total / 1.5 - 100000 / 1.5).toFixed(2)} m²</p> {/* 200,000 -> 100,000으로 줄이기 위한 면적 */}
          <p>설명: 성숙한 나무들로 구성된 산림 지역입니다.</p>
        </div>
      )}

      {modalInfo.total > 100000 && modalInfo.total <= 200000 && (
        <div>
          <p className="text-xl font-bold">위험한 상태입니다. 추가적인 관리가 필요합니다.</p>
          {/* 산림 면적 계산 */}
          <p>산림 면적 필요: {(modalInfo.total / 1.5 - 10000 / 1.5).toFixed(2)} m²</p> {/* 200,000 -> 10,000으로 줄이기 위한 면적 */}
          <p>설명: 성숙한 나무들로 구성된 산림 지역입니다.</p>
        </div>
      )}

      {modalInfo.total <= 10000 && (
        <div>
          <p className="text-xl font-bold">쾌적한 상태입니다. 추가적인 조치가 필요하지 않습니다.</p>
          {/* 산림 면적 계산 */}
          <p>산림 면적 필요: {(modalInfo.total / 1.5).toFixed(2)} m²</p> {/* 기본적인 계산 */}
          <p>설명: 성숙한 나무들로 구성된 산림 지역입니다.</p>
        </div>
      )}
      <p className="text-gray-700">탄소 배출량: {Math.round(modalInfo.emissions)}</p>
      <p className="text-gray-700">탄소 흡수량: {Math.round(modalInfo.absorption)}</p>
      <p className="text-gray-700">총 탄소량: {Math.round(modalInfo.total)}</p>
      <p className="text-gray-700">녹지화 가능 면적: {modalInfo.area}</p>

     

      {/* 기존 조건부 렌더링 */}
      {modalInfo.area > 0 && modalInfo.total >= 200000 && (
        <p>녹지화가 시급합니다. 건물이 많을 것으로 예상되니 건물 녹지화를 추천드립니다.</p>
      )}

      {modalInfo.absorption === 0 && modalInfo.area > 0 && (
        <p>탄소 흡수량이 0입니다. 녹지화를 통해 탄소 흡수를 늘리시길 추천드립니다.</p>
      )}

      {modalInfo.absorption < 150 && modalInfo.area > 100 && (
        <p>탄소 흡수량은 낮지만 면적이 넓습니다. 탄소 흡수량 증가를 위한 조치가 필요합니다.</p>
      )}

      {modalInfo.total <= 0 && (
        <p>탄소 관리가 잘 되고 있는 지역입니다!</p>
      )}
    </div>
  )}
</Modal>
    </>
  );
}

export default MapWithTileset;
