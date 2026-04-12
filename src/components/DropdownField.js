import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';

const DropdownField = ({
  icon,
  label,
  value,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (!open) {
      overlayOpacity.setValue(0);
      contentTranslateY.setValue(18);
      return;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentTranslateY, open, overlayOpacity]);

  const handleOpen = () => {
    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelect = (nextValue) => {
    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={handleOpen} activeOpacity={0.85}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#E50914" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        <Ionicons name="chevron-down-outline" size={20} color="#B0B0B0" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const selected = option === value;

                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionItem, selected && styles.optionSelected]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#E50914" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    backgroundColor: '#101217',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 5, 0.86)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 18,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#1A1A1A',
  },
  optionSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.25)',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
});

export default DropdownField;
