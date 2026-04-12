import React, { useEffect, useMemo, useState } from 'react';
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
import { playSoundEffect, SOUND_EFFECT_KEYS } from '../services/soundEffects';
import {
  formatInr,
  getStartingPrice,
  getStateConfig,
  getTheaterBySelection,
  INDIAN_LOCATION_OPTIONS,
} from '../services/bookingCatalog';
import {
  mergeIndianLocationOptions,
  subscribeToAdminTheaters,
} from '../services/adminCatalog';

const getPreferredTheater = (theaters = []) => {
  if (!Array.isArray(theaters) || theaters.length === 0) {
    return null;
  }

  const withShowtimes = theaters.find(
    (theater) => Array.isArray(theater?.showtimes) && theater.showtimes.length > 0,
  );

  return withShowtimes || theaters[0];
};

const LocationSelectionScreen = ({ navigation, route }) => {
  const { movieTitle = 'Selected Movie', movieId, moviePoster = null } = route.params ?? {};
  const [locationOptions, setLocationOptions] = useState(INDIAN_LOCATION_OPTIONS);
  const [selectedState, setSelectedState] = useState(INDIAN_LOCATION_OPTIONS[0].state);
  const initialStateConfig = INDIAN_LOCATION_OPTIONS[0];
  const initialCity = Object.keys(initialStateConfig.cities)[0];
  const initialTheater = getPreferredTheater(initialStateConfig.cities[initialCity]);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedTheater, setSelectedTheater] = useState(initialTheater?.name || '');

  const headerAnimation = useFadeInUp({ delay: 0 });
  const selectorsAnimation = useFadeInUp({ delay: 90 });
  const summaryAnimation = useFadeInUp({ delay: 180 });

  useEffect(() => {
    const unsubscribe = subscribeToAdminTheaters(
      (theaters) => {
        setLocationOptions(mergeIndianLocationOptions(INDIAN_LOCATION_OPTIONS, theaters));
      },
      (error) => {
        console.error('Unable to sync admin theatres:', error);
        setLocationOptions(INDIAN_LOCATION_OPTIONS);
      },
    );

    return unsubscribe;
  }, []);

  const selectedStateConfig = useMemo(
    () => getStateConfig(selectedState, locationOptions),
    [locationOptions, selectedState],
  );
  const cityOptions = useMemo(() => Object.keys(selectedStateConfig.cities), [selectedStateConfig]);
  const theaterOptions = useMemo(
    () => (selectedStateConfig.cities[selectedCity] || []).map((theater) => theater.name),
    [selectedCity, selectedStateConfig],
  );
  const selectedTheaterDetails = useMemo(
    () =>
      getTheaterBySelection({
        state: selectedState,
        city: selectedCity,
        theaterName: selectedTheater,
        options: locationOptions,
      }),
    [locationOptions, selectedCity, selectedState, selectedTheater],
  );

  useEffect(() => {
    if (!locationOptions.length) {
      return;
    }

    const fallbackState = getStateConfig(selectedState, locationOptions) || locationOptions[0];
    const nextState = fallbackState?.state || locationOptions[0].state;
    const nextCityOptions = Object.keys(fallbackState?.cities || {});
    const nextCity = nextCityOptions.includes(selectedCity)
      ? selectedCity
      : nextCityOptions[0];
    const nextTheaterEntries = fallbackState?.cities?.[nextCity] || [];
    const preferredTheater = getPreferredTheater(nextTheaterEntries);
    const nextTheaterOptions = nextTheaterEntries.map((theater) => theater.name);
    const nextTheater = nextTheaterOptions.includes(selectedTheater)
      ? selectedTheater
      : preferredTheater?.name || nextTheaterOptions[0];

    if (nextState !== selectedState) {
      setSelectedState(nextState);
    }

    if (nextCity && nextCity !== selectedCity) {
      setSelectedCity(nextCity);
    }

    if (nextTheater && nextTheater !== selectedTheater) {
      setSelectedTheater(nextTheater);
    }
  }, [locationOptions, selectedCity, selectedState, selectedTheater]);

  const handleStateSelect = (nextState) => {
    const nextStateConfig = getStateConfig(nextState, locationOptions);
    const nextCity = Object.keys(nextStateConfig.cities)[0];
    const nextTheater = getPreferredTheater(nextStateConfig.cities[nextCity])?.name;

    setSelectedState(nextState);
    setSelectedCity(nextCity);
    setSelectedTheater(nextTheater);
  };

  const handleCitySelect = (nextCity) => {
    setSelectedCity(nextCity);
    setSelectedTheater(getPreferredTheater(selectedStateConfig.cities[nextCity])?.name || '');
  };

  const handleProceed = () => {
    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
    navigation.navigate('DateSelection', {
      movieId,
      movieTitle,
      moviePoster,
      location: {
        state: selectedState,
        city: selectedCity,
        theater: selectedTheater,
        theaterDetails: selectedTheaterDetails,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
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
          Choose a city, cinema, and viewing format.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.fieldsSection, selectorsAnimation]}>
        <View style={styles.selectorContainer}>
          <DropdownField
            icon="flag-outline"
            label="State"
            value={selectedState}
            options={locationOptions.map((location) => location.state)}
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
        <Text style={styles.summaryEyebrow}>Selected cinema</Text>
        <Text style={styles.summaryTitle}>{selectedTheater}</Text>
        <Text style={styles.summaryMeta}>
          {selectedCity}, {selectedState}
          {selectedTheaterDetails?.area ? ` • ${selectedTheaterDetails.area}` : ''}
        </Text>

        <View style={styles.summaryPills}>
          {(selectedTheaterDetails?.formats || []).map((format) => (
            <View key={format} style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>{format}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.summaryDescription}>{selectedTheaterDetails?.experience}</Text>
        <Text style={styles.summaryPrice}>
          Tickets from {formatInr(getStartingPrice(selectedTheaterDetails?.seatPricing))}
        </Text>
      </Animated.View>

      <Animated.View style={summaryAnimation}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.selectButton} onPress={handleProceed}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text style={styles.selectButtonText}>Continue to showtimes</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
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
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 4,
  },
  helperText: {
    color: '#B0B0B0',
    fontSize: 13,
    lineHeight: 20,
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
    backgroundColor: '#101217',
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryEyebrow: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  summaryMeta: {
    color: '#9E9EA4',
    marginTop: 6,
    fontSize: 13,
  },
  summaryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  summaryPill: {
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryPillText: {
    color: '#FF8585',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryDescription: {
    color: '#D1D1D5',
    marginTop: 12,
    lineHeight: 20,
  },
  summaryPrice: {
    color: '#FFFFFF',
    marginTop: 14,
    fontWeight: '800',
    fontSize: 17,
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
    borderRadius: 8,
    backgroundColor: '#E50914',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 10,
    fontSize: 14,
  },
});

export default LocationSelectionScreen;
