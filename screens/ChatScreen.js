import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ route, navigation }) {
  const { friendName, friendAvatar } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey, let’s run later!', sender: 'friend', timestamp: '10:00 AM' },
    { id: '2', text: 'Sounds good. What time?', sender: 'me', timestamp: '10:05 AM' },
  ]);
  const flatListRef = useRef(null);

  const sendMessage = () => {
    if (message.trim().length === 0) return;
    const newMsg = {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.friendMessage]}>
        {!isMe && (
          <View style={styles.avatarCircle}>
             <Text style={{fontSize: 16}}>{friendAvatar}</Text>
          </View>
        )}
        <View style={[styles.bubbleContent, isMe ? styles.myBubbleContent : styles.friendBubbleContent]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.friendMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.friendTimeText]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#24C789" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerAvatar}>{friendAvatar}</Text>
          <Text style={styles.headerName}>{friendName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={26} color="#8E8E93" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Message..."
            placeholderTextColor="#8E8E93"
            multiline
          />
          {message.trim().length > 0 ? (
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="arrow-up-circle" size={32} color="#24C789" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn}>
              <Ionicons name="mic-outline" size={26} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerAvatar: {
    fontSize: 24,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 15,
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 15,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  friendMessage: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubbleContent: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubbleContent: {
    backgroundColor: '#24C789',
    borderBottomRightRadius: 4,
  },
  friendBubbleContent: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  friendMessageText: {
    color: '#000000',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  friendTimeText: {
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  attachBtn: {
    padding: 6,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendBtn: {
    marginLeft: 8,
    paddingBottom: 2,
  },
  micBtn: {
    padding: 6,
    marginLeft: 4,
  }
});
