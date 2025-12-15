
export const validateEmail = (email: string): string | null => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return null; // Campo opcional, se vazio é válido (ou tratado como required fora daqui)
  return re.test(email) ? null : 'Email inválido.';
};

export const validateCNPJ = (cnpj: string): string | null => {
  const clean = cnpj.replace(/[^\d]+/g, '');
  if (!clean) return null;
  if (clean.length !== 14) return 'CNPJ deve ter 14 dígitos.';
  
  // Validação simples de formato/tamanho para UI. 
  // Em produção real, adicionaria o algoritmo de dígito verificador aqui.
  if (/^(\d)\1+$/.test(clean)) return 'CNPJ inválido.';
  
  return null;
};

export const validateCPF = (cpf: string): string | null => {
  const clean = cpf.replace(/[^\d]+/g, '');
  if (!clean) return null;
  if (clean.length !== 11) return 'CPF deve ter 11 dígitos.';
  
  if (/^(\d)\1+$/.test(clean)) return 'CPF inválido.';
  
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const clean = phone.replace(/[^\d]+/g, '');
  if (!clean) return null;
  if (clean.length < 10) return 'Telefone incompleto.';
  return null;
};

export const formatDocument = (value: string): string => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 11) { // CPF
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4");
  } else { // CNPJ
    return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
};
