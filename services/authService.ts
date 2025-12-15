
import { User } from '../types';

const USERS_KEY = 'orcaFacil_users';
const SESSION_KEY = 'orcaFacil_session';

export const authService = {
  
  getUsers: (): User[] => {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (!sessionId) return null;
      
      const users = authService.getUsers();
      return users.find(u => u.id === sessionId) || null;
    } catch {
      return null;
    }
  },

  register: (userData: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }): User => {
    const users = authService.getUsers();
    
    // Check duplication
    if (users.some(u => u.document === userData.document)) {
      throw new Error('CNPJ já cadastrado.');
    }

    // Simple Hash (Simulation) - In production use bcrypt
    const passwordHash = btoa(userData.password);

    const newUser: User = {
      id: crypto.randomUUID(),
      ...userData,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login
    localStorage.setItem(SESSION_KEY, newUser.id);
    
    return newUser;
  },

  login: (document: string, password: string, remember: boolean): User => {
    const users = authService.getUsers();
    const cleanDoc = document.replace(/[^\d]+/g, '');
    
    const user = users.find(u => u.document.replace(/[^\d]+/g, '') === cleanDoc);
    
    if (!user) {
      throw new Error('Empresa não encontrada.');
    }

    const inputHash = btoa(password);
    if (user.passwordHash !== inputHash) {
      throw new Error('Senha incorreta.');
    }

    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  updatePassword: (userId: string, newPassword: string): void => {
      const users = authService.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) throw new Error("Usuário não encontrado");

      users[userIndex].passwordHash = btoa(newPassword);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  resetPassword: (document: string, email: string, newPassword: string): void => {
    const users = authService.getUsers();
    const cleanDoc = document.replace(/[^\d]+/g, '');

    const userIndex = users.findIndex(u => 
        u.document.replace(/[^\d]+/g, '') === cleanDoc && 
        u.email.toLowerCase() === email.toLowerCase()
    );

    if (userIndex === -1) {
        throw new Error('Dados não conferem com nenhum registro.');
    }

    users[userIndex].passwordHash = btoa(newPassword);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};
