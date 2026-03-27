import React, { useMemo, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropdownField from '../components/DropdownField';
import useFadeInUp from '../hooks/useFadeInUp';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';

const LOCATION_OPTIONS = [
  {
    state: 'California',
    cities: {
      'Los Angeles': ['Cinema 1', 'Cinema 4', 'Cinema 7'],
      'San Diego': ['Cinema 8', 'Cinema 12'],
      'San Francisco': ['Cinema 14', 'Cinema 16'],
    },
  },
  {
    state: 'Texas',
    cities: {
      Houston: ['Cinema 2', 'Cinema 5', 'Cinema 9'],
      Dallas: ['Cinema 11', 'Cinema 15'],
      Austin: ['Cinema 18', 'Cinema 19'],
    },
  },
  {
    state: 'New York',
    cities: {
      'New York City': ['Cinema 3', 'Cinema 6', 'Cinema 10'],
      Buffalo: ['Cinema 20', 'Cinema 21'],
      Albany: ['Cinema 22', 'Cinema 23'],
    },
  },
  {
    state: 'Florida',
    cities: {
      Miami: ['Cinema 13', 'Cinema 17'],
      Orlando: ['Cinema 24', 'Cinema 25'],
      Tampa: ['Cinema 26', 'Cinema 27'],
    },
  },
];

const getStateConfig = (selectedState) =>
  LOCATION_OPTIONS.find((location) => location.state === selectedState) || LOCATION_OPTIONS[0];

const LocationSelectionScreen = ({ navigation, route }) => {
  const { movieTitle = 'Selected Movie', movieId } = route.params ?? {};
  const [selectedState, setSelectedState] = useState(LOCATION_OPTIONS[0].state);
  const initialStateConfig = LOCATION_OPTIONS[0];
  const initialCity = Object.keys(initialStateConfig.cities)[0];
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedTheater, setSelectedTheater] = useState(initialStateConfig.cities[initialCity][0]);

  const headerAnimation = useFadeInUp({ delay: 0 });
  const selectorsAnimation = useFadeInUp({ delay: 90 });
  const summaryAnimation = useFadeInUp({ delay: 180 });

  const selectedStateConfig = useMemo(
    () => getStateConfig(selectedState),
    [selectedState],
  );

  const cityOptions = useMemo(
    () => Object.keys(selectedStateConfig.cities),
    [selectedStateConfig],
  );

  const theaterOptions = useMemo(
    () => selectedStateConfig.cities[selectedCity] || [],
    [selectedCity, selectedStateConfig],
  );

  const handleStateSelect = (nextState) => {
    const nextStateConfig = getStateConfig(nextState);
    const nextCity = Object.keys(nextStateConfig.cities)[0];
    const nextTheater = nextStateConfig.cities[nextCity][0];

    setSelectedState(nextState);
    setSelectedCity(nextCity);
    setSelectedTheater(nextTheater);
  };

  const handleCitySelect = (nextCity) => {
    setSelectedCity(nextCity);
    setSelectedTheater(selectedStateConfig.cities[nextCity][0]);
  };

  const handleProceed = () => {
    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
    navigation.navigate('DateSelection', {
      movieId,
      movieTitle,
      location: {
        state: selectedState,
        city: selectedCity,
        theater: selectedTheater,
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={headerAnimation}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Choose your theater</Text>
            <Text style={styles.headerSubtitle}>{movieTitle}</Text>
          </View>
        </View>

        <Text style={styles.helperText}>
          Pick a state, city, and cinema hall from the dropdown menus below.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.fieldsSection, selectorsAnimation]}>
        <View style={styles.selectorContainer}>
          <DropdownField
            icon="flag-outline"
            label="State"
            value={selectedState}
            options={LOCATION_OPTIONS.map((location) => location.state)}
            onChange={handleStateSelect}
          />
        </View>

        <View style={styles.selectorContainer}>
          <DropdownField
            icon="location-outline"
            label="City"
            value={selectedCity}
            options={cityOptions}
            onChange={handleCitySelect}
          />
        </View>

        <View style={styles.selectorContainer}>
          <DropdownField
            icon="business-outline"
            label="Cinema Hall"
            value={selectedTheater}
            options={theaterOptions}
            onChange={setSelectedTheater}
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.summaryCard, summaryAnimation]}>
        <Text style={styles.summaryTitle}>Current Selection</Text>
        <Text style={styles.summaryText}>
          {selectedState} • {selectedCity} • {selectedTheater}
        </Text>
      </Animated.View>

      <Animated.View style={summaryAnimation}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.selectButton, styles.selectButtonEnabled]}
            onPress={handleProceed}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text style={styles.selectButtonText}>SELECT</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 4,
  },
  helperText: {
    color: '#B0B0B0',
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  fieldsSection: {
    paddingTop: 8,
  },
  selectorContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  summaryCard: {
    marginTop: 18,
    marginHorizontal: 20,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryTitle: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E50914',
  },
  selectButtonEnabled: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});

export default LocationSelectionScreen;
