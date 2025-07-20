// Sistema de invalidação inteligente de cache
// Monitora mudanças e invalida caches automaticamente

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

class CacheInvalidationManager {
  constructor() {
    this.queryClient = null;
    this.invalidationRules = new Map();
    this.dependencyGraph = new Map();
    this.lastInvalidation = new Map();
    this.debounceTimers = new Map();
    this.isOnline = navigator.onLine;
    
    this.setupNetworkListeners();
    this.setupVisibilityListener();
  }

  setQueryClient(client) {
    this.queryClient = client;
  }

  // Configura listeners para mudanças de rede
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Reconectado - invalidando caches expirados');
      this.invalidateExpiredCaches();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline - pausando invalidações automáticas');
    });
  }

  // Configura listener para mudanças de visibilidade
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        console.log('👁️ Aplicação focada - verificando caches');
        this.checkAndInvalidateStale();
      }
    });
  }

  // Registra regras de invalidação
  registerInvalidationRule(triggerPattern, targets, options = {}) {
    const rule = {
      targets: Array.isArray(targets) ? targets : [targets],
      debounceMs: options.debounceMs || 100,
      condition: options.condition || (() => true),
      priority: options.priority || 'normal', // low, normal, high
      cascade: options.cascade !== false, // se deve invalidar dependências
    };

    this.invalidationRules.set(triggerPattern, rule);
    
    // Registra dependências
    if (rule.cascade) {
      rule.targets.forEach(target => {
        if (!this.dependencyGraph.has(target)) {
          this.dependencyGraph.set(target, new Set());
        }
        this.dependencyGraph.get(target).add(triggerPattern);
      });
    }

    console.log(`📋 Regra de invalidação registrada: ${triggerPattern} -> ${rule.targets.join(', ')}`);
  }

  // Remove regra de invalidação
  unregisterInvalidationRule(triggerPattern) {
    const rule = this.invalidationRules.get(triggerPattern);
    if (rule) {
      // Remove dependências
      rule.targets.forEach(target => {
        const deps = this.dependencyGraph.get(target);
        if (deps) {
          deps.delete(triggerPattern);
          if (deps.size === 0) {
            this.dependencyGraph.delete(target);
          }
        }
      });
      
      this.invalidationRules.delete(triggerPattern);
      console.log(`🗑️ Regra de invalidação removida: ${triggerPattern}`);
    }
  }

  // Executa invalidação com debounce
  invalidate(pattern, metadata = {}) {
    if (!this.queryClient) {
      console.warn('QueryClient não configurado');
      return;
    }

    const rule = this.invalidationRules.get(pattern);
    if (!rule) {
      // Invalidação direta sem regra
      this.executeInvalidation([pattern], { debounceMs: 100 });
      return;
    }

    // Verifica condição
    if (!rule.condition(metadata)) {
      console.log(`⏭️ Invalidação pulada (condição falhou): ${pattern}`);
      return;
    }

    // Debounce por prioridade
    const debounceKey = `${pattern}_${rule.priority}`;
    
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey));
    }

    const timer = setTimeout(() => {
      this.executeInvalidation(rule.targets, rule, metadata);
      this.debounceTimers.delete(debounceKey);
    }, rule.debounceMs);

    this.debounceTimers.set(debounceKey, timer);
  }

  // Executa a invalidação efetivamente
  async executeInvalidation(targets, rule = {}, metadata = {}) {
    if (!this.isOnline && rule.priority !== 'high') {
      console.log('📴 Offline - invalidação adiada:', targets);
      return;
    }

    const timestamp = Date.now();
    const invalidatedKeys = new Set();

    try {
      // Processa targets em ordem de prioridade
      const sortedTargets = this.sortTargetsByPriority(targets, rule.priority);
      
      for (const target of sortedTargets) {
        // Evita invalidação muito frequente
        const lastInvalidation = this.lastInvalidation.get(target);
        if (lastInvalidation && (timestamp - lastInvalidation) < 1000) {
          console.log(`⏰ Invalidação muito recente pulada: ${target}`);
          continue;
        }

        await this.invalidateQueryPattern(target);
        invalidatedKeys.add(target);
        this.lastInvalidation.set(target, timestamp);
        
        // Invalidação em cascata
        if (rule.cascade) {
          const dependencies = this.getDependencies(target);
          for (const dep of dependencies) {
            await this.invalidateQueryPattern(dep);
            invalidatedKeys.add(dep);
          }
        }
      }

      console.log(`🧹 Invalidação concluída:`, {
        targets: Array.from(invalidatedKeys),
        metadata,
        timestamp: new Date(timestamp).toISOString()
      });

      // Dispara evento de invalidação
      this.dispatchInvalidationEvent(Array.from(invalidatedKeys), metadata);

    } catch (error) {
      console.error('❌ Erro na invalidação:', error);
    }
  }

  // Invalida queries por padrão
  async invalidateQueryPattern(pattern) {
    try {
      // Invalidação por chave exata
      if (!pattern.includes('*')) {
        await this.queryClient.invalidateQueries({ queryKey: [pattern] });
        return;
      }

      // Invalidação por padrão (wildcard)
      const cache = this.queryClient.getQueryCache();
      const queries = cache.getAll();
      
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const matchingQueries = queries.filter(query => {
        const keyString = JSON.stringify(query.queryKey);
        return regex.test(keyString);
      });

      if (matchingQueries.length > 0) {
        await Promise.all(
          matchingQueries.map(query => 
            this.queryClient.invalidateQueries({ queryKey: query.queryKey })
          )
        );
        console.log(`🎯 ${matchingQueries.length} queries invalidadas para padrão: ${pattern}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao invalidar padrão ${pattern}:`, error);
    }
  }

  // Ordena targets por prioridade
  sortTargetsByPriority(targets, priority = 'normal') {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    
    return [...targets].sort((a, b) => {
      // Prioriza invalidações mais específicas (sem wildcards)
      const aSpecific = !a.includes('*') ? 0 : 1;
      const bSpecific = !b.includes('*') ? 0 : 1;
      
      if (aSpecific !== bSpecific) {
        return aSpecific - bSpecific;
      }
      
      // Depois por prioridade configurada
      return priorityOrder[priority] || 1;
    });
  }

  // Obtém dependências de um target
  getDependencies(target) {
    const dependencies = new Set();
    
    // Busca dependências diretas
    const directDeps = this.dependencyGraph.get(target);
    if (directDeps) {
      directDeps.forEach(dep => dependencies.add(dep));
    }
    
    // Busca dependências indiretas (até 2 níveis)
    dependencies.forEach(dep => {
      const indirectDeps = this.dependencyGraph.get(dep);
      if (indirectDeps) {
        indirectDeps.forEach(indDep => dependencies.add(indDep));
      }
    });
    
    return dependencies;
  }

  // Invalida caches expirados
  async invalidateExpiredCaches() {
    if (!this.queryClient) return;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    const now = Date.now();
    
    const expiredQueries = queries.filter(query => {
      const { dataUpdatedAt, staleTime = 0 } = query.state;
      return dataUpdatedAt && (now - dataUpdatedAt) > staleTime;
    });

    if (expiredQueries.length > 0) {
      console.log(`⏰ Invalidando ${expiredQueries.length} caches expirados`);
      
      await Promise.all(
        expiredQueries.map(query => 
          this.queryClient.invalidateQueries({ queryKey: query.queryKey })
        )
      );
    }
  }

  // Verifica e invalida caches obsoletos
  async checkAndInvalidateStale() {
    if (!this.queryClient) return;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutos

    const staleQueries = queries.filter(query => {
      const { dataUpdatedAt } = query.state;
      return dataUpdatedAt && (now - dataUpdatedAt) > staleThreshold;
    });

    if (staleQueries.length > 0) {
      console.log(`🔄 Invalidando ${staleQueries.length} caches obsoletos`);
      
      // Agrupa por tipo para invalidação eficiente
      const groupedQueries = this.groupQueriesByType(staleQueries);
      
      for (const [type, queries] of groupedQueries) {
        await this.invalidateQueryPattern(`${type}*`);
      }
    }
  }

  // Agrupa queries por tipo
  groupQueriesByType(queries) {
    const groups = new Map();
    
    queries.forEach(query => {
      const [type] = query.queryKey;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type).push(query);
    });
    
    return groups;
  }

  // Dispara evento de invalidação
  dispatchInvalidationEvent(invalidatedKeys, metadata) {
    const event = new CustomEvent('cache:invalidated', {
      detail: { keys: invalidatedKeys, metadata, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  // Obtém estatísticas de invalidação
  getInvalidationStats() {
    return {
      registeredRules: this.invalidationRules.size,
      dependencyGraph: Object.fromEntries(this.dependencyGraph),
      lastInvalidations: Object.fromEntries(this.lastInvalidation),
      pendingDebounces: this.debounceTimers.size,
      isOnline: this.isOnline
    };
  }

  // Limpa recursos
  cleanup() {
    // Limpa timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Limpa maps
    this.invalidationRules.clear();
    this.dependencyGraph.clear();
    this.lastInvalidation.clear();
  }
}

// Instância singleton
const cacheInvalidationManager = new CacheInvalidationManager();

// Hook para usar o sistema de invalidação
export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();
  const managerRef = useRef(cacheInvalidationManager);

  useEffect(() => {
    managerRef.current.setQueryClient(queryClient);
    return () => managerRef.current.cleanup();
  }, [queryClient]);

  const registerRule = useCallback((pattern, targets, options) => {
    managerRef.current.registerInvalidationRule(pattern, targets, options);
  }, []);

  const unregisterRule = useCallback((pattern) => {
    managerRef.current.unregisterInvalidationRule(pattern);
  }, []);

  const invalidate = useCallback((pattern, metadata) => {
    managerRef.current.invalidate(pattern, metadata);
  }, []);

  const getStats = useCallback(() => {
    return managerRef.current.getInvalidationStats();
  }, []);

  return {
    registerRule,
    unregisterRule,
    invalidate,
    getStats
  };
};

// Hook para regras automáticas de invalidação
export const useAutoInvalidation = (config = {}) => {
  const { registerRule, unregisterRule } = useCacheInvalidation();

  useEffect(() => {
    // Regras padrão de invalidação
    const defaultRules = [
      // Quando eventos são modificados, invalida tudo relacionado
      {
        pattern: 'events_modified',
        targets: ['eventos', 'coreografias*', 'fotos*', 'estrutura*'],
        options: { debounceMs: 500, priority: 'high', cascade: true }
      },
      
      // Quando coreografias são modificadas
      {
        pattern: 'coreografias_modified',
        targets: ['coreografias*', 'fotos*', 'thumbnails*'],
        options: { debounceMs: 300, priority: 'normal', cascade: true }
      },
      
      // Quando fotos são adicionadas/removidas
      {
        pattern: 'fotos_modified',
        targets: ['fotos*', 'thumbnails*', 'estrutura*'],
        options: { debounceMs: 200, priority: 'normal' }
      },
      
      // Invalidação por upload de novas fotos
      {
        pattern: 'photos_uploaded',
        targets: ['fotos*', 'coreografias*', 'thumbnails*'],
        options: { 
          debounceMs: 1000, 
          priority: 'high',
          condition: (metadata) => metadata.count > 0
        }
      },
      
      // Invalidação quando usuário faz login/logout
      {
        pattern: 'user_auth_changed',
        targets: ['*'], // Invalida tudo
        options: { debounceMs: 100, priority: 'high', cascade: false }
      }
    ];

    // Registra regras padrão + personalizadas
    const allRules = [...defaultRules, ...(config.rules || [])];
    
    allRules.forEach(({ pattern, targets, options }) => {
      registerRule(pattern, targets, options);
    });

    // Cleanup
    return () => {
      allRules.forEach(({ pattern }) => {
        unregisterRule(pattern);
      });
    };
  }, [registerRule, unregisterRule, config.rules]);
};

// Hook para monitorar eventos de invalidação
export const useCacheInvalidationListener = (callback) => {
  useEffect(() => {
    const handleInvalidation = (event) => {
      callback(event.detail);
    };

    window.addEventListener('cache:invalidated', handleInvalidation);
    return () => window.removeEventListener('cache:invalidated', handleInvalidation);
  }, [callback]);
};

export default cacheInvalidationManager; 