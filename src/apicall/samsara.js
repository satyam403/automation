import axios from "axios";

const SAMSARA_BASE = "https://api.samsara.com";

export async function getSamsaraLocation(vehicleId) {
  const res = await axios.get(
    `${SAMSARA_BASE}/fleet/vehicles/locations`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SAMSARA_API_KEY}`
      },
      params: {
        vehicleIds: vehicleId
      }
    }
  );

  const vehicle = res.data.data?.[0];

  if (!vehicle) {
    throw new Error("Samsara location not found");
  }

  return {
    lat: vehicle.latitude,
    lng: vehicle.longitude,
    speed: vehicle.speed || 0,
    time: vehicle.time
  };
}
