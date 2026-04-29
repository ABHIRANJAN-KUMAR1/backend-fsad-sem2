package com.example.activities.exception;

import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation", ex);
        
        String errorMessage = "Duplicate or invalid data violates a database constraint.";
        Throwable cause = ex.getMostSpecificCause();
        String raw = cause != null ? cause.getMessage() : ex.getMessage();
        
        if (raw != null) {
            String msg = raw.toLowerCase();
            if (msg.contains("uk_checkins_activity_user") || 
                (msg.contains("checkins") && msg.contains("activityid") && msg.contains("userid"))) {
                errorMessage = "User is already checked in for this activity.";
            } else if (msg.contains("email")) {
                errorMessage = "This email is already registered.";
            }
        }
        
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", errorMessage));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        log.warn("Illegal state", ex);
        String msg = ex.getMessage() != null ? ex.getMessage() : "Request cannot be completed.";
        
        if (msg.contains("Please wait before requesting another OTP")) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", msg));
        }
        if (msg.contains("spring.mail.username") || msg.contains("Email sending failed")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", msg));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", msg));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument", ex);
        String msg = ex.getMessage() != null ? ex.getMessage() : "Invalid request";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", msg));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        log.warn("Validation failed", ex);
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(ApiExceptionHandler::formatFieldError)
                .collect(Collectors.joining("; "));
        
        // Include global errors if any
        if (!ex.getBindingResult().getGlobalErrors().isEmpty()) {
            String globalMsg = ex.getBindingResult().getGlobalErrors().stream()
                    .map(e -> e.getDefaultMessage())
                    .collect(Collectors.joining("; "));
            if (!message.isBlank()) message += "; ";
            message += globalMsg;
        }
        
        if (message.isBlank()) {
            message = "Invalid request";
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Malformed JSON request", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid request format. Please check your JSON syntax."));
    }

    // @ExceptionHandler(Exception.class)
    // public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
    //     log.error("Unexpected error", ex);
    //     return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
    //             .body(Map.of("error", "An internal server error occurred. Please try again later."));
    // }
@ExceptionHandler(Exception.class)
public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
    log.error("Unexpected error", ex);

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of(
                "error", ex.getMessage(),   // 👈 show real error
                "type", ex.getClass().getSimpleName()
            ));
}
    
    private static String formatFieldError(FieldError fe) {
        return fe.getField() + ": " + fe.getDefaultMessage();
    }
}
