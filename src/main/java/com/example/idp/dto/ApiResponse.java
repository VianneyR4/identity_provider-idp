package com.example.idp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String error;
    private Object errors; // For validation errors
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .build();
    }
    
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .build();
    }
    
    public static <T> ApiResponse<T> error(String error) {
        return ApiResponse.<T>builder()
            .success(false)
            .error(error)
            .build();
    }
    
    public static <T> ApiResponse<T> error(String message, String error) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .error(error)
            .build();
    }
    
    public static <T> ApiResponse<T> error(String message, String error, Object errors) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .error(error)
            .errors(errors)
            .build();
    }
}
