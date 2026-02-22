export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const maybeElement = target as {
    isContentEditable?: boolean;
    tagName?: string;
  };

  if (maybeElement.isContentEditable) {
    return true;
  }

  if (typeof maybeElement.tagName !== 'string') {
    return false;
  }

  const tagName = maybeElement.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function shouldIgnoreSessionShortcut(
  event: Pick<KeyboardEvent, 'target' | 'metaKey' | 'ctrlKey' | 'altKey' | 'defaultPrevented' | 'repeat' | 'isComposing'>
): boolean {
  if ('defaultPrevented' in event && event.defaultPrevented) {
    return true;
  }

  if (event.repeat) {
    return true;
  }

  if (event.isComposing) {
    return true;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }

  return isEditableEventTarget(event.target);
}
