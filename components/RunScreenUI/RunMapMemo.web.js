import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RunMapMemo = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map is not supported on web</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  text: {
    color: '#888',
    fontSize: 16,
  }
});

export default React.memo(RunMapMemo);
