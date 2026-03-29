export enum WalletEvent {
  CONNECT_INITIATED = 'CONNECT_INITIATED',
  CONNECT_SUCCESS = 'CONNECT_SUCCESS',
  CONNECT_FAILED = 'CONNECT_FAILED',
  CONNECT_CANCELLED = 'CONNECT_CANCELLED',
  DISCONNECT_INITIATED = 'DISCONNECT_INITIATED',
  DISCONNECT_SUCCESS = 'DISCONNECT_SUCCESS',
  CHAIN_CHANGED_WALLET = 'CHAIN_CHANGED_WALLET',
  CHAIN_CHANGED_UI = 'CHAIN_CHANGED_UI',
  CHAIN_SWITCH_INITIATED = 'CHAIN_SWITCH_INITIATED',
  CHAIN_SWITCH_SUCCESS = 'CHAIN_SWITCH_SUCCESS',
  CHAIN_SWITCH_FAILED = 'CHAIN_SWITCH_FAILED',
  CHAIN_SWITCH_CANCELLED = 'CHAIN_SWITCH_CANCELLED',
  CHAIN_UNSUPPORTED = 'CHAIN_UNSUPPORTED',
  CHAIN_UNKNOWN = 'CHAIN_UNKNOWN',
  ACCOUNT_CHANGED = 'ACCOUNT_CHANGED',
  MODAL_OPENED = 'MODAL_OPENED',
  MODAL_CLOSED = 'MODAL_CLOSED',
}

function formatTime() {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  const mmm = d.getMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${mmm}`;
}

export function logWalletEvent(event: WalletEvent, payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') return;

  if (!event) {
    console.error("[WALLET][INVALID_EVENT]", payload);
    return;
  }

  const time = formatTime();
  const entries = Object.entries(payload)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  const msg = `[WALLET][${event}] ${time} | ${entries}`;
  
  console.log(msg);
}

export function logWalletDebug(label: string, payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') return;

  const time = formatTime();
  console.log(`[WALLET:DEBUG][${label}] ${time} |`, payload);
}

export function logWalletError(event: WalletEvent, error: unknown): void {
  if (process.env.NODE_ENV === 'production') return;

  const time = formatTime();
  
  let code = 'UNKNOWN';
  let message = 'Unknown error';
  let name = 'Error';
  
  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    if ('code' in errObj && errObj.code !== undefined) code = String(errObj.code);
    if ('message' in errObj && errObj.message !== undefined) message = String(errObj.message);
    if ('name' in errObj && errObj.name !== undefined) name = String(errObj.name);
  } else if (typeof error === 'string') {
    message = error;
  }
  
  const msg = `[WALLET:ERROR][${event}] ${time} | code=${code} message="${message}" name="${name}"`;
  
  console.log(msg);
}
