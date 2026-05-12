/**
 * Ejemplo de uso de echoHelper
 * 
 * Este componente demuestra cómo usar las utilidades de echoHelper
 * para manejar WebSockets de forma segura con Laravel Echo
 */

import { createEchoSubscription, isEchoReady } from '@/Utils/common/echoHelper';
import { useEffect, useState } from 'react';

export function EchoHelperExample() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const userId = 123; // Ejemplo

  useEffect(() => {
    setIsConnected(isEchoReady());

    // ✅ Ejemplo 1: Suscripción simple con cleanup automático
    const cleanup = createEchoSubscription(`users.${userId}`, 'private', (channel) => {
      console.log('✅ Canal conectado:', `users.${userId}`);
      setIsConnected(true);

      // Escuchar eventos
      channel.listen('.MessageReceived', (event: any) => {
        setMessages((prev) => [...prev, event.message]);
      });

      channel.listen('.NotificationCreated', (event: any) => {
        console.log('Nueva notificación:', event);
      });
    });

    // Cleanup automático al desmontar
    return cleanup;
  }, [userId]);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Ejemplos de Echo Helper</h2>

      {/* Estado de conexión */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Estado de Conexión</h3>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span>{isConnected ? '✅ Conectado' : '❌ Desconectado'}</span>
        </div>
      </div>

      {/* Mensajes recibidos */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Mensajes Recibidos</h3>
        {messages.length === 0 ? (
          <p className="text-gray-500">No hay mensajes aún</p>
        ) : (
          <ul className="space-y-1">
            {messages.map((msg, i) => (
              <li key={i} className="text-sm">
                • {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ✅ Ejemplo 2: Hook personalizado con Echo
export function useUserNotifications(userId: number) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    return createEchoSubscription(`users.${userId}`, 'private', (channel) => {
      channel.listen('.NotificationCreated', (event: any) => {
        setNotifications((prev) => [event, ...prev]);
      });
    });
  }, [userId]);

  return notifications;
}

// ✅ Ejemplo 3: Presence Channel (usuarios en línea)
export function useOnlineUsers(roomId: string) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) return;

    return createEchoSubscription(`room.${roomId}`, 'presence', (channel) => {
      // Usuarios actuales
      channel.here((currentUsers: any[]) => {
        setUsers(currentUsers);
      });

      // Usuario se une
      channel.joining((user: any) => {
        setUsers((prev) => [...prev, user]);
      });

      // Usuario se va
      channel.leaving((user: any) => {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      });
    });
  }, [roomId]);

  return users;
}

// ✅ Ejemplo 4: Canal público (sin autenticación)
export function usePublicAnnouncements() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    return createEchoSubscription('announcements', 'public', (channel) => {
      channel.listen('.AnnouncementCreated', (event: any) => {
        setAnnouncements((prev) => [event.message, ...prev]);
      });
    });
  }, []);

  return announcements;
}

// ✅ Ejemplo 5: Múltiples canales
export function useMultipleChannels(userId: number, workspaceId: number) {
  useEffect(() => {
    if (!userId || !workspaceId) return;

    // Canal de usuario
    const userCleanup = createEchoSubscription(`users.${userId}`, 'private', (channel) => {
      channel.listen('.UserEvent', (event: any) => {
        console.log('User event:', event);
      });
    });

    // Canal de workspace
    const workspaceCleanup = createEchoSubscription(
      `workspace.${workspaceId}`,
      'private',
      (channel) => {
        channel.listen('.WorkspaceEvent', (event: any) => {
          console.log('Workspace event:', event);
        });
      },
    );

    // Cleanup de ambos canales
    return () => {
      userCleanup();
      workspaceCleanup();
    };
  }, [userId, workspaceId]);
}

// ❌ ANTI-PATRÓN: No hacer esto
export function BadEchoExample() {
  const userId = 123;

  useEffect(() => {
    // ❌ MAL: Acceso directo sin verificación
    window.Echo.private(`users.${userId}`).listen('.event', (event) => {
      console.log(event);
    });

    return () => {
      // ❌ MAL: Puede fallar si Echo no existe
      window.Echo.leave(`users.${userId}`);
    };
  }, [userId]);

  return null;
}

// ✅ CORRECTO: Usar echoHelper
export function GoodEchoExample() {
  const userId = 123;

  useEffect(() => {
    // ✅ BIEN: Manejo seguro con retry automático
    return createEchoSubscription(`users.${userId}`, 'private', (channel) => {
      channel.listen('.event', (event) => {
        console.log(event);
      });
    });
  }, [userId]);

  return null;
}

// ✅ Ejemplo 6: Verificación manual si es necesario
export function ConditionalEchoExample() {
  const [canUseWebSockets, setCanUseWebSockets] = useState(false);

  useEffect(() => {
    // Verificar si Echo está disponible
    const checkEcho = setInterval(() => {
      if (isEchoReady()) {
        setCanUseWebSockets(true);
        clearInterval(checkEcho);
      }
    }, 100);

    return () => clearInterval(checkEcho);
  }, []);

  if (!canUseWebSockets) {
    return <div>Conectando a WebSockets...</div>;
  }

  return <div>✅ WebSockets disponibles</div>;
}
