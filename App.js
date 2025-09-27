import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    let { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error(error);
    } else {
      setUsers(data);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {users.length > 0 ? (
        users.map((u, i) => <Text key={i}>{u.name}</Text>)
      ) : (
        <Text>Loading users...</Text>
      )}
    </View>
  );
}
