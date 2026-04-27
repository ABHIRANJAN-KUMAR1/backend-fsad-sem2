package com.example.activities.controller;

import com.example.activities.dto.BroadcastRequest;
import com.example.activities.model.Broadcast;
import com.example.activities.security.AuthService;
import com.example.activities.security.AuthUser;
import com.example.activities.service.BroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/broadcasts", "/api/broadcast"})
@RequiredArgsConstructor
public class BroadcastController {

    private final BroadcastService service;
    private final AuthService authService;

    @GetMapping
    public List<Broadcast> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Broadcast> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/preview/recipients")
    public ResponseEntity<?> recipientPreview(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin", "coordinator")) {
            return forbidden("Only admin or coordinator can view recipient preview.");
        }
        return ResponseEntity.ok(service.getRecipientPreview());
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody BroadcastRequest request) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin", "coordinator")) {
            return forbidden("Only admin or coordinator can send broadcasts.");
        }
        Broadcast created = service.createAndSend(request, user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Backward-compatible alias for clients calling /send
    @PostMapping("/send")
    public ResponseEntity<?> sendAlias(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody BroadcastRequest request) {
        return create(authHeader, request);
    }

    @PostMapping("/students")
    public ResponseEntity<?> sendToAllStudents(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody BroadcastRequest request) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin")) {
            return forbidden("Only admin can broadcast to all students.");
        }
        request.setTargetRole("student");
        Broadcast created = service.createAndSend(request, user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/all-users")
    public ResponseEntity<?> sendToAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody BroadcastRequest request) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin")) {
            return forbidden("Only admin can broadcast to all users.");
        }
        request.setTargetRole("all");
        Broadcast created = service.createAndSend(request, user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Backward-compatible alias for clients calling /students/send
    @PostMapping("/students/send")
    public ResponseEntity<?> sendToStudentsAlias(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody BroadcastRequest request) {
        return sendToAllStudents(authHeader, request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody BroadcastRequest request) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin", "coordinator")) {
            return forbidden("Only admin or coordinator can update broadcasts.");
        }
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin")) {
            return forbidden("Only admin can delete broadcasts.");
        }
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    private ResponseEntity<Map<String, String>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", message));
    }
}