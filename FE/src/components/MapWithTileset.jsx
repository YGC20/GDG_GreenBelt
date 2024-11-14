const MAPBOX_TOKEN = "pk.eyJ1IjoiZHVkYWRpZG8iLCJhIjoiY20zaDI2aXp5MGI1YTJscHQyMHF3cWVmNSJ9.h0rrQrjgno24QZjnIZx3Tw";
import React, { useState, useCallback, useEffect } from "react";
import MapGL, { Source, Layer } from "react-map-gl";


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
  const [modalInfo, setModalInfo] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);

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

  const handleClick = useCallback((event) => {
    const [feature] = event.features;
    if (feature) {
      const { properties } = feature;
      setModalInfo({
        ...properties,
        latitude: properties.latitude,
        longitude: properties.longitude,
      });
    }
  }, []);

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
        interactiveLayerIds={["grid-layer"]}
        onClick={handleClick}
        className="w-full h-screen"
      >
        <Source
          id="grid-data"
          type="vector"
          url="mapbox://dudadido.2myu2e5y"
        >
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
            {console.log(modalInfo)}
            {locationInfo && (
              <p className="text-gray-700">위치: {locationInfo.fullAddress}</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default MapWithTileset;
