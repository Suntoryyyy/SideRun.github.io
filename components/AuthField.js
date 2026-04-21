import React, { useState, forwardRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../constants/typography';

/**
 * AuthField — mirrors the Figma `Auth / Field` component set.
 *
 * Figma variants:
 *   State = Default   →   no focus, no value
 *   State = Focus     →   focused (dark border, white bg)
 *   State = Filled    →   has value, not focused
 *
 * Props align with the Figma component properties:
 *   label        → `Label` text property (placeholder)
 *   icon         → leading Ionicons name
 *   secure       → toggles password mode (adds eye toggle)
 */
const AuthField = forwardRef(function AuthField(
  {
    icon,
    label,
    value,
    onChangeText,
    secure = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleFocus = (e) => {
    setFocused(true);
    onFocus && onFocus(e);
  };
  const handleBlur = (e) => {
    setFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <View
      style={[
        styles.field,
        focused && styles.fieldFocus,
        !!value && !focused && styles.fieldFilled,
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color="#6B6F76" style={styles.icon} />
      ) : null}
      <TextInput
        ref={ref}
        style={styles.input}
        placeholder={label}
        placeholderTextColor="#A5A9B0"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !revealed}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      />
      {secure ? (
        <TouchableOpacity
          style={styles.eye}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => setRevealed((r) => !r)}
        >
          <Ionicons
            name={revealed ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#6B6F76"
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

export default AuthField;

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldFocus: {
    borderColor: '#0B0F13',
    backgroundColor: '#FFFFFF',
  },
  fieldFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: '#0B0F13',
    paddingVertical: 0,
  },
  eye: {
    padding: 4,
    marginLeft: 8,
  },
});
