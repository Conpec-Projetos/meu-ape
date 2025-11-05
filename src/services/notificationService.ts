import { toast } from 'sonner';

export const notifySuccess = (message: string) => {
  toast.success(message);
};

export const notifyError = (message: string) => {
  toast.error(message);
};

export const notifyInfo = (message: string) => {
  toast.info(message);
};

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