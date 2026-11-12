export const passwordRules = [
  {
    key: 'length',
    label: 'Entre 8 y 128 caracteres',
    test: (value: string) => value.length >= 8 && value.length <= 128,
  },
  {
    key: 'upper',
    label: 'Al menos una letra mayúscula',
    test: (value: string) => /\p{Lu}/u.test(value),
  },
  {
    key: 'lower',
    label: 'Al menos una letra minúscula',
    test: (value: string) => /\p{Ll}/u.test(value),
  },
  {
    key: 'number',
    label: 'Al menos un número',
    test: (value: string) => /\p{N}/u.test(value),
  },
  {
    key: 'special',
    label: 'Al menos un carácter especial',
    test: (value: string) => /[^\p{L}\p{N}\s]/u.test(value),
  },
] as const;
