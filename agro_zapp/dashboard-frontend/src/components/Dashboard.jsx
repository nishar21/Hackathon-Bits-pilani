import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./Dashboard.css";
import user_icon from "../assets/profile.svg";
import silt from "../assets/silt-soil-vector.png";
import ph_scale from "../assets/ph-scale.png";
import moisture from "../assets/moisture.png";
import temperature from "../assets/temperature.png";
import gis_data from "../geo_data.json";
import GenerateReport from "./GenerateReport"; // Import the PDF generation component

const getNPKStatus = (value, type) => {
  if (type === "Nitrogen") {
    if (value >= 40) return "Good 🟢";
    if (value >= 20) return "Average 🟠";
    return "Bad 🔴";
  } else if (type === "Phosphorous") {
    if (value >= 25) return "Good 🟢";
    if (value >= 15) return "Average 🟠";
    return "Bad 🔴";
  } else if (type === "Potassium") {
    if (value >= 20) return "Good 🟢";
    if (value >= 10) return "Average 🟠";
    return "Bad 🔴";
  }
  return "Unknown";
};

const Predictor = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [weatherPrediction, setWeatherPrediction] = useState("");
  const [fertilizerSuggestion, setFertilizerSuggestion] = useState("");

  // WeatherAPI key and endpoint
  const API_KEY = "92abd0d592ed4d91a7212745252303"; // Replace with your WeatherAPI key
  const API_URL = "https://api.weatherapi.com/v1/forecast.json";

  // Function to handle date selection and fetch weather data
  const handleDateSubmit = async () => {
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }

    try {
      // Fetch weather data for the selected date
      const response = await axios.get(API_URL, {
        params: {
          key: API_KEY,
          q: "Hyderabad", // Replace with a valid city name
          dt: selectedDate, // Use the selected date
        },
      });

      // Extract weather data
      const weatherData = response.data.forecast.forecastday[0].day;
      const weatherDescription = weatherData.condition.text;
      const rain = weatherData.daily_will_it_rain === 1; // 1 = Rain, 0 = No rain

      // Update weather prediction
      setWeatherPrediction(`Weather on ${selectedDate}: ${weatherDescription}`);

      // Update fertilizer suggestion
      if (rain) {
        setFertilizerSuggestion(
          "Rain detected. Avoid using fertilizers and pesticides today."
        );
      } else {
        setFertilizerSuggestion(
          "No rain detected. You can use fertilizers and pesticides."
        );
      }
    } catch (error) {
      console.error(
        "Error fetching weather data:",
        error.response?.data || error.message
      );
      setWeatherPrediction("Failed to fetch weather data. Please try again.");
      setFertilizerSuggestion("");
    }
  };

  return (
    <div className="o-card div7 prediction-container">
      <h3>Predictor:</h3>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <button onClick={handleDateSubmit}>Enter</button>
      <textarea
        className="weather-prediction"
        readOnly
        value={weatherPrediction}
        placeholder="Weather prediction will appear here..."
      ></textarea>
      <textarea
        className="weather-suggestion"
        readOnly
        value={fertilizerSuggestion}
        placeholder="Fertilizer suggestion will appear here..."
      ></textarea>
    </div>
  );
};

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [diseaseImagePreview, setDiseaseImagePreview] = useState(null);
  const [prediction, setPrediction] = useState("No result yet.");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // States for insect classification
  const [insectFile, setInsectFile] = useState(null);
  const [insectImagePreview, setInsectImagePreview] = useState(null);
  const [insectPrediction, setInsectPrediction] = useState("No result yet.");
  const [insectUploadStatus, setInsectUploadStatus] = useState("");
  const [insectUploadProgress, setInsectUploadProgress] = useState(0);

  const [data, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pid, setPid] = useState("");
  const [plotIndex, setPlotIndex] = useState(-1);

  // Default plot data when pid is ""
  const defaultPlot = {
    plot_id: "",
    gis_data: { type: "Point", coordinates: [0, 0] },
    soil_type: "---",
    weather: "---",
    npk_levels: { N: "---", P: "---", K: "---" },
    moisture: "---",
    temperature: "---",
    ph_value: "---",
    vegetation: { NDVI: "---", NDMI: "---" },
    ideal_crops: ["---"],
  };

  const plot = pid
    ? gis_data.find((plot) => plot.plot_id === pid)
    : defaultPlot;

  // Function to handle the "START" button click
  const handleStartClick = () => {
    const plotIds = gis_data
      .map((plot) => plot.plot_id)
      .filter((id) => id !== "");
    const nextIndex = (plotIndex + 1) % plotIds.length;
    setPid(plotIds[nextIndex]);
    setPlotIndex(nextIndex);
  };

  // Handle file upload for disease prediction
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus("Ready to upload");
      setUploadProgress(0);

      // Read the file and set it as a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiseaseImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle disease prediction
  const handlePredict = async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      setUploadStatus("Uploading...");
      const response = await axios.post(
        "http://localhost:8000/api/plant/predict/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            setUploadStatus(`Uploading: ${percentCompleted}%`);
          },
        }
      );

      setPrediction(response.data.prediction);
      setUploadStatus("Uploaded successfully!");
    } catch (error) {
      console.error("Error predicting disease:", error);
      setPrediction("Error predicting disease.");
      setUploadStatus("Upload failed. Please try again.");
    }
  };

  // Handle file upload for insect classification
  const handleInsectFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setInsectFile(file);
      setInsectUploadStatus("Ready to upload");
      setInsectUploadProgress(0);

      // Read the file and set it as a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setInsectImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle insect classification
  const handleInsectPredict = async () => {
    if (!insectFile) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", insectFile);

    try {
      setInsectUploadStatus("Uploading...");
      const response = await axios.post(
        "http://localhost:8000/api/insect/predict/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setInsectUploadProgress(percentCompleted);
            setInsectUploadStatus(`Uploading: ${percentCompleted}%`);
          },
        }
      );

      setInsectPrediction(response.data.class);
      setInsectUploadStatus("Uploaded successfully!");
    } catch (error) {
      console.error("Error classifying insect:", error);
      setInsectPrediction("Error classifying insect.");
      setInsectUploadStatus("Upload failed. Please try again.");
    }
  };

  // Update graph data when pid changes
  useEffect(() => {
    if (plot) {
      const graphFriendlyData = [
        {
          name: plot.plot_id,
          Potassium: plot.npk_levels.K,
          Phosphorous: plot.npk_levels.P,
          Nitrogen: plot.npk_levels.N,
        },
      ];
      setGraphData(graphFriendlyData);
    }
    setLoading(false);
  }, [pid]);

  return (
    <>
      <div className="user-profile">
        <p>Admin</p>
        <img src={user_icon} alt="User icon" />
      </div>

      <div className="gis">
        <button id="gis-btn">
          <i className="fa-solid fa-location-dot"></i>
        </button>
        <input type="text" placeholder="GIS Goes here ..." />
        <button id="gis-start-btn" onClick={handleStartClick}>
          START
        </button>
      </div>

      {/* Wrap the dashboard content in a div with ID for PDF generation */}
      <div id="dashboard-content">
        <div className="gis-data gis">
          {/* Placeholder for the map */}
          {!pid ? (
            <div
              className="map-placeholder"
              style={{
                width: "600px",
                height: "400px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px dashed #ccc",
                backgroundColor: "#f9f9f9",
              }}
            >
              <p style={{ color: "#666", fontStyle: "italic" }}>
                Map will load here
              </p>
            </div>
          ) : (
            <iframe
              width="600"
              height="400"
              src="https://www.arcgis.com/apps/Embed/index.html?webmap=c8ea84aa917b46c996e79cb1f5680055"
              frameBorder="0"
              scrolling="no"
              title="GIS Map"
            ></iframe>
          )}
          <div className="gis-details">
            <h3>GIS & Location Details</h3>
            <p>
              <strong>Plot ID:</strong> {plot.plot_id} <br />
              <strong>Location:</strong> BITS Pilani <br />
              <strong>Latitude:</strong> {plot.gis_data.coordinates[1]} <br />
              <strong>Longitude:</strong> {plot.gis_data.coordinates[0]} <br />
              <strong>NDVI:</strong> {plot.vegetation.NDVI} <br />
              <strong>NDMI:</strong> {plot.vegetation.NDMI} <br />
              <strong>Remarks:</strong>{" "}
              {plot.remarks ? plot.remarks : "No additional remarks"} <br />
            </p>
          </div>
        </div>

        <div className="dashboard">
          <div className="f-card div1 soil-type">
            <p>SOIL TYPE</p>
            <img src={silt} alt="Soil Type" />
            <p className="card-value">{plot.soil_type}</p>
          </div>
          <div className="f-card div2 ph-scale">
            <p>PH VALUE</p>
            <img src={ph_scale} alt="PH Scale" />
            <p className="card-value">{plot.ph_value}</p>
          </div>
          <div className="f-card div3 moisture">
            <p>MOISTURE</p>
            <img src={moisture} alt="Moisture" />
            <p className="card-value">{plot.moisture}</p>
          </div>
          <div className="f-card div4 temperature">
            <p>TEMPERATURE</p>
            <img src={temperature} alt="Temperature" />
            <p className="card-value">{plot.temperature}</p>
          </div>
          <div className="t-card div5 npk-chart">
            <label className="npk">NPK Values of Soil</label>
            {loading ? (
              <p>Loading chart data...</p>
            ) : data.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Phosphorous" fill="#8884d8" />
                  <Bar dataKey="Potassium" fill="#82ca9d" />
                  <Bar dataKey="Nitrogen" fill="#FF0000" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No data available for the chart.</p>
            )}
          </div>
          <div className="t-card div6">
            <h3>Details - NPK Values</h3>
            <div className="npk-details">
              <div className="npk-item">
                <h4>Nitrogen (N)</h4>
                <p>Value: {plot.npk_levels.N}</p>
                <p>Status: {getNPKStatus(plot.npk_levels.N, "Nitrogen")}</p>
                <p>
                  {getNPKStatus(plot.npk_levels.N, "Nitrogen") === "Good"
                    ? "Nitrogen levels are optimal for plant growth."
                    : getNPKStatus(plot.npk_levels.N, "Nitrogen") === "Average"
                    ? "Nitrogen levels are moderate. Consider adding organic compost."
                    : "Nitrogen levels are low. Add nitrogen-rich fertilizers."}
                </p>
              </div>
              <div className="npk-item">
                <h4>Phosphorous (P)</h4>
                <p>Value: {plot.npk_levels.P}</p>
                <p>Status: {getNPKStatus(plot.npk_levels.P, "Phosphorous")}</p>
                <p>
                  {getNPKStatus(plot.npk_levels.P, "Phosphorous") === "Good"
                    ? "Phosphorous levels are optimal for root development."
                    : getNPKStatus(plot.npk_levels.P, "Phosphorous") ===
                      "Average"
                    ? "Phosphorous levels are moderate. Consider adding bone meal."
                    : "Phosphorous levels are low. Add phosphorous-rich fertilizers."}
                </p>
              </div>
              <div className="npk-item">
                <h4>Potassium (K)</h4>
                <p>Value: {plot.npk_levels.K}</p>
                <p>Status: {getNPKStatus(plot.npk_levels.K, "Potassium")}</p>
                <p>
                  {getNPKStatus(plot.npk_levels.K, "Potassium") === "Good"
                    ? "Potassium levels are optimal for overall plant health."
                    : getNPKStatus(plot.npk_levels.K, "Potassium") === "Average"
                    ? "Potassium levels are moderate. Consider adding wood ash."
                    : "Potassium levels are low. Add potassium-rich fertilizers."}
                </p>
              </div>
            </div>
          </div>
          <div className="t-card div10 disease-prediction">
            <h3>Disease Prediction</h3>
            <div className="input-container">
              <input
                type="file"
                accept="image/*"
                id="disease-image"
                onChange={handleFileChange}
              />
              <label htmlFor="disease-image" className="upload-label">
                <i className="fa-solid fa-upload"></i> Upload Image
              </label>
            </div>
            {/* Display the uploaded image */}
            {diseaseImagePreview && (
              <div className="image-preview">
                <img src={diseaseImagePreview} alt="Disease Preview" />
              </div>
            )}
            <button className="predict-button" onClick={handlePredict}>
              Predict
            </button>
            <div className="result-area">
              <h4>Result:</h4>
              <p>{prediction}</p>
            </div>
            {/* Display real-time upload status and progress */}
            {uploadStatus && (
              <div className="upload-status">
                <p>{uploadStatus}</p>
                {uploadProgress > 0 && (
                  <div className="progress-bar">
                    <div
                      className="progress"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Insect Classification */}
          <div className="t-card div11 insect-classification">
            <h3>Entomology Classification</h3>
            <div className="input-container">
              <input
                type="file"
                accept="image/*"
                id="insect-image"
                onChange={handleInsectFileChange}
              />
              <label htmlFor="insect-image" className="upload-label">
                <i className="fa-solid fa-upload"></i> Upload Image
              </label>
            </div>
            {/* Display the uploaded image */}
            {insectImagePreview && (
              <div className="image-preview">
                <img src={insectImagePreview} alt="Insect Preview" />
              </div>
            )}
            <button className="predict-button" onClick={handleInsectPredict}>
              Classify
            </button>
            <div className="result-area">
              <h4>Result:</h4>
              <p>{insectPrediction}</p>
            </div>
            {/* Display real-time upload status and progress */}
            {insectUploadStatus && (
              <div className="upload-status">
                <p>{insectUploadStatus}</p>
                {insectUploadProgress > 0 && (
                  <div className="progress-bar">
                    <div
                      className="progress"
                      style={{ width: `${insectUploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Predicted Results */}
          <div className="t-card div12">
            <h3>Predicted Results</h3>
            <div className="predicted-results">
              <div className="result-item">
                <h4>Plant Disease:</h4>
                <p>
                  <strong>Apple Cedar Apple Rust</strong>
                </p>
                <p>
                  Apple Cedar Apple Rust is a fungal disease caused by{" "}
                  <em>Gymnosporangium juniperi-virginianae</em>. It primarily
                  affects apple trees and is characterized by yellow-orange
                  spots on leaves, which later develop into raised, rust-colored
                  lesions. The disease can weaken the tree over time, reducing
                  fruit yield and quality. It requires both apple trees and
                  cedar trees to complete its life cycle.
                </p>
              </div>
              <div className="result-item">
                <h4>Insect in Plant:</h4>
                <p>
                  <strong>Rice Leaf Roller</strong>
                </p>
                <p>
                  The Rice Leaf Roller (<em>Cnaphalocrocis medinalis</em>) is a
                  common pest in rice fields. The larvae roll and feed on rice
                  leaves, causing significant damage to the foliage. Severe
                  infestations can lead to reduced photosynthesis, stunted
                  growth, and lower grain yields. The pest is most active during
                  warm and humid conditions, making it a major concern in
                  tropical and subtropical regions.
                </p>
              </div>
            </div>
          </div>

          {/* Suggestions & Feedbacks */}
          <div className="t-card div13">
            <h3>Suggestions & Feedbacks</h3>
            <div className="suggestions">
              <h4>For Apple Cedar Apple Rust:</h4>
              <ul>
                <li>
                  Apply fungicides like myclobutanil or sulfur-based sprays
                  during early stages.
                </li>
                <li>
                  Prune and destroy infected leaves to prevent disease spread.
                </li>
                <li>
                  Ensure proper spacing between plants for better air
                  circulation.
                </li>
                <li>Consider planting disease-resistant apple varieties.</li>
              </ul>

              <h4>For Rice Leaf Roller:</h4>
              <ul>
                <li>Introduce natural predators like Trichogramma wasps.</li>
                <li>
                  Use insecticides like chlorantraniliprole for severe
                  infestations.
                </li>
                <li>Practice crop rotation with non-host crops.</li>
                <li>Remove and destroy crop residues after harvest.</li>
              </ul>

              <h4>General Feedback:</h4>
              <p>
                Regular monitoring and early intervention are key to managing
                diseases and pests effectively. Maintain good agricultural
                practices to ensure healthy crops and higher yields.
              </p>
            </div>
          </div>

          {/* Predictor */}
          <Predictor />
        </div>
      </div>

      {/* Generate Report */}
      <GenerateReport />

      {/* Footer */}
      <div className="footer">
        <p>Agro zapp @ 2025</p>
      </div>
    </>
  );
}
