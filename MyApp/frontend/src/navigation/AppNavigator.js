import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import Login from "../screens/Login";
import Signup from "../screens/Signup";
import AdminDashboard from "../screens/AdminDashboard";
import PatientDashboard from "../screens/PatientDashboard";
import CommunityDashboard from "../screens/CommunityDashboard";
import OtpVerify from "../screens/OtpVerify";
import ForgetPassword from "../screens/ForgetPassword";
import ResetPassword from "../screens/ResetPassword";
import SplashScreen from "../screens/SplashScreen";
import SupportCircleScreen from "../screens/SupportCircleScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CommunitySettings from "../screens/CommunitySettings";
import AdminSettings from "../screens/AdminSettings";
import PatientProfile from "../screens/PatientProfile";
import ReportsScreen from "../screens/ReportsScreen";
import PdfViewerScreen from "../screens/PdfViewerScreen";
import NearbyHealthCenters from "../screens/NearbyHealthCenters";
import ScheduleScreen from "../screens/ScheduleScreen";
import CommunityScheduleScreen from "../screens/CommunityScheduleScreen";
import EducationHub from "../screens/EducationHub";
import CommunityTasks from "../screens/CommunityTasks";
import Communityalerts from "../screens/Communityalerts";
import CommunityProfile from "../screens/CommunityProfile";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
        <Stack.Screen name="CommunityDashboard" component={CommunityDashboard} />
        <Stack.Screen name="OtpVerify" component={OtpVerify} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="SupportCircle" component={SupportCircleScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="CommunitySettings" component={CommunitySettings} />
        <Stack.Screen name="AdminSettings" component={AdminSettings} />
        <Stack.Screen name="Profile" component={PatientProfile} />
        <Stack.Screen name="ReportsScreen" component={ReportsScreen} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
        <Stack.Screen name="NearbyHealthCenters" component={NearbyHealthCenters} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="CommunitySchedule" component={CommunityScheduleScreen} />
        <Stack.Screen name="EducationHub" component={EducationHub} />
        <Stack.Screen name="Communityalerts" component={Communityalerts} />
        <Stack.Screen name="CommunityTasks" component={CommunityTasks} />
        <Stack.Screen name="CommunityProfile" component={CommunityProfile} />
      </Stack.Navigator>

      {/* Global Toast */}
      <Toast />
    </NavigationContainer>
  );
}
