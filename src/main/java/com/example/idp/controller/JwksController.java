package com.example.idp.controller;

import com.example.idp.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/.well-known")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class JwksController {
    
    private final JwtService jwtService;
    
    @GetMapping("/jwks.json")
    public ResponseEntity<Map<String, Object>> getJwks() {
        Map<String, Object> jwks = jwtService.getJwksResponse();
        return ResponseEntity.ok(jwks);
    }
}
