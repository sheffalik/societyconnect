import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firestore";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const ORANGE = "#F59E0B";
const BLUE = "#2563EB";

type Complaint = {
  complaintId: string;
  category: string;
  subCategory: string;
  location: string;
  description: string;
  status: string;
  assignedTo: string;
  priority: string;
  timeline?: {
    title: string;
    time: string;
  }[];
};

export default function ComplaintDetailsScreen() {

const { id } = useLocalSearchParams();

const [loading,setLoading]=useState(true);

const [complaint,setComplaint]=
useState<Complaint | null>(null);

useEffect(()=>{

loadComplaint();

},[]);

const loadComplaint=async()=>{

try{

const ref=doc(
db,
"complaints",
id as string
);

const snap=await getDoc(ref);

if(snap.exists()){

setComplaint(
snap.data() as Complaint
);

}

}
finally{

setLoading(false);

}

};

if (loading) {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={NAVY} />
    </SafeAreaView>
  );
}

if (!complaint) {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <Text>Complaint not found.</Text>
    </SafeAreaView>
  );
}

const getStatusColor = () => {
  switch (complaint.status) {
    case "Pending":
      return ORANGE;

    case "In Progress":
      return BLUE;

    case "Resolved":
      return GREEN;

    default:
      return NAVY;
  }
};

return (
  <SafeAreaView style={styles.container}>

    <LinearGradient
      colors={["#ffffff", "#F5F9F6"]}
      style={StyleSheet.absoluteFill}
    />

    <View style={styles.header}>

      <TouchableOpacity
        onPress={() => router.back()}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={NAVY}
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        Complaint Details
      </Text>

      <View style={{ width: 24 }} />

    </View>

    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.title}>
        {complaint.category}
      </Text>

      <Text style={styles.id}>
        {complaint.complaintId}
      </Text>

      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: getStatusColor(),
          },
        ]}
      >
        <Text style={styles.statusText}>
          {complaint.status}
        </Text>
      </View>

      <View style={styles.card}>

        <Text style={styles.label}>
          Category
        </Text>

        <Text style={styles.value}>
          {complaint.category}
        </Text>

        <Text style={styles.label}>
          Sub Category
        </Text>

        <Text style={styles.value}>
          {complaint.subCategory}
        </Text>

        <Text style={styles.label}>
          Location
        </Text>

        <Text style={styles.value}>
          {complaint.location}
        </Text>

        <Text style={styles.label}>
          Description
        </Text>

        <Text style={styles.value}>
          {complaint.description}
        </Text>

        <Text style={styles.label}>
          Assigned To
        </Text>

        <Text style={styles.value}>
          {complaint.assignedTo || "Not Assigned"}
        </Text>

      </View>

      <Text style={styles.timelineTitle}>
        Timeline
      </Text>

      {complaint.timeline?.map((item, index) => (

        <View
          key={index}
          style={styles.timelineItem}
        >

          <Ionicons
            name="ellipse"
            size={12}
            color={GREEN}
          />

          <View
            style={{
              marginLeft: 12,
            }}
          >
            <Text style={styles.timelineText}>
              {item.title}
            </Text>

            <Text style={styles.timelineDate}>
              {item.time}
            </Text>
          </View>

        </View>

      ))}

    </ScrollView>

  </SafeAreaView>
);

}

const styles = StyleSheet.create({

loadingContainer:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

container:{
flex:1,
backgroundColor:"#fff"
},

header:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
paddingHorizontal:20,
paddingTop:18,
paddingBottom:15
},

headerTitle:{
fontSize:20,
fontWeight:"700",
color:NAVY
},

body:{
padding:20,
paddingBottom:40
},

title:{
fontSize:22,
fontWeight:"700",
color:NAVY
},

id:{
marginTop:5,
color:"#777"
},

statusBadge:{
alignSelf:"flex-start",
paddingHorizontal:15,
paddingVertical:7,
borderRadius:20,
marginTop:15
},

statusText:{
color:"#fff",
fontWeight:"700"
},

card:{
backgroundColor:"#fff",
marginTop:20,
padding:18,
borderRadius:16,
elevation:3
},

label:{
marginTop:15,
fontWeight:"700",
color:NAVY
},

value:{
marginTop:5,
color:"#555",
lineHeight:22
},

timelineTitle:{
marginTop:30,
fontSize:18,
fontWeight:"700",
color:NAVY
},

timelineItem:{
flexDirection:"row",
marginTop:18,
alignItems:"flex-start"
},

timelineText:{
fontWeight:"600",
color:NAVY
},

timelineDate:{
marginTop:4,
color:"#777",
fontSize:12
}

});