import React, {useEffect, useState} from 'react';
import base64 from 'react-native-base64';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GiftedChat, IMessage} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';

export default function App() {
  const [user, setUser] = useState({});
  const [email, setEmail] = useState('');
  const [messages, setMessage] = useState([]);

  useEffect(() => {
    getUser();
    // for real time
    const subsribe = firestore()
      .collection('chatId')
      .onSnapshot(querySnapshot => {
        querySnapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            let data: any = change.doc.data();
            data.createdAt = data.createdAt.toDate();
            setMessage(prevMessage => GiftedChat.append(prevMessage, data));
          }
        });
      });

    return () => subsribe();
  }, []);

  async function getUser() {
    let userLocal = await AsyncStorage.getItem('user');
    if (userLocal) setUser(JSON.parse(userLocal));
  }

  async function handlePress() {
    let _id = base64.encode(email);
    let userLocal = {id: _id, email: email};
    await AsyncStorage.setItem('user', JSON.stringify(userLocal));
    setUser(userLocal);
  }

  function onSend(messages: IMessage[]) {
    // untuk history di Firestore
    firestore()
      .collection('chatId')
      .doc(Date.now().toString())
      .set(messages[0]);
  }

  if (Object.keys(user).length == 0) {
    return (
      <View style={styles.container}>
        <TextInput
          placeholder="Masukan email kamu"
          value={email}
          onChangeText={setEmail}
          style={styles.textInput}
        />
        <Button title="Masuk" onPress={handlePress} />
      </View>
    );
  }
  return (
    <View style={styles.chatContainer}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{_id: user.id}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  textInput: {
    height: 40,
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
