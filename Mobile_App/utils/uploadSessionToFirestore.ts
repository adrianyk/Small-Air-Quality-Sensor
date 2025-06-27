import firestore from '@react-native-firebase/firestore';

export const uploadSessionToFirestore = async (
  sessionId: string,
  data: string[][],
  userId: string,
  expectedKeys: string[],
  sessionLabel: string,
  userEmail: string,
  localLastUpdated: { timestamp: number; localTime: string }
) => {
  console.log("uploadSessionToFirestore started");
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
  console.log("📦 Formatted session data:", formattedData.length, "rows");

  const sessionDoc = {
    id: sessionId,
    label: sessionLabel,
    userEmail: userEmail,
    data: formattedData,
    lastUpdated: localLastUpdated.timestamp,
    lastUpdatedIso: localLastUpdated.localTime,
  };

  // 1. Upload to private user-specific path
  const userSessionRef = firestore()
    .collection('users')
    .doc(userId)
    .collection('sessions')
    .doc(sessionId);

  await userSessionRef.set(sessionDoc);
  console.log('Uploaded to user session path:', userSessionRef.path)

  // 2. Upload to publicSessions (without/desrtuctured/removed userEmail)
  const { userEmail: _, ...publicSessionDoc } = sessionDoc;

  const publicSessionRef = firestore()
    .collection('publicSessions')
    .doc(sessionId);

  await publicSessionRef.set(publicSessionDoc);
  console.log('Uploaded to publicSessions:', publicSessionRef.path);
  console.log('Public session data:', publicSessionDoc);

  console.log("uploadSessionToFirestore finished");
};
