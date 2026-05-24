import traceback

from flask import jsonify, current_app


class AppError(Exception):
    def __init__(self, message="An error occurred", status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(AppError):
    def __init__(self, message="Resource not found"):
        super().__init__(message, 404)


class ValidationError(AppError):
    def __init__(self, message="Validation failed"):
        super().__init__(message, 400)


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        current_app.logger.warning("AppError: %s - %s", error.status_code, error.message)
        return jsonify({
            "error": error.__class__.__name__,
            "message": error.message,
            "status_code": error.status_code,
        }), error.status_code

    @app.errorhandler(404)
    def handle_404(error):
        current_app.logger.info("404: %s", str(error))
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found",
            "status_code": 404,
        }), 404

    @app.errorhandler(500)
    def handle_500(error):
        current_app.logger.error("500: %s\n%s", str(error), traceback.format_exc())
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "status_code": 500,
        }), 500
