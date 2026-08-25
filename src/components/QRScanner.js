import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import tailwind from 'twrnc';

const QRScanner = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  const requestPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to scan UPI QR codes for payments.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    
    // Extract UPI ID for display, but pass full data for payment processing
    let displayUpiId = data;
    
    if (data.startsWith('upi://pay')) {
      // Extract just the UPI ID from full UPI URL for display
      const paMatch = data.match(/[?&]pa=([^&]+)/);
      if (paMatch) {
        displayUpiId = decodeURIComponent(paMatch[1]);
      }
    }
    
    // Return object with both display ID and full QR data
    onScan({ displayId: displayUpiId, fullData: data });
    onClose();
  };

  if (hasPermission === null) {
    return (
      <View style={tailwind`flex-1 bg-black justify-center items-center p-6`}>
        <Text style={tailwind`text-white text-lg font-semibold mb-2`}>Requesting camera permission...</Text>
        <Text style={tailwind`text-gray-400 text-sm text-center`}>Please allow camera access to scan QR codes.</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={tailwind`flex-1 bg-black justify-center items-center p-6`}>
        <Text style={tailwind`text-white text-xl font-bold text-center mb-2`}>
          Camera Access Required
        </Text>
        <Text style={tailwind`text-gray-300 text-sm text-center mb-6`}>
          BudgetBuddy needs camera permission to scan UPI QR codes for fast expense tracking and payments.
        </Text>
        <View style={tailwind`flex-row gap-4`}>
          <Pressable
            style={tailwind`bg-purple-600 px-6 py-3 rounded-xl flex-1 items-center`}
            onPress={requestPermission}
          >
            <Text style={tailwind`text-white font-bold`}>Grant Permission</Text>
          </Pressable>
          <Pressable
            style={tailwind`bg-gray-800 px-6 py-3 rounded-xl flex-1 items-center`}
            onPress={onClose}
          >
            <Text style={tailwind`text-white font-bold`}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={tailwind`flex-1 bg-black`}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={tailwind`flex-1 justify-center items-center`}>
          {/* Header */}
          <View style={tailwind`absolute top-0 left-0 right-0 bg-black bg-opacity-60 p-6`}>
            <Text style={tailwind`text-white text-2xl font-bold text-center`}>
              Scan UPI QR Code
            </Text>
            <Text style={tailwind`text-white text-center mt-2 opacity-80`}>
              Position the QR code within the frame
            </Text>
          </View>

          {/* Scanning Frame */}
          <View style={tailwind`w-72 h-72 border-4 border-white rounded-3xl`}>
            <View style={tailwind`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-purple-500 rounded-tl-3xl`} />
            <View style={tailwind`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-purple-500 rounded-tr-3xl`} />
            <View style={tailwind`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-purple-500 rounded-bl-3xl`} />
            <View style={tailwind`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-purple-500 rounded-br-3xl`} />
          </View>

          {/* Bottom Actions */}
          <View style={tailwind`absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-6`}>
            <Pressable
              style={tailwind`bg-white px-6 py-4 rounded-xl`}
              onPress={onClose}
            >
              <Text style={tailwind`text-black font-bold text-center text-lg`}>Cancel</Text>
            </Pressable>
            
            <Pressable
              style={tailwind`mt-3`}
              onPress={() => {
                Alert.prompt(
                  "Enter UPI ID Manually",
                  "Enter the UPI ID:",
                  (text) => {
                    if (text) {
                      onScan(text);
                      onClose();
                    }
                  },
                  "plain-text"
                );
              }}
            >
              <Text style={tailwind`text-white text-center`}>Enter UPI ID Manually</Text>
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

export default QRScanner;
