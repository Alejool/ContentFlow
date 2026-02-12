function esFechaValidaMejorada(fecha: string): boolean {
  if (typeof fecha !== "string") return false;

  const formatosComunes = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
  ];
  const esFormatoValido = formatosComunes.some((regex) => regex.test(fecha));
  if (!esFormatoValido) return false;
  const dateObj = new Date(fecha);
  return !isNaN(dateObj.getTime());
}

export function convertDate(date: string): string {
  if (!esFechaValidaMejorada(date)) {
    return "";
  }
  const dateObj = new Date(date);
  const fechaNormalizada = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
  );
  const locale =
    (window as any).APP_LOCALE ||
    Intl.DateTimeFormat().resolvedOptions().locale ||
    "es-ES";
  return fechaNormalizada.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
