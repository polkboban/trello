import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';

export const useSocket = (projectId) => {
  const [socket, setSocket] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    let socketInstance;

    const initSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

      socketInstance = io(socketUrl, {
        auth: { token: session.access_token },
      });

      socketInstance.on('connect', () => {
        console.log(' Connected to Realtime Server');
        if (projectId) {
          socketInstance.emit('join_project', projectId);
        }
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [projectId]);

  return socket;
};