import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

import * as ImagePicker from "expo-image-picker";
// NEW: this library lets us resize + compress a photo on the phone itself,
// and hand us back a base64 (plain text) version of it. No internet needed
// for this step, and no Firebase Storage involved at all.
import * as ImageManipulator from "expo-image-manipulator";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

// We no longer need "storage" from Firebase — only Firestore ("db") is used.
import { auth } from "../firebase/auth";
import { db } from "../firebase/firebaseConfig";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const RED = "#D93B3B";
const GRAY = "#6B7280";
const LIGHT = "#F6F8FB";

const CATEGORY_OPTIONS = [
  "Water",
  "Electricity",
  "Lift",
  "Security",
  "Parking",
  "Cleanliness",
  "Other",
];

const SUB_CATEGORY_OPTIONS: Record<string, string[]> = {
  Water: [
    "Leakage",
    "No Water Supply",
    "Low Pressure",
    "Other",
  ],

  Electricity: [
    "Power Outage",
    "Street Light",
    "Meter Issue",
    "Other",
  ],

  Lift: [
    "Lift Not Working",
    "Stuck",
    "Noise",
    "Other",
  ],

  Security: [
    "Guard",
    "Gate",
    "Visitor",
    "Other",
  ],

  Parking: [
    "Unauthorized Parking",
    "Vehicle Damage",
    "Other",
  ],

  Cleanliness: [
    "Garbage",
    "Common Area",
    "Pest Control",
    "Other",
  ],

  Other: [
    "General Issue",
  ],
};

const LOCATION_OPTIONS = [
  "My Flat",
  "Lobby",
  "Lift",
  "Parking",
  "Garden",
  "Clubhouse",
  "Terrace",
  "Other",
];

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

type SelectFieldProps = {
  label: string;
  placeholder: string;
  value: string | null;
  options: string[];
  required?: boolean;
  disabled?: boolean;
  onSelect: (value: string) => void;
};

const SelectField = ({
  label,
  placeholder,
  value,
  options,
  required,
  disabled,
  onSelect,
}: SelectFieldProps) => {

  const [visible, setVisible] = useState(false);

  return (
    <>
      <Text style={styles.label}>
        {label}

        {required && (
          <Text style={{ color: RED }}>
            {" "}*
          </Text>
        )}
      </Text>

      <TouchableOpacity
        style={[
          styles.selectBox,
          disabled && {
            opacity: 0.45,
          },
        ]}
        onPress={() => {
          if (!disabled) setVisible(true);
        }}
      >
        <Text
          style={[
            styles.selectText,
            !value && {
              color: "#9CA3AF",
            },
          ]}
        >
          {value || placeholder}
        </Text>

        <Ionicons
          name="chevron-down"
          size={18}
          color={GRAY}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalBox}>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {

                    onSelect(item);

                    setVisible(false);

                  }}
                >
                  <Text style={styles.optionText}>
                    {item}
                  </Text>

                  {value === item && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={GREEN}
                    />
                  )}
                </TouchableOpacity>

              )}
            />

          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default function RaiseComplaintScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);

  const [description, setDescription] = useState("");

  // "photos" only holds the temporary local file paths, just for showing
  // the little preview thumbnails on screen. The real conversion to
  // base64 text happens later, only when the user taps Submit.
  const [photos, setPhotos] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [submitStep, setSubmitStep] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCategory = (value: string) => {
    setCategory(value);
    setSubCategory(null);
  };

  const pickImage = async () => {

    if (photos.length >= 3) {
      showAlert("Limit Reached", "Maximum 3 photos allowed.");
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert(
        "Permission Needed",
        "Please allow gallery permission."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((x) => x !== uri));
  };

  const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<T>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${label} timed out. Check your internet connection.`)),
        ms
      );
    });
    // Whichever finishes first wins the race. We clear the leftover timer
    // so it doesn't fire uselessly later once the real promise has settled.
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  };

  // ---- THIS IS THE PART THAT CHANGED ----
  // Old code: uploaded the photo to Firebase Storage (uploadBytes) and saved
  // the download link. Firebase now requires the paid "Blaze" plan to use
  // Storage at all (a rule change from Feb 2026), so on the free "Spark"
  // plan every upload silently fails and the whole complaint submission
  // breaks along with it.
  //
  // New approach: shrink the photo on the phone itself (smaller width +
  // lower quality) and turn it into a base64 text string. That text gets
  // saved straight into the Firestore document, no Storage bucket needed.
  const compressAndEncodeImage = async (uri: string) => {

    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // shrink width to 800px, height auto-adjusts
      {
        compress: 0.4, // 0 = lowest quality/smallest size, 1 = full quality
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true, // ask it to also give us the base64 text directly
      }
    );

    if (!manipulated.base64) {
      throw new Error("Could not process the photo. Please try again.");
    }

    // Prefixing it as a "data URI" means <Image source={{ uri }} /> can
    // display it directly — same as showing any remote image by URL.
    return `data:image/jpeg;base64,${manipulated.base64}`;
  };

  const handleSubmit = async () => {

    if (!category)
      return showAlert("Missing", "Select category.");

    if (!subCategory)
      return showAlert("Missing", "Select sub category.");

    if (!location)
      return showAlert("Missing", "Select location.");

    if (!description.trim())
      return showAlert("Missing", "Enter description.");

    const user = auth.currentUser;

    if (!user) {
      showAlert("Session Expired", "Please login again.");
      router.replace("/login");
      return;
    }

    try {

      setSubmitting(true);

      let processedPhotos: string[] = [];

      if (photos.length > 0) {

        let index = 0;

        for (const uri of photos) {
          index++;
          setSubmitStep(`Processing photo ${index} of ${photos.length}...`);

          try {
            const encoded = await compressAndEncodeImage(uri);
            processedPhotos.push(encoded);
          } catch (processErr: any) {
            console.log("Image processing failed:", processErr);
            throw new Error(processErr?.message || "Failed to process photo. Please try again.");
          }
        }

      }

      setSubmitStep("Saving complaint...");

      const complaintNumber =
        "CMP-" + Math.floor(1000 + Math.random() * 9000);

      await withTimeout(
        addDoc(collection(db, "complaints"), {

          complaintId: complaintNumber,

          memberId: user.uid,

          email: user.email,

          category,

          subCategory,

          location,

          description,

          // Same field name as before ("photoUrls") so any other screen
          // that reads this field to display photos keeps working —
          // it just now holds base64 text instead of a Storage link.
          photoUrls: processedPhotos,

          priority: "Normal",

          status: "Pending",

          assignedTo: "",

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp(),

          timeline: [
            {
              title: "Complaint Submitted",
              time: new Date().toISOString(),
            },
          ],
        }),
        15000,
        "Saving complaint"
      );

      showAlert(
        "Success",
        "Complaint submitted successfully."
      );

      router.replace("/dashboard");

    } catch (e: any) {

      console.log(e);

      showAlert(
        "Error",
        e.message || "Something went wrong."
      );

    } finally {

      setSubmitting(false);
      setSubmitStep("");

    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <StatusBar style="dark"/>

      <LinearGradient
        colors={["#ffffff","#F5F9F6"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>

        <TouchableOpacity onPress={()=>router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={NAVY}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Raise Complaint
        </Text>

        <View style={{width:24}}/>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >

        <Animated.View
          style={{
            opacity:fadeAnim,
            transform:[
              {
                translateY:slideAnim
              }
            ]
          }}
        >

          <SelectField
            label="Category"
            required
            placeholder="Select Category"
            value={category}
            options={CATEGORY_OPTIONS}
            onSelect={handleCategory}
          />

          <SelectField
            label="Sub Category"
            required
            placeholder="Select Sub Category"
            value={subCategory}
            options={
              category
              ?SUB_CATEGORY_OPTIONS[category]
              :[]
            }
            disabled={!category}
            onSelect={setSubCategory}
          />

          <SelectField
            label="Location"
            required
            placeholder="Select Location"
            value={location}
            options={LOCATION_OPTIONS}
            onSelect={setLocation}
          />

          <Text style={styles.label}>
            Description
            <Text style={{color:RED}}> *</Text>
          </Text>

          <View style={styles.textAreaContainer}>

            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={description}
              onChangeText={setDescription}
            />

          </View>

          <Text style={styles.label}>
            Photos
          </Text>

          <View style={styles.photoContainer}>

            {
              photos.map(uri=>(

                <View
                  key={uri}
                  style={styles.photoBox}
                >

                  <Image
                    source={{uri}}
                    style={styles.photo}
                  />

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={()=>removePhoto(uri)}
                  >

                    <Ionicons
                      name="close"
                      size={12}
                      color="#fff"
                    />

                  </TouchableOpacity>

                </View>

              ))
            }

            {
              photos.length<3&&(

                <TouchableOpacity
                  style={styles.addPhoto}
                  onPress={pickImage}
                >

                  <Ionicons
                    name="camera"
                    size={26}
                    color={NAVY}
                  />

                  <Text style={styles.addText}>
                    Add
                  </Text>

                </TouchableOpacity>

              )
            }

          </View>

          <TouchableOpacity
            disabled={submitting}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >

            <LinearGradient
              colors={[NAVY,GREEN]}
              style={styles.submitButton}
            >

              {
                submitting
                ?<ActivityIndicator color="#fff"/>
                :
                <Text style={styles.submitText}>
                  Submit Complaint
                </Text>
              }

            </LinearGradient>

          </TouchableOpacity>

          {
            submitting && submitStep !== "" && (
              <Text style={styles.submitStepText}>
                {submitStep}
              </Text>
            )
          }

        </Animated.View>

      </ScrollView>

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 15,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NAVY,
  },

  body: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: NAVY,
  },

  selectBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  selectText: {
    fontSize: 15,
    color: NAVY,
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
  },

  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#ECECEC",
  },

  optionText: {
    fontSize: 15,
    color: NAVY,
  },

  textAreaContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  textArea: {
    minHeight: 110,
    fontSize: 15,
    textAlignVertical: "top",
    color: NAVY,
  },

  photoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },

  photoBox: {
    position: "relative",
  },

  photo: {
    width: 82,
    height: 82,
    borderRadius: 12,
  },

  removeBtn: {
    position: "absolute",
    right: -6,
    top: -6,

    width: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor: RED,

    justifyContent: "center",
    alignItems: "center",
  },

  addPhoto: {
    width: 82,
    height: 82,

    borderRadius: 12,

    borderWidth: 1.5,
    borderColor: "#D6D6D6",
    borderStyle: "dashed",

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#FAFAFA",
  },

  addText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    color: NAVY,
  },

  submitButton: {
    marginTop: 35,
    height: 55,

    borderRadius: 15,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: NAVY,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 6,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  submitStepText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    color: GRAY,
  },
});