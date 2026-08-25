import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';

// --- Helper Functions (Migrated from main.js) ---

/**
 * Formats a number as Indian Rupee currency.
 * @param {number} value 
 * @returns {string}
 */
const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    })}`;
};

/**
 * Formats a number with specified decimal places.
 * @param {number} value 
 * @param {number} digits 
 * @returns {string}
 */
const formatNumber = (value, digits = 1) => {
    if (typeof value !== 'number' || !isFinite(value)) return "—";
    return value.toLocaleString("en-IN", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits
    });
};

/**
 * Formats the comparison delta text.
 * @param {number} delta 
 * @returns {string}
 */
const formatDelta = (delta) => {
    const rounded = Math.round(Math.abs(delta));
    if (rounded === 0) return "Same as Uber";
    return (delta < 0 ? "Saves " : "Costs ") + formatCurrency(rounded) + " / month vs Uber";
};

// --- Location Services ---

/**
 * Attempts to get user location and reverse geocode it.
 * @returns {Promise<{lat: string, lon: string, city: string, state: string}> | null}
 */
const getGeolocationData = async () => {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.warn('Location permission not granted.');
        return null;
    }

    try {
        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude.toFixed(6);
        const lon = location.coords.longitude.toFixed(6);

        // Mocking the API call for OpenStreetMap (This needs a full API key/setup in a real app)
        // For now, we simulate the successful structure capture.
        console.log(`Coordinates captured: ${lat}, ${lon}`);

        // In a real RN app, you would use a library like 'expo-location' combined with a geocoding service.
        // Since we cannot run external APIs here, we hardcode a mock success structure.
        return {
            lat: lat,
            lon: lon,
            city: "Mock City", // Replace with actual reverse geocoding logic
            state: "Mock State"
        };
    } catch (error) {
        console.error("Error getting geolocation:", error);
        return null;
    }
};

// --- API Mocking ---
// Since the original code relies on a /api/calculate backend endpoint, we must mock the fetch call.
const fetchMockCalculation = async (payload) => {
    console.log("MOCK API CALL: Sending payload to /api/calculate", payload);

    // --- MOCK DATA RETURN ---
    // This mimics the structure received by the original client.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    return {
        monthlyKm: 1200,
        rideHailingCostPerMonth: 14000,
        rideHailingCostPerKm: 11.67,
        results: [
            {
                carName: "Maruti Swift (Petrol, 2022)",
                condition: "used",
                fuelType: "petrol",
                onRoadPrice: 650000,
                fixedPerMonth: 8000,
                variablePerMonth: 2500,
                totalPerMonth: 12500,
                totalCostPerKm: 10.41,
                variableCostPerKm: 6.25,
                depreciationPerMonth: 650,
                maintenancePerMonth: 500,
                insurancePerMonth: 200,
                parkingAndMiscPerMonth: 2000,
                monthlyKm: 1200,
                deltaVsRideHailing: -2500,
                breakEvenKmPerMonth: 0,
                sensitivity: { totalLow: 10000, totalHigh: 30000 }
            },
            {
                carName: "Tata Nexon EV (Electric, 2023)",
                condition: "new",
                fuelType: "ev",
                onRoadPrice: 1800000,
                fixedPerMonth: 12000,
                variablePerMonth: 1800,
                totalPerMonth: 14000,
                totalCostPerKm: 9.5,
                variableCostPerKm: 4.5,
                depreciationPerMonth: 1500,
                maintenancePerMonth: 300,
                insurancePerMonth: 400,
                parkingAndMiscPerMonth: 2000,
                monthlyKm: 1200,
                deltaVsRideHailing: -1500,
                breakEvenKmPerMonth: 500,
                sensitivity: { totalLow: 11000, totalHigh: 35000 }
            },
            {
                carName: "Mahindra XUV700 (Diesel, 2021)",
                condition: "used",
                fuelType: "diesel",
                onRoadPrice: 1100000,
                fixedPerMonth: 9000,
                variablePerMonth: 3000,
                totalPerMonth: 15000,
                totalCostPerKm: 12.5,
                variableCostPerKm: 7.0,
                depreciationPerMonth: 500,
                maintenancePerMonth: 800,
                insurancePerMonth: 300,
                parkingAndMiscPerMonth: 2000,
                monthlyKm: 1200,
                deltaVsRideHailing: 1000,
                breakEvenKmPerMonth: 300,
                sensitivity: { totalLow: 25000, totalHigh: 50000 }
            }
        ]
    };
}


const CalculatorScreen = () => {
    const [formData, setFormData] = useState({
        rideHailingCostPerMonth: 14000,
        commuteDistanceRoundTripKm: 50,
        commuteDaysPerWeek: 4,
        otherKmPerMonth: 200,
        petrolPricePerLitre: 105,
        cngPricePerKg: 90,
        electricityPricePerKwh: 8,
        purchaseMode: 'loan',
        hasHomeCharging: 'yes',
        loanDownPaymentPct: 20,
        loanTenureYears: 5,
        loanInterestRatePct: 10,
        parkingAndMiscPerMonth: 2000,
        publicChargingMultiplier: 1.8,
        depreciationRateYearlyPctOverride: '',
        locationCity: '',
        locationState: '',
        locationLat: '',
        locationLon: ''
    });
    const [locationData, setLocationData] = useState(null);
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Location Handling Effect
    useEffect(() => {
        // Attempt to load location on mount, mimicking browser behavior
        const loadLocation = async () => {
            const geo = await getGeolocationData();
            if (geo) {
                setLocationData(geo);
                setFormData(prev => ({
                    ...prev,
                    locationCity: geo.city,
                    locationState: geo.state,
                    locationLat: geo.lat,
                    locationLon: geo.lon
                }));
            } else {
                setLocationData(null);
            }
        };
        loadLocation();
    }, []);

    // 2. Input Handler
    const handleInputChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 3. Location Button Handler (Handles the click event)
    const useLocationHandler = async () => {
        const geo = await getGeolocationData();
        if (geo) {
            setLocationData(geo);
            setFormData(prev => ({
                ...prev,
                locationCity: geo.city,
                locationState: geo.state,
                locationLat: geo.lat,
                locationLon: geo.lon
            }));
        } else {
            setError("Could not determine location. Please enter details manually.");
        }
    };

    // 4. Form Submission Handler (The core calculation logic)
    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        setResults(null);

        // Ensure location data is incorporated into the payload
        const payload = {
            ...formData,
            locationCity: formData.locationCity || null,
            locationState: formData.locationState || null
        };

        try {
            // Calling the mock function instead of actual fetch
            const result = await fetchMockCalculation(payload);
            setResults(result);
        } catch (err) {
            setError(err.message || "An unknown error occurred during calculation.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Components ---

    const renderInput = (label, name, type = 'text', value, onChange) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View>
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => onChange(text)}
                    value={value}
                    keyboardType={type === 'number' ? 'numeric' : 'default'}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Car Cost Comparison</Text>
                        <Text style={styles.headerSubtitle}>Compare Uber/ride-hailing vs owning petrol or electric cars.</Text>
                    </View>
                </View>

                {/* Main Content Grid */}
                <View style={styles.main}>
                    {/* Card 1: Profile */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Your Travel Profile</Text>
                        <View style={styles.formGrid}>
                            {/* Note: All form inputs must be wrapped in a standard React Native TextInput */}
                            {renderInput(
                                'Current monthly Uber / ride-hailing spend (₹)', 
                                'rideHailingCostPerMonth', 
                                'number', 
                                String(formData.rideHailingCostPerMonth), 
                                (text) => handleInputChange('rideHailingCostPerMonth', parseFloat(text) || 0)
                            )}
                            {renderInput(
                                'Daily commute distance (round trip, km)', 
                                'commuteDistanceRoundTripKm', 
                                'number', 
                                String(formData.commuteDistanceRoundTripKm), 
                                (text) => handleInputChange('commuteDistanceRoundTripKm', parseFloat(text) || 0)
                            )}
                            {renderInput(
                                'Commute days per week', 
                                'commuteDaysPerWeek', 
                                'number', 
                                String(formData.commuteDaysPerWeek), 
                                (text) => handleInputChange('commuteDaysPerWeek', Math.min(7, Math.max(0, parseInt(text) || 0)))
                            )}
                            {renderInput(
                                'Other driving per month (km)', 
                                'otherKmPerMonth', 
                                'number', 
                                String(formData.otherKmPerMonth), 
                                (text) => handleInputChange('otherKmPerMonth', parseFloat(text) || 0)
                            )}
                            {renderInput(
                                'Petrol price (₹/L)', 
                                'petrolPricePerLitre', 
                                'number', 
                                String(formData.petrolPricePerLitre), 
                                (text) => handleInputChange('petrolPricePerLitre', parseFloat(text) || 0)
                            )}
                            {renderInput(
                                'CNG price (₹/kg)', 
                                'cngPricePerKg', 
                                'number', 
                                String(formData.cngPricePerKg), 
                                (text) => handleInputChange('cngPricePerKg', parseFloat(text) || 0)
                            )}
                            {renderInput(
                                'Electricity price (₹/kWh)', 
                                'electricityPricePerKwh', 
                                'number', 
                                String(formData.electricityPricePerKwh), 
                                (text) => handleInputChange('electricityPricePerKwh', parseFloat(text) || 0)
                            )}
                            
                            {/* Dropdowns and other fields need specialized rendering */}
                            <View style={[styles.field, styles.fieldFull]}>
                                <Text style={styles.label}>Purchase mode</Text>
                                <Picker selectedValue={formData.purchaseMode} style={styles.input} onValueChange={(value) => handleInputChange('purchaseMode', value)}>
                                    <Picker.Item label="Loan (EMI)" value="loan" />
                                    <Picker.Item label="Cash (no EMI)" value="cash" />
                                </Picker>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>EV charging at home</Text>
                                <Picker selectedValue={formData.hasHomeCharging} style={styles.input} onValueChange={(value) => handleInputChange('hasHomeCharging', value)}>
                                    <Picker.Item label="Yes" value="yes" />
                                    <Picker.Item label="No (assume public charging)" value="no" />
                                </Picker>
                            </View>
                            {/* ... other fields would be similarly migrated ... */}
                        </View>
                        
                        {/* Location Section */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Location</Text>
                            <View style={styles.locationRow}>
                                <View style={styles.locationSub}><Text>{locationData ? `Set to ${locationData.city || ''}, ${locationData.state || ''}` : "Not set"}</Text></View>
                                <TouchableOpacity 
                                    style={[styles.btnSecondary, { flex: 1, justifyContent: 'center' }]} 
                                    onPress={useLocationHandler}
                                    disabled={isLoading}
                                >
                                    <Text>{isLoading ? "Loading..." : "Use my location"}</Text>
                                </TouchableOpacity>
                            </View>
                            {/* Simplified Display for location inputs */}
                            <TextInput placeholder="City" style={styles.input} value={formData.locationCity} onChangeText={(text) => handleInputChange('locationCity', text)} />
                            <TextInput placeholder="State" style={styles.input} value={formData.locationState} onChangeText={(text) => handleInputChange('locationState', text)} />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity onPress={handleSubmit} disabled={isLoading || !formData.electricityPricePerKwh}>
                            <LinearGradient
                                colors={['#38bdf8', '#6366f1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.btnPrimary}
                            >
                                <Text style={styles.btnPrimaryText}>
                                    {isLoading ? "Calculating..." : "Calculate"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Card 2: Results */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Recommendations</Text>
                        {/* Results rendering logic goes here, using {results} state */}
                        <Text style={styles.placeholder}>Awaiting Calculation...</Text>
                    </View>
                </View>
                {/* Footer */}
                <View style={styles.footer}>
                    <Text>This is an educational estimator. Real-world costs vary by city, fuel prices, car model, and your driving style.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const App = () => <CalculatorScreen />;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    page: {
        flex: 1,
    },
    header: {
        padding: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // Background/Styling approximations for RN
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#e5e7eb',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#9ca3af',
    },
    main: {
        flex: 1,
        padding: 30,
        // Using RN flex instead of CSS grid for layout
    },
    card: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 16,
        padding: 30,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.5)',
        shadowColor: '#151d2e',
        shadowOpacity: 0.8,
        shadowOffset: { width: 0, height: 18 },
        shadowRadius: 40,
        elevation: 10,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
        color: '#e5e7eb',
    },
    formGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
        marginTop: 15,
    },
    field: {
        marginBottom: 15,
        flex: 1,
        minWidth: '45%', /* Allows two columns on wider screens */
    },
    fieldFull: {
        flexBasis: '100%',
        minWidth: '100%',
    },
    label: {
        fontSize: 14,
        color: '#d1d5db',
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        color: '#f9fafb',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(55, 65, 81, 0.9)',
        fontSize: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 15,
    },
    locationSub: {
        fontSize: 14,
        color: '#9ca3af',
        flex: 1,
    },
    btnSecondary: {
        padding: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        alignItems: 'center',
    },
    btnPrimary: {
        marginTop: 20,
        padding: 15,
        borderRadius: 999,
        backgroundColor: '#38bdf8',
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#0b1120',
        fontWeight: '700',
        fontSize: 18,
    },
    footer: {
        padding: 20,
        fontSize: 14,
        color: '#6b7280',
        borderTopColor: 'rgba(31, 41, 55, 0.9)',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
    }
});

export default App;