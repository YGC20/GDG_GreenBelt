const MAPBOX_TOKEN = "pk.eyJ1IjoiZHVkYWRpZG8iLCJhIjoiY20zaDI2aXp5MGI1YTJscHQyMHF3cWVmNSJ9.h0rrQrjgno24QZjnIZx3Tw";
import React, { useState, useCallback, useEffect } from "react";
import MapGL, { Source, Layer } from "react-map-gl";
import * as turf from "@turf/turf";

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto relative">
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
  const [mapLoaded, setMapLoaded] = useState(false); // 맵 로드 상태 추가
  const [modalInfo, setModalInfo] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [overlapArea, setOverlapArea] = useState(null);

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

  const getEmissionGrade = (emissions) => {
    if (emissions <= 10000) {
      return "1단계: 매우 안전";
    } else if (emissions <= 75000) {
      return "2단계: 안전";
    } else if (emissions <= 150000) {
      return "3단계: 주의";
    } else if (emissions <= 230000) {
      return "4단계: 위험";
    } else {
      return "5단계: 매우 위험";
    }
  };

  const getRequiredGreenArea = (emissions) => {
    let reductionNeeded;
    if (emissions <= 10000) {
      return null;
    } else if (emissions <= 75000) {
      reductionNeeded = emissions - 10000;
    } else if (emissions <= 150000) {
      reductionNeeded = emissions - 75000;
    } else if (emissions <= 230000) {
      reductionNeeded = emissions - 150000;
    } else {
      reductionNeeded = emissions - 230000;
    }

    const greenTypes = [
      { type: "산림 (성숙한 나무)", absorption: 12.5 },
      { type: "도시 숲", absorption: 4 },
      { type: "가로수", absorption: 0.35 },
      { type: "초지 (잔디밭)", absorption: 0.75 },
      { type: "하천변 녹지", absorption: 2.5 },
      { type: "옥상 녹화", absorption: 0.2 },
      { type: "식물 벽", absorption: 0.075 },
      { type: "소규모 공원", absorption: 2 },
    ];

    let requiredAreas = greenTypes.map((green) => {
      return {
        type: green.type,
        area: (reductionNeeded / green.absorption).toFixed(2),
      };
    });

    return requiredAreas;
  };

  return (
    <>
      <MapGL
        initialViewState={{
          latitude: 36.5,
          longitude: 127.5,
          zoom: 7,
        }}
        style={{ width: "100%", height: "100vh" }}
        mapStyle="mapbox://styles/dudadido/cm3h2etw0006801r7hjpc83w0"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={["grid-layer", "mountain-layer"]}
        onLoad={handleMapLoad}
        onClick={handleClick}
        className="w-full h-screen"
      >
        {mapLoaded && (
          <>
            {/* 탄소 배출 레이어 */}
            <Source id="grid-data" type="vector" url="mapbox://dudadido.2myu2e5y">
              <Layer
                id="grid-layer"
                type="fill"
                source-layer="ver4-6q70fi"
                paint={{
                  "fill-color": "#888",
                  "fill-opacity": 0.4,
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
            <h4 className="text-lg font-bold mb-2">격자 코드: {modalInfo.grid_cd}</h4>
            <p className="text-gray-700">탄소 배출량: {modalInfo.emissions}</p>
            <p className="text-gray-700">탄소 흡수량: {modalInfo.absorption}</p>
            <p className="text-gray-700">총 탄소량: {modalInfo.total}</p>
            <p className="text-gray-700">위도: {modalInfo.latitude}</p>
            <p className="text-gray-700">경도: {modalInfo.longitude}</p>
            <p className="text-gray-700">탄소 배출 등급: {getEmissionGrade(modalInfo.emissions)}</p>
            {locationInfo && (
              <p className="text-gray-700">위치: {locationInfo.fullAddress}</p>
            )}
            {getEmissionGrade(modalInfo.emissions) !== "1단계: 매우 안전" && (
              <div className="mt-4">
                <h5 className="text-md font-bold mb-2">필요한 녹지 구성 및 면적:</h5>
                <ul className="list-disc list-inside">
                  {getRequiredGreenArea(modalInfo.emissions).map((green, index) => (
                    <li key={index} className="text-gray-700">
                      {green.type}: {green.area} m²
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default MapWithTileset;
