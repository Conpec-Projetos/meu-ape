import { toast } from 'sonner';

/**
 * Exibe uma notificação de sucesso.
 * @param message A mensagem a ser exibida.
 */
export const notifySuccess = (message: string) => {
  toast.success(message);
};

/**
 * Exibe uma notificação de erro.
 * @param message A mensagem a ser exibida.
 */
export const notifyError = (message: string) => {
  toast.error(message);
};

/**
 * Exibe uma notificação de informação.
 * @param message A mensagem a ser exibida.
 */
export const notifyInfo = (message: string) => {
  toast.info(message);
};

/**
 * Exibe uma notificação que acompanha o estado de uma Promise (carregando, sucesso, erro).
 * @param promise A ação assíncrona (ex: chamada de API) a ser acompanhada.
 * @param messages Objeto com as mensagens para cada estado da Promise.
 */
export const notifyPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: string | ((error: any) => string);
  }
) => {
  toast.promise(promise, {
    loading: messages.loading,
    success: (data) => (typeof messages.success === 'function' ? messages.success(data) : messages.success),
    error: (error) => (typeof messages.error === 'function' ? messages.error(error) : messages.error),
  });
};

/**
 * Exibe uma notificação de confirmação com uma ação.
 * @param message A mensagem a ser exibida.
 * @param onConfirm A função a ser executada ao confirmar.
 * @param confirmLabel O texto do botão de confirmação.
 */
export const notifyConfirmation = (
  message: string,
  onConfirm: () => void,
  confirmLabel: string = "Confirmar"
) => {
  toast(message, {
    action: {
      label: confirmLabel,
      onClick: onConfirm,
    },
  });
};