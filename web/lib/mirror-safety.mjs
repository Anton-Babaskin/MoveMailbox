// Confirmation belongs to the current endpoints, including provider/security/port selects.
export function bindMirrorReset(controls, reset) {
  for (const control of controls) {
    control.addEventListener('input', reset);
    control.addEventListener('change', reset);
  }
  return () => {
    for (const control of controls) {
      control.removeEventListener('input', reset);
      control.removeEventListener('change', reset);
    }
  };
}
