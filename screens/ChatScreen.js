import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T, FONT } from '../constants/typography';

const isImageAvatar = (a) =>
  typeof a === 'string' &&
  (a.startsWith('file:') || a.startsWith('http') || a.startsWith('data:'));
const initialOf = (s) => (s || '?').trim().charAt(0).toUpperCase() || '?';

export default function ChatScreen({ route, navigation }) {
  const { friendName, friendAvatar } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hey, let’s run later!',
      sender: 'friend',
      timestamp: '10:00 AM',
    },
    {
      id: '2',
      text: 'Sounds good. What time?',
      sender: 'me',
      timestamp: '10:05 AM',
    },
  ]);
  const flatListRef = useRef(null);

  const sendMessage = () => {
    if (message.trim().length === 0) return;
    const newMsg = {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages([...messages, newMsg]);
    setMessage('');
    setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender === 'me';
    const prev = messages[index - 1];
    const showAvatar = !isMe && (!prev || prev.sender !== 'friend');
    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.myRow : styles.friendRow,
        ]}
      >
        {!isMe ? (
          showAvatar ? (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initialOf(friendName)}</Text>
            </View>
          ) : (
            <View style={styles.avatarSpacer} />
          )
        ) : null}
        <View
          style={[
            styles.bubbleContent,
            isMe ? styles.myBubbleContent : styles.friendBubbleContent,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.friendMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timeText,
              isMe ? styles.myTimeText : styles.friendTimeText,
            ]}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  const canSend = message.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color="#0B0F13" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarInitial}>
              {initialOf(friendName)}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{friendName}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#0B0F13" />
        </TouchableOpacity>
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
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#6B6F76" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Message..."
            placeholderTextColor="#9AA0A6"
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              canSend ? styles.sendBtnActive : styles.sendBtnIdle,
            ]}
            onPress={canSend ? sendMessage : undefined}
            activeOpacity={canSend ? 0.85 : 1}
          >
            <Ionicons
              name={canSend ? 'arrow-up' : 'mic-outline'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAECEF',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    fontFamily: FONT.extraBold,
    fontSize: 14,
    color: '#0B0F13',
  },
  headerName: {
    ...T.title4,
    fontSize: 15,
  },
  headerStatus: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    color: '#24C789',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  friendRow: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarSpacer: {
    width: 28,
    marginRight: 8,
  },
  avatarInitial: {
    fontFamily: FONT.extraBold,
    fontSize: 12,
    color: '#0B0F13',
  },
  bubbleContent: {
    maxWidth: '76%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubbleContent: {
    backgroundColor: '#0B0F13',
    borderBottomRightRadius: 6,
  },
  friendBubbleContent: {
    backgroundColor: '#F4F5F7',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontFamily: FONT.medium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  friendMessageText: {
    color: '#0B0F13',
  },
  timeText: {
    fontFamily: FONT.medium,
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontVariant: ['tabular-nums'],
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.55)',
  },
  friendTimeText: {
    color: '#9AA0A6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EAECEF',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  attachBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    fontFamily: FONT.medium,
    fontSize: 15,
    color: '#0B0F13',
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#0B0F13',
  },
  sendBtnIdle: {
    backgroundColor: '#CDD1D6',
  },
});
