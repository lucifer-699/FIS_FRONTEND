// src/api/api.ts
import axios from "axios";
import { storage } from "../storage";

const API_BASE_URL = "https://fis.yetiairlines.com:8446";

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/login`, { username, password });

    storage.set("token", response.data.token, 60); // Store token for 60 minutes
    storage.set("username", username, 60);
    storage.set("password", password, 60);
    storage.set("airport", response.data.airport); // Store airport permanently (no TTL)

    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const fetchUserData = async (username: string, password: string) => {
  try {
    const token = storage.get("token");
    if (!token) throw new Error("Authorization token is missing");

    const response = await axios.get(`${API_BASE_URL}/user/userdata`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { username, password },
    });

    if (!response.data?.userid) throw new Error("User ID not found in response");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const getFlightSchedule = async (origin: string) => {
  try {
    const token = storage.get("token");
    if (!token) throw new Error("Authorization token is missing. Please login.");

    const username = storage.get("username");
    const password = storage.get("password");

    if (!username || !password) {
      throw new Error("Authentication credentials not found");
    }

    const response = await axios.get(`${API_BASE_URL}/fis/getschedule`, {
      params: { username, password, origin },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching flight schedule:", error);
    throw error;
  }
};
export const getEditData = async (flightNumber: string) => {
  try {
    const token = storage.get("token");
    if (!token) throw new Error("Authorization token is missing. Please login.");

    const username = storage.get("username");
    const password = storage.get("password");

    if (!username || !password) {
      throw new Error("Authentication credentials not found");
    }

    const response = await axios.get(`${API_BASE_URL}/fis/editdata`, {
      params: { flightNumber },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching edit data:", error);
    throw error;
  }
};



export const updateFlightStatus = async (
  flightNumber: string,
  revisedTime: string ,
  status: string,
  remarks: string,
  hide: number,
  FlightStatus_Time: string 
) => {
  try {
    const token = storage.get("token");
    if (!token) throw new Error("Authorization token is missing. Please login.");

    const username = storage.get("username");
    const password = storage.get("password");

    if (!username || !password) throw new Error("Authentication credentials not found");

    const userData = await fetchUserData(username, password);
    if (!userData?.userid) throw new Error("Unable to retrieve user information");

    const response = await axios.put(`${API_BASE_URL}/fis/updateStatus`, null, {
      params: {
        flightNumber,
        Revised_Time: revisedTime,
        FlightStatus: status,
        FlightStatus_Remarks: remarks,
        username,
        password,
        userid: userData.userid,
        hide,
        FlightStatus_Time
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error("Error updating flight status:", error);
    throw error;
  }
};

export const getFlightPreview = async () => {
  try {
    const token = storage.get("token");
    if (!token) throw new Error("Authorization token is missing");

    const username = storage.get("username");
    const password = storage.get("password");

    if (!username || !password) throw new Error("Authentication credentials not found");

    const response = await axios.get(`${API_BASE_URL}/fis/preview`, {
      params: { username, password },
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching flight preview:", error);
    throw error;
  }
};

export const getAllStatuses = async () => {
  try {
    const token = storage.get("token");
    if (!token) throw new Error("Authorization token is missing");

    const response = await axios.get(`${API_BASE_URL}/fis/getstatus`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching statuses:", error);
    throw error;
  }
};

export const getAllRemarks = async () => {
  try {
    const token = storage.get("token");
    if (!token) throw new Error("Authorization token is missing");

    const response = await axios.get(`${API_BASE_URL}/fis/getremarks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching remarks:", error);
    throw error;
  }
};
