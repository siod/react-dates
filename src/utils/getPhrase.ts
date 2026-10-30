export default function getPhrase<Arguments>(
  phrase: string | ((args: Arguments) => string) | null | undefined,
  args?: Arguments,
) {
  if (typeof phrase === 'string') return phrase;

  if (typeof phrase === 'function') {
    return phrase(args as Arguments);
  }

  return '';
}
