import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

let echoInstance: Echo<any> | null = null;

export const getEcho = (): Echo<any> => {
  if (typeof window === 'undefined') return null as any;

  if (!echoInstance) {
    window.Pusher = Pusher;

    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || '1f66536d3d7bb2ec0eec',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
      forceTLS: true,
    });
  }

  return echoInstance;
};