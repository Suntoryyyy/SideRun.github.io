import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function NativeFilePicker({ children, pickImage, style }) {
  return (
    <TouchableOpacity onPress={pickImage} style={style}>
      {children}
    </TouchableOpacity>
  );
}
