// services/APIDocumentationService.js
// API documentation and discovery service

class APIDocumentationService {
  constructor() {
    this.endpoints = [];
    this.documentation = {};
  }

  /**
   * Register an API endpoint
   */
  static registerEndpoint(endpoint) {
    const doc = {
      path: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      parameters: endpoint.parameters || [],
      responses: endpoint.responses || [],
      middleware: endpoint.middleware || [],
      tags: endpoint.tags || ["general"],
      rateLimit: endpoint.rateLimit || null,
      registeredAt: new Date(),
    };

    this.endpoints.push(doc);
    return doc;
  }

  /**
   * Get all registered endpoints
   */
  static getAllEndpoints(filters = {}) {
    let filtered = [...this.endpoints];

    if (filters.tag) {
      filtered = filtered.filter((e) => e.tags.includes(filters.tag));
    }

    if (filters.method) {
      filtered = filtered.filter((e) => e.method === filters.method);
    }

    return filtered;
  }

  /**
   * Generate OpenAPI specification
   */
  static generateOpenAPISpec() {
    const spec = {
      openapi: "3.0.0",
      info: {
        title: "S-Pay API",
        version: "1.0.0",
        description: "Secure fraud detection payment API",
      },
      paths: {},
    };

    for (const endpoint of this.endpoints) {
      if (!spec.paths[endpoint.path]) {
        spec.paths[endpoint.path] = {};
      }

      spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        description: endpoint.description,
        parameters: endpoint.parameters,
        responses: endpoint.responses,
        tags: endpoint.tags,
      };
    }

    return spec;
  }

  /**
   * Get endpoint by path
   */
  static getEndpoint(path, method) {
    return this.endpoints.find((e) => e.path === path && e.method === method);
  }

  /**
   * Validate endpoint request
   */
  static validateRequest(endpoint, params) {
    const errors = [];

    for (const param of endpoint.parameters) {
      if (param.required && !params[param.name]) {
        errors.push(`Missing required parameter: ${param.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = APIDocumentationService;
