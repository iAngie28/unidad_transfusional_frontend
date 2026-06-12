export const TEXT_PATTERNS = {
  alphanumeric: /^[A-Za-z0-9]+$/,
  identifier: /^[A-Za-z0-9-]+$/,
  lettersSpaces: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/,
  textNumberSpace: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]+$/,
  textNumberSlash: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9/ ]+$/,
  username: /^[\w.@+-]+$/
};

const CHAR_PATTERNS = {
  alphanumeric: /[A-Za-z0-9]/g,
  identifier: /[A-Za-z0-9-]/g,
  lettersSpaces: /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g,
  textNumberSpace: /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]/g,
  textNumberSlash: /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9/ ]/g,
  username: /[A-Za-z0-9@.+\-_]/g
};

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

export const keepChars = (value, kind) => {
  const pattern = CHAR_PATTERNS[kind];
  if (!pattern) return value;
  return String(value || '').match(pattern)?.join('') || '';
};

export const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

export const onlyPositiveInteger = (value, maxValue) => {
  const digits = onlyDigits(value).replace(/^0+(?=\d)/, '');
  if (!digits || maxValue === undefined) return digits;
  return String(Math.min(Number(digits), maxValue));
};

export const onlyDecimal = (value, decimals = 2) => {
  const normalized = String(value || '').replace(',', '.').replace(/[^\d.]/g, '');
  const [integer = '', ...rest] = normalized.split('.');
  const decimal = rest.join('').slice(0, decimals);
  if (!integer && rest.length) return decimal ? `0.${decimal}` : '0.';
  return rest.length ? `${integer}.${decimal}` : integer;
};

export const preventInvalidNumberKeys = (event) => {
  if (['e', 'E', '+', '-'].includes(event.key)) {
    event.preventDefault();
  }
};

export const formatBackendErrors = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;

  return Object.entries(data)
    .map(([field, messages]) => {
      if (Array.isArray(messages)) return `${field}: ${messages.join(', ')}`;
      if (messages && typeof messages === 'object') return `${field}: ${formatBackendErrors(messages)}`;
      return `${field}: ${messages}`;
    })
    .join('\n');
};

export const validateFormData = (data, rules) => {
  const errors = [];

  rules.forEach((rule) => {
    const value = data[rule.field];
    const label = rule.label || rule.field;
    const required = typeof rule.required === 'function' ? rule.required(data) : rule.required;

    if (required && isEmpty(value)) {
      errors.push(`${label}: este campo es obligatorio.`);
      return;
    }

    if (isEmpty(value)) return;

    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors.push(`${label}: ${rule.message || 'el formato no es válido.'}`);
      return;
    }

    if (rule.minLength !== undefined && String(value).length < rule.minLength) {
      errors.push(`${label}: debe tener al menos ${rule.minLength} caracteres.`);
      return;
    }

    if (rule.maxLength !== undefined && String(value).length > rule.maxLength) {
      errors.push(`${label}: no puede tener más de ${rule.maxLength} caracteres.`);
      return;
    }

    if (rule.integer && !/^\d+$/.test(String(value))) {
      errors.push(`${label}: debe contener solo números enteros.`);
      return;
    }

    if (rule.decimal && !/^\d+(\.\d+)?$/.test(String(value))) {
      errors.push(`${label}: debe ser un número válido.`);
      return;
    }

    const numericValue = Number(value);
    if ((rule.integer || rule.decimal) && Number.isNaN(numericValue)) {
      errors.push(`${label}: debe ser un número válido.`);
      return;
    }

    if ((rule.integer || rule.decimal) && rule.min !== undefined && numericValue < rule.min) {
      errors.push(`${label}: debe ser mayor o igual a ${rule.min}.`);
      return;
    }

    if ((rule.integer || rule.decimal) && rule.max !== undefined && numericValue > rule.max) {
      errors.push(`${label}: no puede ser mayor a ${rule.max}.`);
      return;
    }

    if (rule.validate) {
      const message = rule.validate(value, data);
      if (message) errors.push(`${label}: ${message}`);
    }
  });

  return errors;
};

export const showValidationAlert = (errors) => {
  if (!errors.length) return false;
  alert(`Corrige los datos antes de guardar:\n\n${errors.join('\n')}`);
  return true;
};
