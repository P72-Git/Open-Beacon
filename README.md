# Open Beacon 🌍

**Open Beacon** is a frictionless location-based application designed with a strong focus on **GeoDev, Spatial Data, and Geographic Workflows**. 

## 🗺️ Project Goal & Vision

While the current operational state provides real-time local search (finding open places and events near you using AI grounding, Leaflet, and geocoding), the **overarching vision and architectural goal** of this project is to become a robust spatial data platform powered by advanced geospatial analysis. 

The trajectory of this project is explicitly geared toward:
- **GeoDev & Spatial Data**: Expanding high-accuracy, location-based features and real-world mapping tools.
- **Spatial Databases**: Transitioning backend data models to leverage **PostGIS** and true spatial geometries (Points, Polygons) for deep spatial querying.
- **Geographic Workflows**: Implementing advanced mapping layers, complex routing algorithms, and thorough geographic analysis.

## 🚀 Current Architecture
- **Frontend**: React 18, Vite, Tailwind CSS
- **Mapping & Geo**: React Leaflet, OpenStreetMap/Nominatim integration
- **AI & Spatial Search**: Google Gemini API (utilizing Google Maps & Search tool grounding for real-time local data extraction)
- **Backend Base**: Firebase (Auth & Firestore) - *Planned evolution towards PostGIS/Spatial workflows*

## 📌 Development Philosophy
- **Frictionless UX:** Deliver the exact data the user wants instantly. The complexity of routing and bounding-box queries should be hidden from the user.
- **Accuracy Matters:** Sources, APIs, and coordinate accuracy are critical. Geospatial data must be verifiable and reliable.

---
*Note: This repository contains specific custom instructions in `AGENTS.md` for AI agents (like Antigravity) to maintain focus on the GeoDev and PostGIS trajectory during future development iterations.*
