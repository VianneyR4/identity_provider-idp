package com.example.idp.exception;

import com.example.idp.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle validation errors for @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        
        log.warn("Validation failed: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.badRequest()
            .body(ApiResponse.error("Validation failed", "Please check the provided data", errors));
    }

    /**
     * Handle constraint violations (e.g., @Valid on path variables, request parameters)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolationException(
            ConstraintViolationException ex) {
        
        log.warn("Constraint violation: {}", ex.getMessage());
        
        Map<String, String> errors = ex.getConstraintViolations().stream()
            .collect(Collectors.toMap(
                violation -> violation.getPropertyPath().toString(),
                ConstraintViolation::getMessage
            ));

        return ResponseEntity.badRequest()
            .body(ApiResponse.error("Validation failed", "Please check the provided data", errors));
    }

    /**
     * Handle malformed JSON requests
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {
        
        log.warn("Malformed JSON request: {}", ex.getMessage());
        
        String message = "Invalid JSON format";
        if (ex.getMessage().contains("Required request body is missing")) {
            message = "Request body is required";
        } else if (ex.getMessage().contains("JSON parse error")) {
            message = "Invalid JSON syntax";
        }

        return ResponseEntity.badRequest()
            .body(ApiResponse.error("Bad Request", message));
    }

    /**
     * Handle missing request parameters
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingServletRequestParameter(
            MissingServletRequestParameterException ex) {
        
        log.warn("Missing request parameter: {}", ex.getMessage());
        
        String message = String.format("Required parameter '%s' is missing", ex.getParameterName());
        
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("Missing Parameter", message));
    }

    /**
     * Handle method argument type mismatch
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex) {
        
        log.warn("Method argument type mismatch: {}", ex.getMessage());
        
        String message = String.format("Invalid value '%s' for parameter '%s'", 
            ex.getValue(), ex.getName());
        
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("Invalid Parameter", message));
    }

    /**
     * Handle HTTP method not supported
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {
        
        log.warn("HTTP method not supported: {}", ex.getMessage());
        
        String message = String.format("HTTP method '%s' is not supported for this endpoint", 
            ex.getMethod());
        
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
            .body(ApiResponse.error("Method Not Allowed", message));
    }

    /**
     * Handle 404 - No handler found
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoHandlerFoundException(
            NoHandlerFoundException ex) {
        
        log.warn("No handler found: {}", ex.getMessage());
        
        String message = String.format("Endpoint '%s %s' not found", 
            ex.getHttpMethod(), ex.getRequestURL());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error("Not Found", message));
    }

    /**
     * Handle custom business logic exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        
        log.error("Runtime exception: {}", ex.getMessage(), ex);
        
        // Check if it's a known business exception
        if (ex.getMessage().contains("User already exists") || 
            ex.getMessage().contains("Invalid credentials") ||
            ex.getMessage().contains("Account locked") ||
            ex.getMessage().contains("Email not verified")) {
            
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Authentication Error", ex.getMessage()));
        }
        
        // Generic runtime exception
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("Operation Failed", ex.getMessage()));
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Internal Server Error", 
                "An unexpected error occurred. Please try again later."));
    }
}
