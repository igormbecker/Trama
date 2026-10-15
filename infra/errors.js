export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Unexpected internal error", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Please contact the support team.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Service unavailable", {
      cause,
    });
    this.name = "ServiceError";
    this.action = "Please check if the service is available.";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Validation error has occurred.", {
      cause,
    });
    this.name = "ValidationError";
    this.action =
      action || "Please fix the information provided and try again.";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || "This feature could not be found in the system.", {
      cause,
    });
    this.name = "NotFoundError";
    this.action =
      action || "Please fix the information provided and try again.";
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ cause, message, action } = {}) {
    super(message || "Authentication is required to perform this action.", {
      cause,
    });
    this.name = "UnauthorizedError";
    this.action = action || "Please sign in and try again.";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method not allowed");
    this.name = "MethodNotAllowedError";
    this.action = "Method not allowed.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
