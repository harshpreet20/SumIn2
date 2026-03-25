import Bonjour from 'bonjour-service';

let bonjourInstance: ReturnType<typeof Bonjour> | null = null;

export function advertiseMdns(port: number): void {
  try {
    bonjourInstance = new Bonjour();
    bonjourInstance.publish({
      name: 'HealthCamp',
      type: 'http',
      port,
      txt: {
        path: '/',
        version: '1.0.0',
      },
    });
    console.log(`mDNS: Advertising as healthcamp.local:${port}`);
  } catch (error) {
    console.warn('mDNS advertisement failed (non-critical):', error);
  }
}

export function stopMdns(): void {
  if (bonjourInstance) {
    bonjourInstance.unpublishAll();
    bonjourInstance.destroy();
    bonjourInstance = null;
  }
}
