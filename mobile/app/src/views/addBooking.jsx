import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

import baseUrl from "../../constant/baseUrl";
import styles from "../styles/addBookingStyles";

export default function AddBooking({ route, navigation }) {
  const vehicleIdFromRoute = route?.params?.vehicleId || null;
  const workshopIdFromRoute = route?.params?.workshopId || null;

  const [vehicles, setVehicles] = useState([]);
  const [workshops, setWorkshops] = useState([]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  const [bookingDate, setBookingDate] = useState(null);
  const [bookingTimeSlot, setBookingTimeSlot] = useState(null);
  const [notes, setNotes] = useState("");

  const [showVehicleList, setShowVehicleList] = useState(false);
  const [showWorkshopList, setShowWorkshopList] = useState(false);
  const [showTimeList, setShowTimeList] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => {
    return await SecureStore.getItemAsync("access_token");
  };

  // GET VEHICLES
  // =========================

  const fetchVehicles = async (token) => {
    try {
      const response = await axios.get(`${baseUrl}/api/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data;

      const data = Array.isArray(result)
        ? result
        : result.vehicles || result.data || [];

      setVehicles(data);

      // Jika datang dari Home
      if (vehicleIdFromRoute) {
        const vehicle = data.find(
          (item) => String(item._id) === String(vehicleIdFromRoute),
        );

        if (vehicle) {
          setSelectedVehicle(vehicle);
        }
      }
    } catch (error) {
      console.log("GET VEHICLES ERROR:", error.response?.data || error.message);
    }
  };

  // GET WORKSHOPS
  // =========================

  const fetchWorkshops = async (token) => {
    try {
      const response = await axios.get(`${baseUrl}/api/workshop`, {
        params: {
          page: 1,
          limit: 100,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data;

      const data = Array.isArray(result)
        ? result
        : result.data || result.workshops || [];

      setWorkshops(data);

      // Jika datang dari Workshop
      if (workshopIdFromRoute) {
        const workshop = data.find(
          (item) => String(item._id) === String(workshopIdFromRoute),
        );

        if (workshop) {
          setSelectedWorkshop(workshop);
        }
      }
    } catch (error) {
      console.log(
        "GET WORKSHOPS ERROR:",
        error.response?.data || error.message,
      );
    }
  };

  // LOAD DATA
  // =========================

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();

        if (!token) {
          Alert.alert("Error", "Access token not found");
          return;
        }

        await Promise.all([fetchVehicles(token), fetchWorkshops(token)]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // DATE
  // =========================

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (!selectedDate) {
      return;
    }

    setBookingDate(selectedDate);

    // Reset time ketika tanggal berubah
    setBookingTimeSlot(null);
  };

  const formatDate = (date) => {
    if (!date) {
      return "Select date";
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateForAPI = (date) => {
    if (!date) {
      return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // TIME SLOT
  // =========================

  const getDayName = (date) => {
    if (!date) {
      return null;
    }

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return days[date.getDay()];
  };

  const generateTimeSlots = () => {
    if (!selectedWorkshop || !bookingDate) {
      return [];
    }

    const dayName = getDayName(bookingDate);

    const operationalHours = selectedWorkshop.operational_hours || [];

    const todaySchedule = operationalHours.find(
      (item) => item.day?.toLowerCase() === dayName?.toLowerCase(),
    );

    if (!todaySchedule || !todaySchedule.open || !todaySchedule.close) {
      return [];
    }

    const [openHour, openMinute] = todaySchedule.open.split(":").map(Number);

    const [closeHour, closeMinute] = todaySchedule.close.split(":").map(Number);

    let startMinutes = openHour * 60 + openMinute;

    const endMinutes = closeHour * 60 + closeMinute;

    const slots = [];

    while (startMinutes < endMinutes) {
      const hour = Math.floor(startMinutes / 60);

      const minute = startMinutes % 60;

      const formattedHour = String(hour).padStart(2, "0");

      const formattedMinute = String(minute).padStart(2, "0");

      slots.push(`${formattedHour}:${formattedMinute}`);

      startMinutes += 30;
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // SUBMIT BOOKING
  // =========================

  const handleSubmit = async () => {
    if (!selectedVehicle) {
      Alert.alert("Validation", "Please select a vehicle.");
      return;
    }

    if (!selectedWorkshop) {
      Alert.alert("Validation", "Please select a workshop.");
      return;
    }

    if (!bookingDate) {
      Alert.alert("Validation", "Please select booking date.");
      return;
    }

    if (!bookingTimeSlot) {
      Alert.alert("Validation", "Please select time slot.");
      return;
    }

    try {
      setSubmitting(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Error", "Access token not found.");
        return;
      }

      const payload = {
        vehicle_id: selectedVehicle._id,

        bengkel_id: selectedWorkshop._id,

        booking_date: formatDateForAPI(bookingDate),

        booking_time_slot: bookingTimeSlot,

        notes: notes.trim() || undefined,
      };

      console.log("BOOKING PAYLOAD:", payload);

      const response = await axios.post(`${baseUrl}/api/bookings`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("BOOKING SUCCESS:", response.data);

      Alert.alert("Booking Success", "Your booking has been created.", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.log(
        "CREATE BOOKING ERROR:",
        error.response?.data || error.message,
      );

      Alert.alert(
        "Booking Failed",
        error.response?.data?.message || "Failed to create booking.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // LOADING
  // =========================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Book Appointment</Text>

      <Text style={styles.subtitle}>
        Choose your vehicle, workshop and schedule
      </Text>

      {/* ================= VEHICLE ================= */}

      <Text style={styles.label}>Vehicle</Text>

      <TouchableOpacity
        style={[styles.selectBox, vehicleIdFromRoute && styles.lockedSelectBox]}
        onPress={() => {
          if (!vehicleIdFromRoute) {
            setShowVehicleList(!showVehicleList);

            setShowWorkshopList(false);
            setShowTimeList(false);
          }
        }}
      >
        {selectedVehicle ? (
          <View>
            <Text style={styles.selectedTitle}>
              {selectedVehicle.brand} {selectedVehicle.model}
            </Text>

            <Text style={styles.selectedSubtitle}>
              {selectedVehicle.plate_number}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Select vehicle</Text>
        )}
      </TouchableOpacity>

      {showVehicleList && !vehicleIdFromRoute && (
        <View style={styles.dropdown}>
          {vehicles.length === 0 ? (
            <Text style={styles.emptyText}>No vehicles found</Text>
          ) : (
            vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle._id}
                style={styles.option}
                onPress={() => {
                  setSelectedVehicle(vehicle);
                  setShowVehicleList(false);
                }}
              >
                <Text style={styles.optionTitle}>
                  {vehicle.brand} {vehicle.model}
                </Text>

                <Text style={styles.optionSubtitle}>
                  {vehicle.plate_number}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* ================= WORKSHOP ================= */}

      <Text style={styles.label}>Workshop</Text>

      <TouchableOpacity
        style={[
          styles.selectBox,
          workshopIdFromRoute && styles.lockedSelectBox,
        ]}
        onPress={() => {
          if (!workshopIdFromRoute) {
            setShowWorkshopList(!showWorkshopList);

            setShowVehicleList(false);
            setShowTimeList(false);
          }
        }}
      >
        {selectedWorkshop ? (
          <View>
            <Text style={styles.selectedTitle}>{selectedWorkshop.name}</Text>

            <Text style={styles.selectedSubtitle}>
              {selectedWorkshop.address}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Select workshop</Text>
        )}
      </TouchableOpacity>

      {showWorkshopList && !workshopIdFromRoute && (
        <View style={styles.dropdown}>
          {workshops.length === 0 ? (
            <Text style={styles.emptyText}>No workshops found</Text>
          ) : (
            workshops.map((workshop) => (
              <TouchableOpacity
                key={workshop._id}
                style={styles.option}
                onPress={() => {
                  setSelectedWorkshop(workshop);

                  setBookingTimeSlot(null);

                  setShowWorkshopList(false);
                }}
              >
                <Text style={styles.optionTitle}>{workshop.name}</Text>

                <Text style={styles.optionSubtitle}>{workshop.address}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* ================= DATE ================= */}

      <Text style={styles.label}>Booking Date</Text>

      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={bookingDate ? styles.selectedTitle : styles.placeholder}>
          {formatDate(bookingDate)}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={bookingDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* ================= TIME SLOT ================= */}

      <Text style={styles.label}>Time Slot</Text>

      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => {
          if (!bookingDate || !selectedWorkshop) {
            Alert.alert(
              "Select Date and Workshop",
              "Please select a workshop and booking date first.",
            );
            return;
          }

          setShowTimeList(!showTimeList);

          setShowVehicleList(false);
          setShowWorkshopList(false);
        }}
      >
        <Text
          style={bookingTimeSlot ? styles.selectedTitle : styles.placeholder}
        >
          {bookingTimeSlot || "Select time slot"}
        </Text>
      </TouchableOpacity>

      {showTimeList && (
        <View style={styles.dropdown}>
          {timeSlots.length === 0 ? (
            <Text style={styles.emptyText}>
              Workshop is closed on this date.
            </Text>
          ) : (
            timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={styles.option}
                onPress={() => {
                  setBookingTimeSlot(slot);

                  setShowTimeList(false);
                }}
              >
                <Text style={styles.optionTitle}>{slot}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* ================= NOTES ================= */}

      <Text style={styles.label}>Notes</Text>

      <View style={[styles.input, styles.notesInput]}>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Describe your vehicle problem"
          placeholderTextColor="#A0A5B1"
          multiline
          style={styles.notesTextInput}
        />
      </View>

      {/* ================= SUBMIT ================= */}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Confirm Booking</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
