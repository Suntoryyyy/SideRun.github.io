import React, { useRef } from 'react';
import { View } from 'react-native';

export default function NativeFilePicker({ children, onWebPick, style }) {
  const inputRef = useRef(null);

  const handleWebChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const uri = URL.createObjectURL(file);
      if (onWebPick) onWebPick(uri);
    }
    if (event.target) event.target.value = null;
  };

  return (
    <View 
      style={[{ cursor: 'pointer' }, style]} 
      onClick={(e) => {
        e.preventDefault();
        inputRef.current?.click();
      }}
    >
      {children}
      <input 
        type="file" 
        accept="image/*" 
        ref={inputRef} 
        onChange={handleWebChange} 
        style={{ display: 'none' }} 
      />
    </View>
  );
}
