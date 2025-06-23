import firestore from '@react-native-firebase/firestore';

export const uploadSessionToFirestore = async (
  sessionId: string,
  data: string[][],
  userId: string,
  expectedKeys: string[]
) => {
  if (!userId) {
    console.error('Upload error: No user ID provided');
    throw new Error('No user ID provided.');
  }

  // Session data from AsyncStorage is string[][] (2D array), Firestore doesn't support nested arrays
  // Need to convert it to an array of objects where each object represents a row with named fields
  const formattedData = data.map(row => {
    const obj: Record<string, string> = {};
    expectedKeys.forEach((key, index) => {
      obj[key] = row[index];
    });
    obj['environment'] = row[expectedKeys.length] || '';
    return obj;
  });

  const sessionRef = firestore()
    .collection('users')
    .doc(userId)
    .collection('sessions')
    .doc(sessionId);

  await sessionRef.set({
    id: sessionId,
    lastUpdated: firestore.FieldValue.serverTimestamp(),
    data: formattedData,
  });
};
