/**
 * Settings row with a switch — entire row is tappable (fixes web Switch dead zones).
 */
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import BouncyButton from './BouncyButton';
import { FONT } from '../constants/typography';

export default function PrefToggleRow({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  value,
  disabled,
  onChange,
}) {
  const toggle = () => {
    if (!disabled) onChange(!value);
  };

  return (
    <BouncyButton
      style={[styles.row, disabled && styles.rowDisabled]}
      activeOpacity={0.75}
      onPress={toggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        pointerEvents="none"
        trackColor={{ false: '#D6DAE0', true: '#24C789' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D6DAE0"
      />
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#0B0F13',
  },
  desc: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: '#6B6F76',
    marginTop: 2,
  },
});
